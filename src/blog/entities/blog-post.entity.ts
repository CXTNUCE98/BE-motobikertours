import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  author_name: string;

  // SQLite does not support array type, use simple-array (comma-separated)
  @Column('simple-array')
  tags: string[];

  @Column()
  numWords: number;

  @Column()
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
