import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tour } from './tour.entity';
import { HotSpot } from '../../hot-spots/entities/hot-spot.entity';

@Entity()
export class TourItinerary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tour, (tour) => tour.itineraries, { onDelete: 'CASCADE' })
  tour: Tour;

  @ManyToOne(() => HotSpot, { eager: true })
  hotSpot: HotSpot;

  @Column('int')
  order: number;

  @Column('text', { nullable: true })
  activityDescription: string;

  @Column('int', { nullable: true })
  durationMinutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
