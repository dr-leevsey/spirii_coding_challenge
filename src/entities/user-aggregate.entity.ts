import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_aggregates')
export class UserAggregate {
  @PrimaryColumn('varchar', { length: 255, name: 'user_id' })
  userId: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  earned: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  spent: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  payout: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0, name: 'paid_out' })
  paidOut: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;
}
