import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) { }

  @Get()
  @ApiOperation({ summary: 'Get all tours' })
  @ApiResponse({ status: 200, description: 'Return all tours' })
  findAll() {
    return this.toursService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tour by id' })
  @ApiResponse({ status: 200, description: 'Return tour by id' })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tour' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Tour data with thumbnail image',
    type: CreateTourDto,
  })
  @ApiResponse({ status: 201, description: 'The tour has been successfully created.' })
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(
    @Body() createTourDto: CreateTourDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.toursService.create(createTourDto, file);
  }
}
