import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

/**
 * Module xử lý việc tải tệp tin (upload) lên máy chủ
 */
@Module({
  imports: [CloudinaryModule],
  controllers: [UploadController],
})
export class UploadModule {}
