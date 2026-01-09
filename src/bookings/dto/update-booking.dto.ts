import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateBookingDto } from './create-booking.dto';

/**
 * DTO for updating a booking
 */
export class UpdateBookingDto extends PartialType(CreateBookingDto) {
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
    description: 'Transaction ID from payment gateway',
    example: 'TXN202601091234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
