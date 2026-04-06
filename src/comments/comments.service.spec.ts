// Feature: api-performance-improvements, Property 1: comments tree reply limit
import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource, Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { Comment, CommentLike } from './entities/comment.entity';
import { BlogPost } from '../blog/entities/blog-post.entity';

/**
 * Validates: Requirements 1.1, 1.3, 1.4
 *
 * Property 1: Comments tree reply limit
 * For any blog with top-level comments that have more than 5 replies,
 * getCommentsTree should return at most 5 replies per top-level comment,
 * and the response should always contain the fields data, total, page, limit, totalPages.
 */

// Minimal in-memory SQLite setup via TypeORM DataSource
let dataSource: DataSource;

async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [Comment, CommentLike, BlogPost],
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();
  return dataSource;
}

describe('CommentsService — Property 1: comments tree reply limit', () => {
  let service: CommentsService;
  let commentRepo: Repository<Comment>;
  let commentLikeRepo: Repository<CommentLike>;
  let ds: DataSource;

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    store: {
      keys: jest.fn().mockResolvedValue([]),
    },
  };

  beforeAll(async () => {
    ds = await getDataSource();
    commentRepo = ds.getRepository(Comment);
    commentLikeRepo = ds.getRepository(CommentLike);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: commentRepo },
        { provide: getRepositoryToken(CommentLike), useValue: commentLikeRepo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });


  it('replies per top-level comment are capped at 5 and response has correct shape', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 1–5 top-level comments, each with 0–10 replies
        fc.array(
          fc.record({
            replyCount: fc.integer({ min: 0, max: 10 }),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        async (commentDefs) => {
          // Clean slate
          await commentRepo.query('DELETE FROM comment');
          await ds.getRepository(BlogPost).query('DELETE FROM blog_post');

          // Create a blog post to satisfy FK
          const blogPostRepo = ds.getRepository(BlogPost);
          const blog = blogPostRepo.create({
            name: 'Test Blog',
            slug: 'test-blog-' + Math.random().toString(36).slice(2),
            lang: 'en',
            shortDescription: 'desc',
            content: 'content',
            thumbnail: 'thumb.jpg',
            tags: [],
            numWords: 10,
            status: 'published',
          });
          const savedBlog = await blogPostRepo.save(blog);
          const blogId = savedBlog.id;

          // Seed top-level comments
          const topLevel: Comment[] = [];
          for (const def of commentDefs) {
            const c = commentRepo.create({
              blogId,
              parentId: null,
              content: 'top-level',
              author: { authId: 'u1', avatar: '', userName: 'user' },
            });
            const saved = await commentRepo.save(c);
            topLevel.push(saved);

            // Seed replies
            for (let i = 0; i < def.replyCount; i++) {
              const reply = commentRepo.create({
                blogId,
                parentId: saved.id,
                content: `reply-${i}`,
                author: { authId: 'u2', avatar: '', userName: 'replier' },
              });
              await commentRepo.save(reply);
            }
          }

          const result = (await service.getCommentsTree(blogId, 1, 20)) as any;

          // Response shape
          expect(result).toHaveProperty('data');
          expect(result).toHaveProperty('total');
          expect(result).toHaveProperty('page');
          expect(result).toHaveProperty('limit');
          expect(result).toHaveProperty('totalPages');

          // Reply cap
          for (const comment of result.data) {
            expect(comment.replies.length).toBeLessThanOrEqual(5);
          }

          // total reflects top-level count
          expect(result.total).toBe(topLevel.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
