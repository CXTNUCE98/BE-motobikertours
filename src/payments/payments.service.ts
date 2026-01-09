import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Payment } from '../bookings/entities/payment.entity';
import { VnPayService } from './gateways/vnpay.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private vnPayService: VnPayService,
    private emailService: EmailService,
  ) {}

  /**
   * Khởi tạo thanh toán
   */
  async initiatePayment(dto: InitiatePaymentDto) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: dto.bookingId },
      relations: ['tour', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    // Check booking status
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking đã bị hủy');
    }

    if (booking.paymentStatus === 'fully_paid') {
      throw new BadRequestException('Booking đã được thanh toán đầy đủ');
    }

    // Tạo payment record
    const payment = this.paymentsRepository.create({
      booking,
      amount: booking.totalPrice,
      paymentMethod: dto.paymentMethod,
      status: 'pending',
      transactionId: `${booking.id}_${Date.now()}`,
    });

    await this.paymentsRepository.save(payment);

    // Generate payment URL based on method
    let paymentUrl: string;

    switch (dto.paymentMethod) {
      case 'vnpay':
        paymentUrl = this.vnPayService.createPaymentUrl(
          booking.id,
          booking.totalPrice,
          `Thanh toán booking ${booking.tour.title}`,
          dto.ipAddr,
        );
        break;

      case 'momo':
        // TODO: Implement Momo
        throw new BadRequestException('Momo chưa được hỗ trợ');

      case 'cash':
        // Cash không cần payment URL
        return {
          success: true,
          paymentMethod: 'cash',
          message: 'Thanh toán bằng tiền mặt khi nhận tour',
        };

      default:
        throw new BadRequestException('Phương thức thanh toán không hợp lệ');
    }

    // Update booking với transaction ID
    booking.transactionId = payment.transactionId;
    await this.bookingsRepository.save(booking);

    return {
      success: true,
      paymentUrl,
      paymentMethod: dto.paymentMethod,
      transactionId: payment.transactionId,
    };
  }

  /**
   * Xử lý callback từ VNPay
   */
  async handleVnPayCallback(params: any) {
    // Verify callback signature
    const isValid = this.vnPayService.verifyCallback(params);

    if (!isValid) {
      throw new BadRequestException('Chữ ký không hợp lệ');
    }

    const bookingId = params.vnp_TxnRef;
    const responseCode = params.vnp_ResponseCode;
    const transactionNo = params.vnp_TransactionNo;
    const amount = parseInt(params.vnp_Amount) / 100;

    // Parse response
    const result = this.vnPayService.parseResponseCode(responseCode);

    // Find booking
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    // Find payment
    const payment = await this.paymentsRepository.findOne({
      where: {
        booking: { id: bookingId },
        status: 'pending',
      },
      order: { createdAt: 'DESC' },
    });

    if (result.success) {
      // Payment success
      if (payment) {
        payment.status = 'success';
        payment.transactionId = transactionNo;
        payment.gatewayResponse = params;
        await this.paymentsRepository.save(payment);
      }

      // Update booking
      booking.status = 'confirmed';
      booking.paymentStatus = 'fully_paid';
      booking.depositPaid = amount;
      booking.transactionId = transactionNo;
      await this.bookingsRepository.save(booking);

      // TODO: Send confirmation email
      try {
        await this.emailService.sendBookingConfirmation(booking);
        await this.emailService.sendPaymentSuccess(booking);
      } catch (emailError) {
        // Log email error but don't fail the transaction
        console.error('Email sending failed:', emailError);
      }

      return {
        success: true,
        bookingId,
        message: result.message,
      };
    } else {
      // Payment failed
      if (payment) {
        payment.status = 'failed';
        payment.gatewayResponse = params;
        await this.paymentsRepository.save(payment);
      }

      return {
        success: false,
        bookingId,
        message: result.message,
      };
    }
  }

  /**
   * Lấy thông tin payment của booking
   */
  async getBookingPayments(bookingId: string) {
    return this.paymentsRepository.find({
      where: { booking: { id: bookingId } },
      order: { createdAt: 'DESC' },
    });
  }
}
