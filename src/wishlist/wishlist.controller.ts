import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('toggle/:tourId')
  @ApiOperation({ summary: 'Thêm hoặc xóa tour khỏi danh sách yêu thích' })
  @ApiResponse({ status: 201, description: 'Đã thay đổi trạng thái yêu thích' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  async toggleWishlist(@Request() req, @Param('tourId') tourId: string) {
    return this.wishlistService.toggleWishlist({
      userId: req.user.id,
      tourId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tour yêu thích của người dùng hiện tại',
  })
  @ApiResponse({ status: 200, description: 'Danh sách tour' })
  async getUserWishlist(@Request() req) {
    return this.wishlistService.getUserWishlist({ userId: req.user.id });
  }

  @Get('check/:tourId')
  @ApiOperation({ summary: 'Kiểm tra xem tour có trong wishlist không' })
  @ApiResponse({ status: 200, description: 'Trạng thái yêu thích' })
  async isWishlisted(@Request() req, @Param('tourId') tourId: string) {
    const isWishlisted = await this.wishlistService.isWishlisted({
      userId: req.user.id,
      tourId,
    });
    return { isWishlisted };
  }

  @Get('count')
  @ApiOperation({ summary: 'Lấy số lượng tour trong wishlist' })
  @ApiResponse({ status: 200, description: 'Số lượng tour' })
  async getWishlistCount(@Request() req) {
    const count = await this.wishlistService.getUserWishlistCount({
      userId: req.user.id,
    });
    return { count };
  }
}
