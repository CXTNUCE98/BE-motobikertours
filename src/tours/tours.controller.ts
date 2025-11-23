import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Get()
  findAll() {
    return this.toursService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(
    @Body() createTourDto: CreateTourDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.toursService.create(createTourDto, file);
  }
}
