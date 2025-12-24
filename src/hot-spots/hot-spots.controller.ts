import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { HotSpotsService } from './hot-spots.service';
import { CreateHotSpotDto } from './dto/create-hot-spot.dto';
import { UpdateHotSpotDto } from './dto/update-hot-spot.dto';
import { GetHotSpotsDto } from './dto/get-hot-spots.dto';

@Controller('hot-spots')
export class HotSpotsController {
  constructor(private readonly hotSpotsService: HotSpotsService) {}

  @Post()
  executeCreate(@Body() createHotSpotDto: CreateHotSpotDto) {
    return this.hotSpotsService.executeCreate(createHotSpotDto);
  }

  @Get()
  executeFindAll(@Query() query: GetHotSpotsDto) {
    return this.hotSpotsService.executeFindAll(query);
  }

  @Get(':id')
  executeFindOne(@Param('id') id: string) {
    return this.hotSpotsService.executeFindOne(id);
  }

  @Patch(':id')
  executeUpdate(
    @Param('id') id: string,
    @Body() updateHotSpotDto: UpdateHotSpotDto,
  ) {
    return this.hotSpotsService.executeUpdate(id, updateHotSpotDto);
  }

  @Delete(':id')
  executeRemove(@Param('id') id: string) {
    return this.hotSpotsService.executeRemove(id);
  }
}
