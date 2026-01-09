import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tour } from '../../tours/entities/tour.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Entity Booking - Quản lý đặt chỗ tour
 */
@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tour, { eager: true })
  @JoinColumn({ name: 'tour_id' })
  tour: Tour;

  @Column({ name: 'tour_id' })
  tourId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'int', name: 'number_of_people' })
  numberOfPeople: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'deposit_paid',
    default: 0,
  })
  depositPaid: number;

  @Column({
    type: 'varchar',
    default: 'pending',
  })
  status: string;

  @Column({
    type: 'varchar',
    name: 'payment_method',
  })
  paymentMethod: string;

  @Column({
    type: 'varchar',
    name: 'payment_status',
    default: 'unpaid',
  })
  paymentStatus: string;

  @Column({ type: 'text', nullable: true, name: 'special_requests' })
  specialRequests: string;

  @Column({ type: 'text', nullable: true, name: 'customer_info' })
  customerInfo: string; // JSON: {name, email, phone, address}

  @Column({ type: 'varchar', nullable: true, name: 'transaction_id' })
  transactionId: string;

  @Column({ type: 'varchar', nullable: true, name: 'voucher_code' })
  voucherCode: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'discount_amount',
  })
  discountAmount: number;

  @Column({ type: 'datetime', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
