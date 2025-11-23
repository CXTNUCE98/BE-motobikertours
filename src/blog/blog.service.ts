import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private blogRepository: Repository<BlogPost>,
  ) {}

  findAll() {
    return this.blogRepository.find();
  }

  findOne(id: string) {
    return this.blogRepository.findOneBy({ id });
  }
}
