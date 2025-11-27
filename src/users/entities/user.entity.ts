import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @Column({ nullable: true })
  lastPasswordChange: Date;

  @Column({ default: '' })
  avatar: string;

  @Column({ nullable: true })
  provider: string;

  @CreateDateColumn()
  created_at: Date;
}
