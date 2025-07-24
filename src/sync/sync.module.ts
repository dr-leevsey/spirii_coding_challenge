import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionSyncService } from './transaction-sync.service';
import { SyncController } from './sync.controller';
import { TransactionApiModule } from '../transaction-api/transaction-api.module';
import {
  Transaction,
  UserAggregate,
  PayoutRequest,
  SyncStatus,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      UserAggregate,
      PayoutRequest,
      SyncStatus,
    ]),
    TransactionApiModule,
  ],
  controllers: [SyncController],
  providers: [TransactionSyncService],
  exports: [TransactionSyncService],
})
export class SyncModule {}
