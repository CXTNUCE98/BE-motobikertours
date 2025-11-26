import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

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

  async findAll(query: PaginationDto) {
    const { q, p = 1, r = 10 } = query;
    const skip = (p - 1) * r;

    const where = q
      ? [
        { name: Like(`%${q}%`) },
        { shortDescription: Like(`%${q}%`) },
      ]
      : {};

    const [data, total] = await this.blogRepository.findAndCount({
      where,
      skip,
      take: r,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      total,
      page: p,
      perPage: r,
      totalPages: Math.ceil(total / r),
    };
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
