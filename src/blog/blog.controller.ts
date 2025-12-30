import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { GetBlogDto } from './dto/get-blog.dto';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

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

  @Get()
  @ApiOperation({ summary: 'Get all blog posts' })
  @ApiResponse({ status: 200, description: 'Return all blog posts' })
  findAll(@Query() query: GetBlogDto) {
    return this.blogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog post by id' })
  @ApiResponse({ status: 200, description: 'Return blog post by id' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }
}
