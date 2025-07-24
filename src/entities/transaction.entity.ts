import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TransactionType {
  EARNED = 'earned',
  SPENT = 'spent',
  PAYOUT = 'payout',
}

@Entity('transactions')
@Index(['userId'])
@Index(['createdAt'])
@Index(['type'])
export class Transaction {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column('varchar', { length: 255, name: 'user_id' })
  userId: string;

  @Column('timestamp', { name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'varchar',
    length: 50,
    enum: TransactionType,
  })
  type: TransactionType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}
