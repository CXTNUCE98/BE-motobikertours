import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Tour } from '../tours/entities/tour.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
  ) {}

  /**
   * Tạo một đánh giá mới cho tour.
   */
  async createReview({
    userId,
    createReviewDto,
  }: {
    userId: string;
    createReviewDto: CreateReviewDto;
  }): Promise<Review> {
    const tour = await this.tourRepository.findOne({
      where: { id: createReviewDto.tourId },
    });
    if (!tour) {
      throw new NotFoundException('Không tìm thấy tour');
    }
    const review = this.reviewRepository.create({
      ...createReviewDto,
      userId,
    });
    return this.reviewRepository.save(review);
  }

  /**
   * Lấy danh sách đánh giá của một tour.
   */
  async getTourReviews({ tourId }: { tourId: string }): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { tourId },
      order: { created_at: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Tính điểm trung bình và tổng số đánh giá của một tour.
   */
  async getTourRatingStats({ tourId }: { tourId: string }): Promise<{
    averageRating: number;
    totalReviews: number;
    breakdown: Record<number, number>;
  }> {
    const reviews = await this.reviewRepository.find({ where: { tourId } });
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0, breakdown };
    }
    const sum = reviews.reduce((acc, review) => {
      const r = Math.round(review.rating);
      if (r >= 1 && r <= 5) {
        breakdown[r]++;
      }
      return acc + review.rating;
    }, 0);
    return {
      averageRating: parseFloat((sum / reviews.length).toFixed(1)),
      totalReviews: reviews.length,
      breakdown,
    };
  }
}
