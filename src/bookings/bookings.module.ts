import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Tour } from '../tours/entities/tour.entity';
import { Voucher } from './entities/voucher.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { VoucherValidationService } from './voucher-validation.service';
import { RefundService } from './refund.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

/**
 * Module Bookings - Quản lý đặt chỗ tour
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Payment, Tour, Voucher]),
    NotificationsModule,
    AuditLogModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, VoucherValidationService, RefundService],
  exports: [BookingsService],
})
export class BookingsModule {}
