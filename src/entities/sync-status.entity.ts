import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum SyncStatusEnum {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('sync_status')
export class SyncStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('timestamp', { name: 'last_sync_date' })
  lastSyncDate: Date;

  @Column({
    type: 'varchar',
    length: 50,
    enum: SyncStatusEnum,
    default: SyncStatusEnum.COMPLETED,
  })
  status: SyncStatusEnum;

  @Column('text', { name: 'error_message', nullable: true })
  errorMessage: string | null;

  @Column('integer', { name: 'transactions_processed', default: 0 })
  transactionsProcessed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
