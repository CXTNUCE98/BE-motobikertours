import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BlogPost } from '../../blog/entities/blog-post.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  blogId: string;

  @Column('simple-json')
  author: {
    authId: string;
    avatar: string;
    userName: string;
  };

  @Column('text')
  content: string;

  // For nested comments (replies)
  @Column('uuid', { nullable: true })
  parentId: string | null;

  // Like/Dislike counts (denormalized for performance)
  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  dislikeCount: number;

  // Reply count (denormalized for performance)
  @Column({ default: 0 })
  replyCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blogId' })
  blog: BlogPost;

  // Self-referencing for nested comments
  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @OneToMany(() => CommentLike, (like) => like.comment)
  likes: CommentLike[];
}

@Entity()
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  commentId: string;

  @Column('uuid')
  userId: string;

  // 'like' or 'dislike'
  @Column({ type: 'varchar', length: 10 })
  type: 'like' | 'dislike';

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Comment, (comment) => comment.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  // Unique constraint: one user can only like/dislike a comment once
  // This will be defined in the database migration
}
