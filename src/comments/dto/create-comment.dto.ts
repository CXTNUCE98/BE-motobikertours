import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'uuid-blog-123' })
  @IsUUID()
  @IsNotEmpty()
  blogId: string;

  @ApiProperty({
    example: 'This is a great article! Thanks for sharing.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: {
      authId: 'uuid-123',
      avatar: 'https://example.com/avatar.jpg',
      userName: 'john_doe',
    },
  })
  @IsNotEmpty()
  author: {
    authId: string;
    avatar: string;
    userName: string;
  };

  @ApiProperty({
    example: null,
    description: 'Parent comment ID for nested replies',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
