import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { SyncStatus, UserAggregate, Transaction } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([SyncStatus, UserAggregate, Transaction])],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
