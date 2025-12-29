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
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { DurationRange } from './get-tours.dto';

export class ItineraryDto {
  @ApiProperty({ description: 'UUID of the hot spot' })
  @IsString()
  hotSpotId: string;

  @ApiPropertyOptional({ description: 'Order of specific activity' })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Description of what to do here' })
  @IsString()
  @IsOptional()
  activityDescription?: string;

  @ApiPropertyOptional({ description: 'Estimated time spent in minutes' })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;
}

export class CreateTourDto {
  @ApiProperty({ example: 'Amazing Vietnam Tour', description: 'Tour title' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/.../thumb.jpg',
    description: 'Thumbnail image URL',
  })
  @IsString()
  thumbnail: string;

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
  priceUsd: number;

  @ApiPropertyOptional({ example: 10, description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : 0))
  discount?: number;

  @ApiProperty({ example: '5 days', description: 'Duration of the tour' })
  @IsString()
  duration: string;

  @ApiProperty({
    enum: DurationRange,
    example: DurationRange.FOUR_TO_SEVEN,
    description: 'Duration range for filtering (1-3, 4-7, 8+)',
  })
  @IsEnum(DurationRange)
  durationRange: DurationRange;

  @ApiProperty({ example: 'Hanoi', description: 'Starting city' })
  @IsString()
  departFrom: string;

  @ApiProperty({
    example: 'Hanoi → Ha Long → Hue → Hoi An',
    description: 'Route description',
  })
  @IsString()
  routes: string;

  @ApiProperty({
    example: ['Adventure', 'Nature'],
    description: 'Tour type/category',
  })
  @IsArray()
  @IsString({ each: true })
  type: string[];

  @ApiProperty({ example: true, description: 'Featured tour flag' })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return Boolean(value);
  })
  isFeatured: boolean;

  @ApiPropertyOptional({
    type: [ItineraryDto],
    description: 'List of itinerary items',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDto)
  itineraries?: ItineraryDto[];

  @ApiPropertyOptional({ description: 'Recommended vehicle for this tour' })
  @IsString()
  @IsOptional()
  suggestedVehicleId?: string;
}
