import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsDto } from './dto/get-comments.dto';
import { LikeCommentDto } from './dto/like-comment.dto';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment or reply' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'Parent comment not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated comments' })
  @ApiQuery({
    name: 'blogId',
    required: false,
    description: 'Filter by blog ID',
  })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: 'Filter by parent comment ID (for replies)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  findAll(@Query() query: GetCommentsDto) {
    return this.commentsService.findAll(query);
  }

  @Get('tree/:blogId')
  @ApiOperation({
    summary: 'Get comments tree for a blog (nested structure)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return comments with nested replies',
  })
  @ApiParam({ name: 'blogId', description: 'Blog ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  getCommentsTree(
    @Param('blogId') blogId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.commentsService.getCommentsTree(blogId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single comment by ID' })
  @ApiResponse({ status: 200, description: 'Return comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like or dislike a comment' })
  @ApiResponse({ status: 200, description: 'Like/dislike processed' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  likeComment(@Param('id') id: string, @Body() likeDto: LikeCommentDto) {
    return this.commentsService.likeComment(id, likeDto);
  }

  @Get(':id/like-status/:userId')
  @ApiOperation({ summary: "Get user's like status for a comment" })
  @ApiResponse({ status: 200, description: 'Return like status' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  getUserLikeStatus(
    @Param('id') commentId: string,
    @Param('userId') userId: string,
  ) {
    return this.commentsService.getUserLikeStatus(commentId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({
    status: 400,
    description: 'You can only delete your own comments',
  })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiQuery({ name: 'userId', description: 'User ID (for authorization)' })
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.commentsService.remove(id, userId);
  }
}
