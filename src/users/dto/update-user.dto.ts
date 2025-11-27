import {
  IsOptional,
  IsString,
  MinLength,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Username for the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123',
    description: 'New password (minimum 6 characters)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    example: true,
    description: 'Admin status of the user',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiProperty({
    example: 'America/New_York',
    description: 'Timezone of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
    description: 'Avatar URL of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
