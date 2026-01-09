import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for filtering and paginating bookings
 */
export class FilterBookingDto {
  @ApiProperty({
    description: 'Booking status',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    example: 'confirmed',
    required: false,
  })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'cancelled', 'completed'])
  status?: string;

  @ApiProperty({
    description: 'Payment status',
    enum: ['unpaid', 'deposit_paid', 'fully_paid'],
    example: 'fully_paid',
    required: false,
  })
  @IsOptional()
  @IsEnum(['unpaid', 'deposit_paid', 'fully_paid'])
  paymentStatus?: string;

  @ApiProperty({
    description: 'User ID to filter bookings',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Tour ID to filter bookings',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsOptional()
  @IsString()
  tourId?: string;

  @ApiProperty({
    description: 'Start date range filter (ISO 8601)',
    example: '2026-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    description: 'End date range filter (ISO 8601)',
    example: '2026-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: '1',
    default: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({
    description: 'Number of items per page',
    example: '10',
    default: '10',
    required: false,
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'startDate', 'totalPrice'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string; // createdAt, startDate, totalPrice

  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
