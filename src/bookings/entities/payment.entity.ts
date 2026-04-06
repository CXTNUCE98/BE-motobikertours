import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

/**
 * Entity Payment - Lưu trữ thông tin thanh toán
 */
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, { eager: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', name: 'payment_method' })
  paymentMethod: string;

  @Column({ type: 'varchar', unique: true, name: 'transaction_id' })
  transactionId: string;

  @Column({
    type: 'varchar',
    default: 'pending',
  })
  status: string;

  @Column({ type: 'json', nullable: true, name: 'gateway_response' })
  gatewayResponse: any;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
