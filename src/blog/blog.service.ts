import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { CreateBlogDto } from './dto/create-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private blogRepository: Repository<BlogPost>,
  ) { }

  async create(createBlogDto: CreateBlogDto): Promise<BlogPost> {
    // Generate slug from name
    const slug = this.generateSlug(createBlogDto.name);

    // Check if slug already exists
    const existingBlog = await this.blogRepository.findOne({ where: { slug } });
    if (existingBlog) {
      throw new ConflictException('Blog with this name already exists');
    }

    const blogPost = this.blogRepository.create({
      ...createBlogDto,
      slug,
    });

    return this.blogRepository.save(blogPost);
  }

  findAll() {
    return this.blogRepository.find();
  }

  findOne(id: string) {
    return this.blogRepository.findOneBy({ id });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Normalize Vietnamese characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }
}
