import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TourItinerary } from './tour-itinerary.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Review } from '../../reviews/entities/review.entity';

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
  priceUsd: number;

  @Column('decimal', { default: 0 })
  discount: number;

  @Column()
  duration: string;

  @Column()
  durationRange: string;

  @Column()
  departFrom: string;

  @Column()
  routes: string;

  @Column('simple-array')
  type: string[];

  @Column({ default: false })
  isFeatured: boolean;

  @OneToMany(() => TourItinerary, (itinerary) => itinerary.tour, {
    cascade: true,
  })
  itineraries: TourItinerary[];

  @OneToMany(() => Review, (review) => review.tour)
  reviews: Review[];

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'suggestedVehicleId' })
  suggestedVehicle: Vehicle;

  @Column({ nullable: true })
  suggestedVehicleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
