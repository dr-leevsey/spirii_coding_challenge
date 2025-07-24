import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('payout_requests')
@Index(['userId'])
@Index(['status'])
export class PayoutRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, name: 'user_id' })
  userId: string;

  @Column('varchar', { length: 255, name: 'transaction_id', unique: true })
  transactionId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('timestamp', { name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'varchar',
    length: 50,
    enum: PayoutStatus,
    default: PayoutStatus.PENDING,
  })
  status: PayoutStatus;
}
