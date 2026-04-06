import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, string> = new Map();

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
   * Load template from file, with caching.
   * Returns the raw template string with {{placeholders}}.
   */
  loadTemplate(templateName: string): string {
    const cached = this.templateCache.get(templateName);
    if (cached) {
      return cached;
    }

    const templatePath = path.join(__dirname, 'templates', templateName);

    try {
      const content = fs.readFileSync(templatePath, 'utf-8');
      this.templateCache.set(templateName, content);
      return content;
    } catch (error) {
      this.logger.error(
        `Failed to load email template "${templateName}": ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Email template "${templateName}" not found`,
      );
    }
  }

  /**
   * Replace all {{key}} placeholders in template with values from data object.
   */
  renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return key in data ? String(data[key]) : match;
    });
  }

  /**
   * Gửi email xác nhận booking
   */
  async sendBookingConfirmation(booking: Booking): Promise<void> {
    const { customerInfo, tour, startDate, numberOfPeople, totalPrice, id } =
      booking;
    const customer = JSON.parse(customerInfo as any);

    const template = this.loadTemplate('booking-confirmation.html');
    const html = this.renderTemplate(template, {
      customerName: customer.name,
      tourName: tour.title,
      startDate: new Date(startDate).toLocaleDateString('vi-VN'),
      numberOfPeople,
      totalPrice: totalPrice.toLocaleString('vi-VN'),
      bookingId: id,
      frontendUrl: process.env.FRONTEND_URL || '',
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

    const template = this.loadTemplate('booking-cancellation.html');
    const html = this.renderTemplate(template, {
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

    const template = this.loadTemplate('payment-success.html');
    const html = this.renderTemplate(template, {
      customerName: customer.name,
      tourName: tour.title,
      amount: totalPrice.toLocaleString('vi-VN'),
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
}
