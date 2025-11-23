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

  @Column({ unique: true })
  slug: string;

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

  @Column()
  duration: string;

  @Column()
  depart_from: string;

  @Column()
  routes: string;

  @Column()
  type: string;

  @Column({ default: false })
  is_featured: boolean;

  @CreateDateColumn()
  created_at: Date;
}
