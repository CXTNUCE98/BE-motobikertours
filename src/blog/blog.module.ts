import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogPost } from './entities/blog-post.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BlogPost])],
    controllers: [BlogController],
    providers: [BlogService],
})
export class BlogModule { }
