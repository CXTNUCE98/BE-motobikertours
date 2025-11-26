import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT Access Token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20iLCJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpc0FkbWluIjpmYWxzZSwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDM2MDB9.signature',
  })
  access_token: string;
}

/**
 * JWT Payload Structure (when decoded):
 * {
 *   "username": "admin",
 *   "email": "admin@gmail.com",
 *   "sub": "550e8400-e29b-41d4-a716-446655440000",
 *   "isAdmin": false,
 *   "avatar": "",
 *   "iat": 1700000000,
 *   "exp": 1700003600
 * }
 */
