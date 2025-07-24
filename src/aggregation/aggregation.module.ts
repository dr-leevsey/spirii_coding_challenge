import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAggregationService } from './user-aggregation.service';
import { PayoutService } from './payout.service';
import { UsersController } from './users.controller';
import { PayoutsController } from './payouts.controller';
import { UserAggregate, PayoutRequest } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserAggregate, PayoutRequest])],
  controllers: [UsersController, PayoutsController],
  providers: [UserAggregationService, PayoutService],
  exports: [UserAggregationService, PayoutService],
})
export class AggregationModule {}
