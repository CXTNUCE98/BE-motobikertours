import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) code: string;
  @Column() discountType: 'percentage' | 'fixed';
  @Column('decimal', { precision: 10, scale: 2 }) discountValue: number;
  @Column({ default: 0 }) maxUses: number;
  @Column({ default: 0 }) usedCount: number;
  @Column({ nullable: true }) expiresAt: Date;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
}
