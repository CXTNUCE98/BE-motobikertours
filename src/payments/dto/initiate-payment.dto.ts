import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'Booking ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsNotEmpty()
  @IsString()
  bookingId: string;

  @ApiProperty({
    description: 'Payment method',
    enum: ['vnpay', 'momo', 'cash'],
    example: 'vnpay',
  })
  @IsNotEmpty()
  @IsEnum(['vnpay', 'momo', 'cash'])
  paymentMethod: string;

  @ApiProperty({
    description: 'IP address của khách hàng',
    example: '127.0.0.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddr?: string;
}
