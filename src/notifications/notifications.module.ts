import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, InvoiceService],
  exports: [EmailService, InvoiceService],
})
export class NotificationsModule {}
