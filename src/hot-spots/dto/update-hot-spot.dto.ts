import { PartialType } from '@nestjs/mapped-types';
import { CreateHotSpotDto } from './create-hot-spot.dto';

export class UpdateHotSpotDto extends PartialType(CreateHotSpotDto) {}
