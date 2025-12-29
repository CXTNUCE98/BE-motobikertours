import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  model: string;

  @Column()
  type: string; // e.g., 'Sedan', 'SUV', 'Limousine'

  @Column('int')
  capacity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerKm: number;

  @Column({ nullable: true })
  thumbnail: string;

  @Column('simple-array', { nullable: true })
  amenities: string[]; // ['Wifi', 'Water', 'Leather Seats']

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
