import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Tour } from '../tours/entities/tour.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
  ) {}

  /**
   * Thêm hoặc xóa một tour khỏi danh sách yêu thích (Toggle).
   */
  async toggleWishlist({
    userId,
    tourId,
  }: {
    userId: string;
    tourId: string;
  }): Promise<{ isWishlisted: boolean }> {
    const tour = await this.tourRepository.findOne({ where: { id: tourId } });
    if (!tour) {
      throw new NotFoundException('Không tìm thấy tour');
    }
    const existing = await this.wishlistRepository.findOne({
      where: { userId, tourId },
    });
    if (existing) {
      await this.wishlistRepository.remove(existing);
      return { isWishlisted: false };
    }
    const wish = this.wishlistRepository.create({ userId, tourId });
    await this.wishlistRepository.save(wish);
    return { isWishlisted: true };
  }

  /**
   * Lấy danh sách tour yêu thích của người dùng.
   */
  async getUserWishlist({ userId }: { userId: string }): Promise<Tour[]> {
    const list = await this.wishlistRepository.find({
      where: { userId },
      relations: ['tour'],
      order: { createdAt: 'DESC' },
    });
    return list.map((item) => item.tour);
  }

  /**
   * Kiểm tra xem một tour có nằm trong danh sách yêu thích của người dùng không.
   */
  async isWishlisted({
    userId,
    tourId,
  }: {
    userId: string;
    tourId: string;
  }): Promise<boolean> {
    const count = await this.wishlistRepository.count({
      where: { userId, tourId },
    });
    return count > 0;
  }

  /**
   * Lấy số lượng tour yêu thích của người dùng.
   */
  async getUserWishlistCount({ userId }: { userId: string }): Promise<number> {
    return this.wishlistRepository.count({
      where: { userId },
    });
  }
}
