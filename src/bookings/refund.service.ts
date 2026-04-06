import { Injectable, BadRequestException } from '@nestjs/common';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';

@Injectable()
export class RefundService {
  calculateRefundAmount(
    depositPaid: number,
    hoursToDeparture: number,
    isAdmin: boolean,
  ): { refundPercent: number; refundAmount: number } {
    let refundPercent = 0;
    if (isAdmin || hoursToDeparture >= 48) {
      refundPercent = 100;
    } else if (hoursToDeparture >= 24) {
      refundPercent = 50;
    } else {
      throw new BadRequestException('Cannot cancel within 24 hours of departure');
    }
    return {
      refundPercent,
      refundAmount: (depositPaid * refundPercent) / 100,
    };
  }

  createRefundPaymentEntity(
    booking: Booking,
    refundAmount: number,
  ): Partial<Payment> {
    return {
      booking,
      amount: refundAmount,
      paymentMethod: booking.paymentMethod,
      status: 'refund_pending',
      transactionId: `refund_${booking.id}_${Date.now()}`,
    };
  }
}
