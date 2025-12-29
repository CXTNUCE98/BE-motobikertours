import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum DurationRange {
  ONE_TO_THREE = '1-3',
  FOUR_TO_SEVEN = '4-7',
  EIGHT_PLUS = '8+',
}

export class GetToursDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({
    enum: DurationRange,
    description: 'Duration range (1-3, 4-7, 8+)',
  })
  @IsOptional()
  @IsEnum(DurationRange)
  durationRange?: DurationRange;

  @ApiPropertyOptional({
    description: 'Filter by tour types (comma separated)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim());
    }
    return value;
  })
  type?: string[];

  @ApiPropertyOptional({
    description: 'Filter by departure city (comma separated)',
    example: 'Hanoi,Da Nang',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim());
    }
    return value;
  })
  departFrom?: string[];

  @ApiPropertyOptional({
    description: 'Filter by featured tours',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isFeatured?: boolean;
}
