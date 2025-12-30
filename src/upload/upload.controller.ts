import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Endpoint để tải ảnh lên Cloudinary
   * @param file Tệp tin ảnh được tải lên
   * @param folder Thư mục lưu trữ trên Cloudinary (mặc định là 'general')
   * @returns URL và publicId của ảnh đã tải lên
   */
  @Post()
  @ApiOperation({ summary: 'Tải một ảnh lên' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Tên thư mục trên Cloudinary (ví dụ: blog, tours, profile)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'general',
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một tệp tin ảnh');
    }

    // Kiểm tra định dạng tệp tin
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Định dạng tệp không hợp lệ. Chỉ chấp nhận JPEG, PNG, GIF, và WebP',
      );
    }

    // Kiểm tra kích thước tệp tin (tối đa 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước ảnh không được vượt quá 5MB');
    }

    const result = await this.cloudinaryService.uploadImage(file, {
      folder: folder,
    });

    return {
      url: result.secureUrl,
      publicId: result.publicId,
    };
  }
}
