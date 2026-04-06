import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['entityType'])
@Index(['userId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar' })
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'CANCEL';

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({ type: 'simple-json', nullable: true })
  changes: { before?: any; after?: any };

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
