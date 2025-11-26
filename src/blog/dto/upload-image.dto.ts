import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({ example: 'image-j_muyWVa' })
  imageId: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  url: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  secureUrl: string;
}
