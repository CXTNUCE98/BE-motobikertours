import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.debug('Login attempt for email:' + loginDto.email);
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      if (!user) {
        this.logger.debug('Invalid credentials for email:' + loginDto.email);
        throw new UnauthorizedException('Invalid email or password');
      }
      this.logger.debug('Login successful for user:' + user.id);
      return this.authService.login(user);
    } catch (error) {
      this.logger.error('Login error:', error?.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Log full error for debugging
      this.logger.error(
        'Unexpected error during login:',
        error?.stack,
      );
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
