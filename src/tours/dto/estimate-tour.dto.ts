import { IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EstimateTourDto {
  @ApiProperty({ example: ['id1', 'id2'], description: 'List of HotSpot IDs' })
  @IsArray()
  @IsString({ each: true })
  hot_spot_ids: string[];

  @ApiProperty({ example: 'vehicle-uuid', description: 'Selected vehicle ID' })
  @IsString()
  vehicle_id: string;

  @ApiProperty({ example: 'Hanoi', description: 'Custom departure point' })
  @IsString()
  @IsOptional()
  departure_name?: string;
}
