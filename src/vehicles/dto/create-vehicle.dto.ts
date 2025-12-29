import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Kia Carnival' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'SUV' })
  @IsString()
  type: string;

  @ApiProperty({ example: 7 })
  @IsNumber()
  capacity: number;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  pricePerKm: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
