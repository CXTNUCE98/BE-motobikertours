import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from './entities/voucher.entity';

@Injectable()
export class VoucherValidationService {
  constructor(
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
  ) {}

  async validateVoucher(code: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { code, isActive: true },
    });
    if (!voucher) throw new BadRequestException('Voucher code not found');
    if (voucher.expiresAt && voucher.expiresAt < new Date())
      throw new BadRequestException('Voucher has expired');
    if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses)
      throw new BadRequestException('Voucher usage limit reached');
    return voucher;
  }

  calculateDiscount(voucher: Voucher, totalPrice: number): number {
    if (voucher.discountType === 'percentage') {
      return totalPrice * (Number(voucher.discountValue) / 100);
    }
    return Math.min(Number(voucher.discountValue), totalPrice);
  }
}
