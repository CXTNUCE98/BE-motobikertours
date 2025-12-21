import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Tour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  thumbnail: string;

  // SQLite does not support array type, use simple-array (comma-separated)
  @Column('simple-array')
  images: string[];

  @Column('text')
  description: string;

  @Column('text')
  content: string;

  @Column('decimal')
  price_usd: number;

  @Column('decimal', { default: 0 })
  discount: number;

  @Column()
  duration: string;

  @Column()
  duration_range: string;

  @Column()
  depart_from: string;

  @Column()
  routes: string;

  @Column('simple-array')
  type: string[];

  @Column({ default: false })
  is_featured: boolean;

  @CreateDateColumn()
  created_at: Date;
}
