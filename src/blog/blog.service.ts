import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { GetBlogDto } from './dto/get-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private blogRepository: Repository<BlogPost>,
  ) {}

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

  async findAll(query: GetBlogDto) {
    const { q, p = 1, r = 10, category, tags, name } = query;
    const skip = (p - 1) * r;

    const queryBuilder = this.blogRepository.createQueryBuilder('blog');

    if (q) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('blog.name LIKE :q', { q: `%${q}%` }).orWhere(
            'blog.shortDescription LIKE :q',
            { q: `%${q}%` },
          );
        }),
      );
    }

    if (category) {
      queryBuilder.andWhere('blog.category = :category', { category });
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      if (tagList.length > 0) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            tagList.forEach((tag, index) => {
              const paramName = `tag${index}`;
              qb.orWhere(`blog.tags LIKE :${paramName}`, {
                [paramName]: `%${tag}%`,
              });
            });
          }),
        );
      }
    }

    if (name) {
      queryBuilder.andWhere('blog.name LIKE :name', { name: `%${name}%` });
    }

    queryBuilder.orderBy('blog.createdAt', 'DESC').skip(skip).take(r);

    const [data, total] = await queryBuilder.getManyAndCount();

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
