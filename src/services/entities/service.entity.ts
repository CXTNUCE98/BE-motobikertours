import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  shortTitle: string;

  @Column('text')
  description: string;

  @Column()
  thumbnail: string;

  @Column()
  icon: string;

  @Column()
  priceRange: string;

  // SQLite does not support array type, use simple-array (comma-separated)
  @Column('simple-array')
  features: string[];

  @CreateDateColumn()
  createdAt: Date;
}
