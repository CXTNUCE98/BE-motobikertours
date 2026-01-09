import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Controller handling API endpoints for bookings
 */
@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * POST /bookings - Create new booking
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create new booking',
    description: 'Create a new booking for authenticated user',
  })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBooking(
    @Request() req,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(req.user.id, createBookingDto);
  }

  /**
   * GET /bookings - Get list of bookings (Admin)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get all bookings (Admin only)',
    description:
      'Retrieve paginated list of all bookings with optional filters',
  })
  @ApiResponse({ status: 200, description: 'List retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getBookingsList(@Query() filterBookingDto: FilterBookingDto) {
    return this.bookingsService.getBookingsList(filterBookingDto, null, true);
  }

  /**
   * GET /bookings/my-bookings - Get current user's bookings
   */
  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get my bookings',
    description:
      'Retrieve paginated list of current user bookings with optional filters',
  })
  @ApiResponse({ status: 200, description: 'List retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyBookings(
    @Request() req,
    @Query() filterBookingDto: FilterBookingDto,
  ) {
    return this.bookingsService.getMyBookings(req.user.id, filterBookingDto);
  }

  /**
   * GET /bookings/:id - Get booking  detail
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getBookingDetail(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.bookingsService.getBookingDetail(id, req.user.id, isAdmin);
  }

  /**
   * PATCH /bookings/:id - Update booking
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateBooking(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.bookingsService.updateBooking(
      id,
      updateBookingDto,
      req.user.id,
      isAdmin,
    );
  }

  /**
   * POST /bookings/:id/confirm - Confirm booking (Admin)
   */
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async confirmBooking(@Param('id') id: string) {
    return this.bookingsService.confirmBooking(id);
  }

  /**
   * POST /bookings/:id/cancel - Cancel booking
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelBooking(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.bookingsService.cancelBooking(id, req.user.id, isAdmin);
  }

  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Download booking invoice PDF',
    description: 'Generate and download PDF invoice for a booking',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice PDF downloaded successfully',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async generateInvoice(@Param('id') id: string, @Request() req, @Res() res) {
    const isAdmin = req.user.role === 'ADMIN';
    const pdf = await this.bookingsService.generateInvoice(
      id,
      req.user.id,
      isAdmin,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${id}.pdf`,
    });

    res.send(pdf);
  }
}
