import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  Min,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Customer information for booking
 */
export class CustomerInfoDto {
  @ApiProperty({
    description: 'Customer full name',
    example: 'Nguyễn Văn A',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'nguyenvana@gmail.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '0901234567',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Customer address (optional)',
    example: '123 Nguyen Trai, District 1, HCMC',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}

/**
 * DTO for creating a new booking
 */
export class CreateBookingDto {
  @ApiProperty({
    description: 'Tour ID to book',
    example: '507f1f77bcf86cd799439012',
  })
  @IsNotEmpty({ message: 'Tour ID is required' })
  @IsString()
  tourId: string;

  @ApiProperty({
    description: 'Tour start date (ISO 8601)',
    example: '2026-02-15',
  })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString({}, { message: 'Invalid start date format' })
  startDate: string;

  @ApiProperty({
    description: 'Number of people',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'Number of people is required' })
  @IsNumber({}, { message: 'Number of people must be a number' })
  @Min(1, { message: 'Minimum 1 person required' })
  numberOfPeople: number;

  @ApiProperty({
    description: 'Payment method',
    enum: ['vnpay', 'momo', 'stripe', 'cash'],
    example: 'vnpay',
  })
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(['vnpay', 'momo', 'stripe', 'cash'], {
    message: 'Invalid payment method',
  })
  paymentMethod: string;

  @ApiProperty({
    description: 'Special requests or notes (optional)',
    example: 'Vegetarian meals required',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiProperty({
    description: 'Customer information',
    type: CustomerInfoDto,
    example: {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0901234567',
      address: '123 Nguyen Trai, District 1, HCMC',
    },
  })
  @IsNotEmpty({ message: 'Customer information is required' })
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;

  @ApiProperty({
    description: 'Voucher code for discount (optional)',
    example: 'SUMMER2026',
    required: false,
  })
  @IsOptional()
  @IsString()
  voucherCode?: string;
}
