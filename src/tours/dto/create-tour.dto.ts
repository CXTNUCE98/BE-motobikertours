import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DurationRange } from './get-tours.dto';

export class CreateTourDto {
  @ApiProperty({ example: 'Amazing Vietnam Tour', description: 'Tour title' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'amazing-vietnam-tour',
    description: 'URL‑friendly slug',
  })
  @IsString()
  @IsOptional()
  slug: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Thumbnail image file',
  })
  @IsOptional()
  thumbnail: any;

  @ApiPropertyOptional({
    example: [
      'https://res.cloudinary.com/.../img1.jpg',
      'https://res.cloudinary.com/.../img2.jpg',
    ],
    description: 'Array of image URLs (comma‑separated for SQLite)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    example: 'Explore the hidden gems of Vietnam...',
    description: 'Short description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: '<p>Full HTML content of the tour...</p>',
    description: 'Detailed content (HTML)',
  })
  @IsString()
  content: string;

  @ApiProperty({ example: 199.99, description: 'Price in USD' })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  price_usd: number;

  @ApiProperty({ example: '5 days', description: 'Duration of the tour' })
  @IsString()
  duration: string;

  @ApiProperty({
    enum: DurationRange,
    example: DurationRange.FOUR_TO_SEVEN,
    description: 'Duration range for filtering (1-3, 4-7, 8+)',
  })
  @IsEnum(DurationRange)
  duration_range: DurationRange;

  @ApiProperty({ example: 'Hanoi', description: 'Starting city' })
  @IsString()
  depart_from: string;

  @ApiProperty({
    example: 'Hanoi → Ha Long → Hue → Hoi An',
    description: 'Route description',
  })
  @IsString()
  routes: string;

  @ApiProperty({ example: 'Adventure', description: 'Tour type/category' })
  @IsString()
  type: string;

  @ApiProperty({ example: true, description: 'Featured tour flag' })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_featured: boolean;
}
