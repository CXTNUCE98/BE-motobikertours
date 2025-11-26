import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UploadImageResponseDto } from './dto/upload-image.dto';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({ status: 201, description: 'Blog post created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Blog with this name already exists',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogService.create(createBlogDto);
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload image for blog content' })
  @ApiConsumes('multipart/form-data')
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
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadImageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No file uploaded or invalid file' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
      );
    }

    // Generate custom image ID
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const imageId = `image-${uniqueId}`;

    // Upload to Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, {
      public_id: imageId,
    });

    return {
      imageId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all blog posts' })
  @ApiResponse({ status: 200, description: 'Return all blog posts' })
  findAll() {
    return this.blogService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog post by id' })
  @ApiResponse({ status: 200, description: 'Return blog post by id' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }
}
