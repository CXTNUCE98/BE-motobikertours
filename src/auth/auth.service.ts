import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      console.log('Validating user with email:', email);
      const user = await this.usersService.findOne(email);
      console.log('User found:', user ? 'Yes' : 'No');
      if (!user) {
        console.log('User not found in database');
        return null;
      }
      console.log('Comparing password...');
      const isPasswordValid = await bcrypt.compare(pass, user.password);
      console.log('Password valid:', isPasswordValid);
      if (!isPasswordValid) {
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    } catch (error) {
      console.error('Error validating user:', error);
      console.error('Error stack:', error.stack);
      return null;
    }
  }

  async login(user: any) {
    try {
      console.log('Creating JWT token for user:', user.id);
      const payload = {
        userName: user.userName,
        email: user.email,
        sub: user.id,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
      };
      const token = this.jwtService.sign(payload);
      console.log('JWT token created successfully');
      return {
        access_token: token,
      };
    } catch (error) {
      console.error('Error creating JWT token:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async register(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existing = await this.usersService.findOne(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashed,
    });
    return this.login(user);
  }
}
