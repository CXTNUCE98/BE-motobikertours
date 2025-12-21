import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { GetToursDto } from './dto/get-tours.dto';
import { Query, Patch, Delete } from '@nestjs/common';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) { }

  @Get()
  @ApiOperation({ summary: 'Get all tours' })
  @ApiResponse({ status: 200, description: 'Return all tours' })
  findAll(@Query() query: GetToursDto) {
    return this.toursService.findAll(query);
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
  @ApiBody({
    description: 'Tour data with thumbnail and images',
    type: CreateTourDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The tour has been successfully created.',
  })
  create(@Body() createTourDto: CreateTourDto) {
    return this.toursService.create(createTourDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tour' })
  @ApiBody({
    description: 'Tour data to update',
    type: UpdateTourDto,
  })
  @ApiResponse({
    status: 200,
    description: 'The tour has been successfully updated.',
  })
  update(@Param('id') id: string, @Body() updateTourDto: UpdateTourDto) {
    return this.toursService.update(id, updateTourDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tour' })
  @ApiResponse({
    status: 200,
    description: 'The tour has been successfully deleted.',
  })
  remove(@Param('id') id: string) {
    return this.toursService.remove(id);
  }
}
