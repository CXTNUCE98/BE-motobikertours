import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get<string>('SMTP_PORT', '587'), 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  /**
   * Gửi email xác nhận booking
   */
  async sendBookingConfirmation(booking: Booking): Promise<void> {
    const { customerInfo, tour, startDate, numberOfPeople, totalPrice, id } =
      booking;
    const customer = JSON.parse(customerInfo as any);

    const html = this.getBookingConfirmationTemplate({
      customerName: customer.name,
      tourName: tour.title,
      startDate: new Date(startDate).toLocaleDateString('vi-VN'),
      numberOfPeople,
      totalPrice,
      bookingId: id,
    });

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'SMTP_FROM',
        '"Motobike Tours" <noreply@motobiketours.com>',
      ),
      to: customer.email,
      subject: '✅ Xác nhận đặt tour - Motobike Tours',
      html,
    });
  }

  /**
   * Gửi email hủy booking
   */
  async sendBookingCancellation(booking: Booking): Promise<void> {
    const { customerInfo, tour, id } = booking;
    const customer = JSON.parse(customerInfo as any);

    const html = this.getBookingCancellationTemplate({
      customerName: customer.name,
      tourName: tour.title,
      bookingId: id,
    });

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'SMTP_FROM',
        '"Motobike Tours" <noreply@motobiketours.com>',
      ),
      to: customer.email,
      subject: '❌ Xác nhận hủy booking - Motobike Tours',
      html,
    });
  }

  /**
   * Gửi email thanh toán thành công
   */
  async sendPaymentSuccess(booking: Booking): Promise<void> {
    const { customerInfo, tour, totalPrice, transactionId } = booking;
    const customer = JSON.parse(customerInfo as any);

    const html = this.getPaymentSuccessTemplate({
      customerName: customer.name,
      tourName: tour.title,
      amount: totalPrice,
      transactionId,
    });

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'SMTP_FROM',
        '"Motobike Tours" <noreply@motobiketours.com>',
      ),
      to: customer.email,
      subject: '💳 Thanh toán thành công - Motobike Tours',
      html,
    });
  }

  /**
   * Template: Booking Confirmation
   */
  private getBookingConfirmationTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Đặt tour thành công!</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>${data.customerName}</strong>,</p>
            <p>Cảm ơn bạn đã đặt tour tại <strong>Motobike Tours</strong>. Chúng tôi rất vui được đồng hành cùng bạn trong chuyến hành trình sắp tới!</p>
            
            <div class="booking-details">
                <h2>📋 Thông tin đặt chỗ</h2>
                <div class="detail-row">
                    <span>Mã đặt chỗ:</span>
                    <strong>${data.bookingId}</strong>
                </div>
                <div class="detail-row">
                    <span>Tour:</span>
                    <strong>${data.tourName}</strong>
                </div>
                <div class="detail-row">
                    <span>Ngày khởi hành:</span>
                    <strong>${data.startDate}</strong>
                </div>
                <div class="detail-row">
                    <span>Số người:</span>
                    <strong>${data.numberOfPeople} người</strong>
                </div>
                <div class="detail-row">
                    <span>Tổng tiền:</span>
                    <strong style="color: #667eea; font-size: 18px;">${data.totalPrice.toLocaleString('vi-VN')} VND</strong>
                </div>
            </div>

            <p><strong>🎯 Bước tiếp theo:</strong></p>
            <ul>
                <li>Đội ngũ của chúng tôi sẽ liên hệ với bạn trong vòng 24h để xác nhận chi tiết</li>
                <li>Vui lòng chuẩn bị đầy đủ giấy tờ cá nhân trước ngày khởi hành</li>
                <li>Kiểm tra email thường xuyên để nhận thông tin cập nhật</li>
            </ul>

            <center>
                <a href="${process.env.FRONTEND_URL}/profile/bookings/${data.bookingId}" class="btn">Xem chi tiết booking</a>
            </center>
        </div>
        <div class="footer">
            <p>Motobike Tours - Your Adventure Awaits!</p>
            <p>Website: www.motobiketours.com | Hotline: 1900xxxx</p>
        </div>
    </div>
</body>
</html>
`;
  }

  /**
   * Template: Booking Cancellation
   */
  private getBookingCancellationTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking đã bị hủy</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>${data.customerName}</strong>,</p>
            <p>Booking của bạn cho tour <strong>${data.tourName}</strong> (Mã: ${data.bookingId}) đã được hủy thành công.</p>
            <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua hotline hoặc email hỗ trợ.</p>
            <p>Chúng tôi hy vọng sẽ được phục vụ bạn trong tương lai!</p>
        </div>
        <div class="footer">
            <p>Motobike Tours | Hotline: 1900xxxx | Email: support@motobiketours.com</p>
        </div>
    </div>
</body>
</html>
`;
  }

  /**
   * Template: Payment Success
   */
  private getPaymentSuccessTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .amount { font-size: 32px; color: #10b981; font-weight: bold; text-align: center; margin: 20px 0; }
        .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Thanh toán thành công!</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>${data.customerName}</strong>,</p>
            <p>Thanh toán của bạn cho tour <strong>${data.tourName}</strong> đã được xử lý thành công.</p>
            
            <div class="amount">${data.amount.toLocaleString('vi-VN')} VND</div>
            
            <p><strong>Mã giao dịch:</strong> ${data.transactionId}</p>
            <p>Chúng tôi đang chuẩn bị cho chuyến đi của bạn. Bạn sẽ nhận được thêm thông tin chi tiết qua email trong thời gian sớm nhất.</p>
        </div>
        <div class="footer">
            <p>Motobike Tours - Making Memories Together!</p>
        </div>
    </div>
</body>
</html>
`;
  }
}
