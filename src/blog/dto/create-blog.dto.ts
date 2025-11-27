import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export enum BlogStatus {
  WAITING = 'waiting',
  PUBLISHED = 'published',
  DRAFT = 'draft',
}

export class CreateBlogDto {
  @ApiProperty({ example: 'Digital right managements' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'vi' })
  @IsString()
  @IsNotEmpty()
  lang: string;

  @ApiProperty({ example: 'image-j_muyWVa' })
  @IsString()
  @IsNotEmpty()
  thumbnail: string;

  @ApiProperty({ example: '21421412421' })
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty({
    example:
      '<p>Content here...</p><figure class="image"><img src="image-BIZu3Aad"></figure>',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: ['2412421'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: 9 })
  @IsNumber()
  numWords: number;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ enum: BlogStatus, example: BlogStatus.WAITING })
  @IsEnum(BlogStatus)
  status: string;

  @ApiProperty({
    example: {
      authId: 'uuid-123',
      avatar: 'image-url',
      userName: 'admin',
    },
  })
  @IsNotEmpty()
  author: {
    authId: string;
    avatar: string;
    userName: string;
  };
}
