import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tour } from '../../tours/entities/tour.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Thực thể đại diện cho đánh giá của người dùng đối với một tour.
 */
@Entity('reviews')
export class Review {
  @ApiProperty({ example: '550e8400-e29b-411d-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'userId-uuid' })
  @Column('uuid')
  userId: string;

  @ApiProperty({ example: 'tourId-uuid' })
  @Column('uuid')
  tourId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Column('int')
  rating: number;

  @ApiProperty({ example: 'Great tour!' })
  @Column('text')
  content: string;

  @ApiProperty({ example: ['url1', 'url2'], required: false })
  @Column('simple-array', { nullable: true })
  images: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Tour, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tourId' })
  tour: Tour;
}
