import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class HotSpot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  category: string; // e.g., 'Check-in', 'Cảnh đẹp', 'Ăn uống'

  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 7 })
  lat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  lng: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('text', { nullable: true })
  opening_hours: string; // Giờ mở cửa, có thể là text hoặc JSON string

  @Column('text', { nullable: true })
  price_info: string; // Thông tin giá vé

  @Column({ default: false })
  is_hot: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
