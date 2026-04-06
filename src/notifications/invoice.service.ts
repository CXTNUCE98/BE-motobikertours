import { Injectable } from '@nestjs/common';
import { Booking } from '../bookings/entities/booking.entity';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoiceService {
  /**
   * Generate invoice PDF for booking
   */
  async generateInvoicePDF(booking: Booking): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        // Collect PDF data
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        const customerInfo = JSON.parse(booking.customerInfo as any);

        // Header
        doc
          .fontSize(24)
          .fillColor('#667eea')
          .text('HÓA ĐƠN BOOKING', { align: 'center' })
          .moveDown();

        // Company Info
        doc
          .fontSize(10)
          .fillColor('#333333')
          .text('MOTOBIKE TOURS', { align: 'center' })
          .text('Địa chỉ: 123 Street, HCMC, Vietnam', { align: 'center' })
          .text('Hotline: 1900 xxxx | Email: info@motobiketours.com', {
            align: 'center',
          })
          .moveDown(2);

        // Invoice Info
        doc
          .fontSize(12)
          .fillColor('#333333')
          .text(`Số hóa đơn: ${booking.id}`, 50, doc.y)
          .text(
            `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`,
            350,
            doc.y - 12,
          )
          .moveDown();

        // Line separator
        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .strokeColor('#dddddd')
          .stroke()
          .moveDown();

        // Customer Info
        doc
          .fontSize(14)
          .fillColor('#667eea')
          .text('THÔNG TIN KHÁCH HÀNG')
          .moveDown(0.5);

        doc
          .fontSize(10)
          .fillColor('#333333')
          .text(`Họ tên: ${customerInfo.name}`)
          .text(`Email: ${customerInfo.email}`)
          .text(`Điện thoại: ${customerInfo.phone}`)
          .text(`Địa chỉ: ${customerInfo.address || 'N/A'}`)
          .moveDown(2);

        // Tour Info
        doc
          .fontSize(14)
          .fillColor('#667eea')
          .text('THÔNG TIN TOUR')
          .moveDown(0.5);

        doc
          .fontSize(10)
          .fillColor('#333333')
          .text(`Tour: ${booking.tour.title}`)
          .text(
            `Ngày khởi hành: ${new Date(booking.startDate).toLocaleDateString('vi-VN')}`,
          )
          .text(`Số người: ${booking.numberOfPeople}`)
          .text(
            `Phương thức thanh toán: ${this.getPaymentMethodName(booking.paymentMethod)}`,
          )
          .moveDown(2);

        // Special Requests
        if (booking.specialRequests) {
          doc
            .fontSize(14)
            .fillColor('#667eea')
            .text('YÊU CẦU ĐẶC BIỆT')
            .moveDown(0.5);

          doc
            .fontSize(10)
            .fillColor('#333333')
            .text(booking.specialRequests)
            .moveDown(2);
        }

        // Line separator
        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .strokeColor('#dddddd')
          .stroke()
          .moveDown();

        // Pricing Table Header
        const tableTop = doc.y;
        doc
          .fontSize(12)
          .fillColor('#667eea')
          .text('Mô tả', 50, tableTop)
          .text('Số lượng', 300, tableTop)
          .text('Đơn giá', 400, tableTop)
          .text('Thành tiền', 480, tableTop, { align: 'right' });

        // Line under header
        doc
          .moveTo(50, tableTop + 20)
          .lineTo(550, tableTop + 20)
          .strokeColor('#dddddd')
          .stroke();

        // Pricing Table Content
        const pricePerPerson = booking.totalPrice / booking.numberOfPeople;
        doc
          .fontSize(10)
          .fillColor('#333333')
          .text('Tour du lịch', 50, tableTop + 30)
          .text(booking.numberOfPeople.toString(), 300, tableTop + 30)
          .text(this.formatCurrency(pricePerPerson), 400, tableTop + 30)
          .text(this.formatCurrency(booking.totalPrice), 480, tableTop + 30, {
            align: 'right',
          });

        // Total
        doc
          .moveTo(50, tableTop + 60)
          .lineTo(550, tableTop + 60)
          .strokeColor('#dddddd')
          .stroke();

        doc
          .fontSize(14)
          .fillColor('#667eea')
          .text('TỔNG CỘNG:', 400, tableTop + 70)
          .text(this.formatCurrency(booking.totalPrice), 480, tableTop + 70, {
            align: 'right',
          });

        // Payment Status
        doc.moveDown(3);
        const paymentStatus = this.getPaymentStatusText(booking.paymentStatus);
        const statusColor =
          booking.paymentStatus === 'fully_paid' ? '#10b981' : '#f59e0b';

        doc
          .fontSize(12)
          .fillColor(statusColor)
          .text(`Trạng thái thanh toán: ${paymentStatus}`, {
            align: 'center',
          });

        if (booking.transactionId) {
          doc
            .fontSize(10)
            .fillColor('#666666')
            .text(`Mã giao dịch: ${booking.transactionId}`, {
              align: 'center',
            });
        }

        // Footer
        doc
          .moveDown(4)
          .fontSize(10)
          .fillColor('#999999')
          .text('Cảm ơn quý khách đã sử dụng dịch vụ của Motobike Tours!', {
            align: 'center',
          })
          .text('Chúc quý khách có chuyến đi vui vẻ!', { align: 'center' });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper: Format currency
   */
  private formatCurrency(amount: number): string {
    return `${amount.toLocaleString('vi-VN')} VND`;
  }

  /**
   * Helper: Get payment method name
   */
  private getPaymentMethodName(method: string): string {
    const methods: Record<string, string> = {
      vnpay: 'VNPay',
      momo: 'MoMo',
      cash: 'Tiền mặt',
    };
    return methods[method] || method;
  }

  /**
   * Helper: Get payment status text
   */
  private getPaymentStatusText(status: string): string {
    const statuses: Record<string, string> = {
      unpaid: 'Chưa thanh toán',
      deposit_paid: 'Đã đặt cọc',
      fully_paid: 'Đã thanh toán đầy đủ',
    };
    return statuses[status] || status;
  }
}
