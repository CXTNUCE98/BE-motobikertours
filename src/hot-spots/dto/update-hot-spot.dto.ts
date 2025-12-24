import { PartialType } from '@nestjs/swagger';
import { CreateHotSpotDto } from './create-hot-spot.dto';

export class UpdateHotSpotDto extends PartialType(CreateHotSpotDto) { }
