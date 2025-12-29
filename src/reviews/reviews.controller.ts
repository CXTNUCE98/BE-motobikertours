import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo đánh giá mới cho tour' })
  @ApiResponse({ status: 201, description: 'Đánh giá đã được tạo thành công' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tour' })
  async createReview(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.createReview({
      userId: req.user.id,
      createReviewDto,
    });
  }

  @Get('tour/:tourId')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá của một tour' })
  @ApiResponse({ status: 200, description: 'Danh sách đánh giá' })
  async getTourReviews(@Param('tourId') tourId: string) {
    return this.reviewsService.getTourReviews({ tourId });
  }

  @Get('tour/:tourId/stats')
  @ApiOperation({ summary: 'Lấy thống kê đánh giá của một tour' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê (điểm trung bình, tổng số)',
  })
  async getTourRatingStats(@Param('tourId') tourId: string) {
    return this.reviewsService.getTourRatingStats({ tourId });
  }
}
