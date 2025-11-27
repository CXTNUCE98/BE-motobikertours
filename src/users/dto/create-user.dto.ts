import {
  IsEmail,
  IsString,
  MinLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'admin',
    description: 'Username',
  })
  @IsString()
  userName: string;

  @ApiProperty({
    example: 'admin@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd',
    description: 'User password (min 6 chars)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: false,
    description: 'Is user an admin',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @ApiProperty({
    example: 'Asia/Ho_Chi_Minh',
    description: 'User timezone',
    default: 'Asia/Ho_Chi_Minh',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({
    example: '',
    description: 'User avatar URL',
    default: '',
  })
  @IsString()
  @IsOptional()
  avatar?: string;
}
