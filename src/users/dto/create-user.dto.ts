import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'P@ssw0rd', description: 'User password (min 6 chars)' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
    @IsString()
    name: string;
}
