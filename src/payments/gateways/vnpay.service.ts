import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as querystring from 'querystring';

@Injectable()
export class VnPayService {
  private readonly tmnCode: string;
  private readonly secretKey: string;
  private readonly vnpUrl: string;
  private readonly returnUrl: string;

  constructor(private configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    this.secretKey = this.configService.get<string>('VNPAY_SECRET_KEY');
    this.vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = this.configService.get<string>('VNPAY_RETURN_URL');
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  createPaymentUrl(
    bookingId: string,
    amount: number,
    orderInfo: string,
    ipAddr: string = '127.0.0.1',
  ): string {
    const createDate = this.formatDate(new Date());

    // VNPay params
    const vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: Math.round(amount * 100), // VNPay yêu cầu amount * 100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: bookingId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort params và tạo query string
    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams);

    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', this.secretKey);
    const secureHash = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    // Tạo URL cuối cùng
    return `${this.vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;
  }

  /**
   * Xác thực callback từ VNPay
   */
  verifyCallback(params: any): boolean {
    const secureHash = params.vnp_SecureHash;

    // Remove hash params
    const vnpParams = { ...params };
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Sort và tạo sign data
    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams);

    // Verify hash
    const hmac = crypto.createHmac('sha512', this.secretKey);
    const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === checkSum;
  }

  /**
   * Parse payment status từ response code
   */
  parseResponseCode(code: string): { success: boolean; message: string } {
    const responseCodes: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
    };

    return {
      success: code === '00',
      message: responseCodes[code] || 'Lỗi không xác định',
    };
  }

  /**
   * Helper: Format date cho VNPay
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Helper: Sort object keys alphabetically
   */
  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
      sorted[key] = obj[key];
    });

    return sorted;
  }
}
