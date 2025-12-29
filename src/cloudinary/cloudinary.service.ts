import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream from 'buffer-to-stream';

export interface CloudinaryResponse {
  publicId: string;
  secureUrl: string;
  url: string;
}

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    options?: any,
  ): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return reject(error);
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            url: result.url,
          });
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }
}
