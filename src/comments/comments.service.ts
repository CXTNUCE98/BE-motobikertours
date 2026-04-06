import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Comment, CommentLike } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsDto } from './dto/get-comments.dto';
import { LikeCommentDto, LikeType } from './dto/like-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private commentLikeRepository: Repository<CommentLike>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create a new comment or reply
   */
  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const { parentId, ...commentData } = createCommentDto;

    // If this is a reply, verify parent comment exists
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Increment reply count on parent
      await this.commentRepository.increment({ id: parentId }, 'replyCount', 1);
    }

    const comment = this.commentRepository.create({
      ...commentData,
      parentId: parentId || null,
    });

    const result = await this.commentRepository.save(comment);
    await this.invalidateCommentsCache(createCommentDto.blogId);
    return result;
  }

  /**
   * Get comments with pagination
   * If parentId is provided, get replies to that comment
   * If blogId is provided, get top-level comments for that blog
   */
  async findAll(query: GetCommentsDto) {
    const { blogId, parentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.replies', 'replies')
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Filter by blogId and get only top-level comments (no parent)
    if (blogId && !parentId) {
      queryBuilder
        .where('comment.blogId = :blogId', { blogId })
        .andWhere('comment.parentId IS NULL');
    }

    // Filter by parentId to get replies
    if (parentId) {
      queryBuilder.where('comment.parentId = :parentId', { parentId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single comment by ID with its replies
   */
  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['replies'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  /**
   * Get nested comments tree for a blog
   * This returns top-level comments with their nested replies
   */
  async getCommentsTree(blogId: string, page = 1, limit = 10) {
    const cacheKey = `comments:tree:${blogId}:${page}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;

    const [topLevelComments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.replies', 'reply')
      .where('comment.blogId = :blogId', { blogId })
      .andWhere('comment.parentId IS NULL')
      .orderBy('comment.createdAt', 'DESC')
      .addOrderBy('reply.createdAt', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data = topLevelComments.map((c) => ({
      ...c,
      replies: c.replies?.slice(0, 5) ?? [],
    }));

    const result = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, 30000);
    return result;
  }

  /**
   * Like or dislike a comment
   */
  async likeComment(commentId: string, likeDto: LikeCommentDto) {
    const { userId, type } = likeDto;

    // Check if comment exists
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user already liked/disliked this comment
    const existingLike = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      // If same type, remove the like (toggle off)
      if (existingLike.type === type) {
        await this.commentLikeRepository.remove(existingLike);

        // Decrement count
        if (type === LikeType.LIKE) {
          await this.commentRepository.decrement(
            { id: commentId },
            'likeCount',
            1,
          );
        } else {
          await this.commentRepository.decrement(
            { id: commentId },
            'dislikeCount',
            1,
          );
        }

        return {
          message: `${type} removed`,
          action: 'removed',
        };
      } else {
        // If different type, update it
        const oldType = existingLike.type;
        existingLike.type = type;
        await this.commentLikeRepository.save(existingLike);

        // Update counts: decrement old, increment new
        if (oldType === LikeType.LIKE) {
          await this.commentRepository.decrement(
            { id: commentId },
            'likeCount',
            1,
          );
          await this.commentRepository.increment(
            { id: commentId },
            'dislikeCount',
            1,
          );
        } else {
          await this.commentRepository.decrement(
            { id: commentId },
            'dislikeCount',
            1,
          );
          await this.commentRepository.increment(
            { id: commentId },
            'likeCount',
            1,
          );
        }

        return {
          message: `Changed to ${type}`,
          action: 'updated',
        };
      }
    }

    // Create new like
    const newLike = this.commentLikeRepository.create({
      commentId,
      userId,
      type,
    });

    await this.commentLikeRepository.save(newLike);

    // Increment count
    if (type === LikeType.LIKE) {
      await this.commentRepository.increment({ id: commentId }, 'likeCount', 1);
    } else {
      await this.commentRepository.increment(
        { id: commentId },
        'dislikeCount',
        1,
      );
    }

    return {
      message: `${type} added`,
      action: 'added',
    };
  }

  /**
   * Get user's like status for a comment
   */
  async getUserLikeStatus(commentId: string, userId: string) {
    const like = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });

    return {
      hasLiked: like?.type === LikeType.LIKE,
      hasDisliked: like?.type === LikeType.DISLIKE,
      type: like?.type || null,
    };
  }

  /**
   * Delete a comment
   * This will cascade delete all replies and likes
   */
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the author
    if (comment.author.authId !== userId) {
      throw new BadRequestException('You can only delete your own comments');
    }

    // If this comment has a parent, decrement parent's reply count
    if (comment.parentId) {
      await this.commentRepository.decrement(
        { id: comment.parentId },
        'replyCount',
        1,
      );
    }

    await this.commentRepository.remove(comment);
    await this.invalidateCommentsCache(comment.blogId);
  }

  /**
   * Invalidate all cached comments tree entries for a specific blog
   */
  private async invalidateCommentsCache(blogId: string): Promise<void> {
    const store =
      (this.cacheManager as any).store ??
      (this.cacheManager as any).stores?.[0];
    if (store && typeof store.keys === 'function') {
      const keys: string[] = await store.keys(`comments:tree:${blogId}:*`);
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    } else {
      await this.cacheManager.clear();
    }
  }
}
