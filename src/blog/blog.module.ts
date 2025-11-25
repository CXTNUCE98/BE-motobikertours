import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogPost } from './entities/blog-post.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost]),
    CloudinaryModule,
  ],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule { }
