import {
  IsInt,
  IsString,
  IsUUID,
  Min,
  Max,
  IsOptional,
  IsArray,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO để tạo đánh giá mới.
 */
export class CreateReviewDto {
  @ApiProperty({
    example: '550e8400-e29b-411d-a716-446655440000',
    description: 'ID của tour được đánh giá',
  })
  @IsUUID()
  tourId: string;

  @ApiProperty({
    example: 5,
    description: 'Số sao đánh giá (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Chuyến đi tuyệt vời, hướng dẫn viên rất nhiệt tình!',
    description: 'Nội dung bình luận',
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: ['https://res.cloudinary.com/.../image1.jpg'],
    description: 'Danh sách URL hình ảnh thực tế',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
