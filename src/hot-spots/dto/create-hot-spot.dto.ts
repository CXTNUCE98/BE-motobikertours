import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotSpotDto {
  @ApiProperty({ example: 'Cầu Vàng - Bà Nà Hills' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Cây cầu biểu tượng với đôi bàn tay khổng lồ nâng đỡ.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Cảnh đẹp' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 4.8 })
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiProperty({ example: 'Hòa Vang, Đà Nẵng' })
  @IsString()
  address: string;

  @ApiProperty({ example: 15.9989 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 107.9961 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({
    example: [
      'https://vietnam.travel/sites/default/files/styles/top_banner/public/2021-07/Golden%20Bridge%20Da%20Nang.jpg',
    ],
  })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: '08:00 - 22:00' })
  @IsString()
  @IsOptional()
  openingHours?: string;

  @ApiPropertyOptional({ example: '850.000đ - 1.050.000đ' })
  @IsString()
  @IsOptional()
  priceInfo?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isHot?: boolean;
}
