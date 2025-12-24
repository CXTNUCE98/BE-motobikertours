import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateHotSpotDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  category: string;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsString()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  opening_hours?: string;

  @IsString()
  @IsOptional()
  price_info?: string;

  @IsBoolean()
  @IsOptional()
  is_hot?: boolean;
}
