import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Tour } from '../tours/entities/tour.entity';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Module Bookings - Quản lý đặt chỗ tour
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Payment, Tour]),
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
