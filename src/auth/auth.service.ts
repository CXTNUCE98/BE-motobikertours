import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      this.logger.debug('Validating user with email:' + email);
      const user = await this.usersService.findOne(email);
      this.logger.debug('User found:' + (user ? 'Yes' : 'No'));
      if (!user) {
        this.logger.debug('User not found in database');
        return null;
      }
      this.logger.debug('Comparing password...');
      const isPasswordValid = await bcrypt.compare(pass, user.password);
      this.logger.debug('Password valid:' + isPasswordValid);
      if (!isPasswordValid) {
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error('Error validating user:', error.stack);
      return null;
    }
  }

  async login(user: any) {
    try {
      this.logger.debug('Creating JWT token for user:' + user.id);
      const payload = {
        userName: user.userName,
        email: user.email,
        sub: user.id,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
      };
      const token = this.jwtService.sign(payload);
      this.logger.debug('JWT token created successfully');
      return {
        accessToken: token,
      };
    } catch (error) {
      this.logger.error('Error creating JWT token:', error.stack);
      throw error;
    }
  }

  async register(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingEmail = await this.usersService.findOne(createUserDto.email);
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if userName already exists
    const existingUserName = await this.usersService.findByUserName(createUserDto.userName);
    if (existingUserName) {
      throw new ConflictException('Username already registered');
    }
    const hashed = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashed,
    });
    return this.login(user);
  }
}
