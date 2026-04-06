import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { GetToursDto } from './dto/get-tours.dto';
import { EstimateTourDto } from './dto/estimate-tour.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tours' })
  @ApiResponse({ status: 200, description: 'Return all tours' })
  findAll(@Query() query: GetToursDto) {
    return this.toursService.findAll(query);
  }

  @Get('admin/deleted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all soft-deleted tours (admin only)' })
  @ApiResponse({ status: 200, description: 'Return soft-deleted tours' })
  findDeleted() {
    return this.toursService.findDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tour by id' })
  @ApiResponse({ status: 200, description: 'Return tour by id' })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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

  @Patch('admin/:id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Restore a soft-deleted tour (admin only)' })
  @ApiResponse({ status: 200, description: 'Tour restored successfully' })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  restore(@Param('id') id: string) {
    return this.toursService.restore(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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

  @Post('estimate')
  @ApiOperation({ summary: 'Calculate estimated price and route' })
  @ApiBody({ type: EstimateTourDto })
  @ApiResponse({ status: 200, description: 'Return estimation' })
  estimate(@Body() estimateDto: EstimateTourDto) {
    return this.toursService.estimate(estimateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a tour' })
  @ApiResponse({
    status: 200,
    description: 'The tour has been successfully deleted.',
  })
  remove(@Param('id') id: string) {
    return this.toursService.remove(id);
  }
}
