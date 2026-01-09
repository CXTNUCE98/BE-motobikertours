import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Khởi tạo thanh toán' })
  @ApiResponse({ status: 200, description: 'Payment URL được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Booking không tồn tại' })
  async initiatePayment(@Body() dto: InitiatePaymentDto, @Req() req: Request) {
    // Get IP address from request
    const ipAddr = req.ip || req.connection.remoteAddress || '127.0.0.1';
    dto.ipAddr = ipAddr;

    return this.paymentsService.initiatePayment(dto);
  }

  @Get('vnpay/callback')
  @ApiOperation({ summary: 'VNPay callback endpoint' })
  @ApiResponse({ status: 302, description: 'Redirect to success/failed page' })
  async vnpayCallback(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.paymentsService.handleVnPayCallback(query);

      if (result.success) {
        // Redirect to success page
        return res.redirect(
          `${process.env.FRONTEND_URL}/booking/success?id=${result.bookingId}`,
        );
      } else {
        // Redirect to failed page
        return res.redirect(
          `${process.env.FRONTEND_URL}/booking/failed?id=${result.bookingId}&message=${encodeURIComponent(result.message)}`,
        );
      }
    } catch (error) {
      // Redirect to failed page with error
      return res.redirect(
        `${process.env.FRONTEND_URL}/booking/failed?message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Lấy payment history của booking' })
  @ApiResponse({ status: 200, description: 'Payment history' })
  async getBookingPayments(@Query('bookingId') bookingId: string) {
    return this.paymentsService.getBookingPayments(bookingId);
  }
}
