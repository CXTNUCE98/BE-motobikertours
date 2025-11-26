import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream from 'buffer-to-stream';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }
}
