import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  lang: string;

  @Column('text')
  shortDescription: string;

  @Column('text')
  content: string;

  @Column()
  thumbnail: string;

  @Index()
  @Column({ nullable: true })
  category: string;

  @Column('simple-json', { nullable: true })
  author: {
    authId: string;
    avatar: string;
    userName: string;
  };

  // SQLite does not support array type, use simple-array (comma-separated)
  @Column('simple-array')
  tags: string[];

  @Column()
  numWords: number;

  @Index()
  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
