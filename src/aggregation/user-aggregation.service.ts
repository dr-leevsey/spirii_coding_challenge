import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAggregate } from '../entities';
import { UserAggregateResponseDto } from './dto/user-aggregate-response.dto';

@Injectable()
export class UserAggregationService {
  private readonly logger = new Logger(UserAggregationService.name);

  constructor(
    @InjectRepository(UserAggregate)
    private readonly userAggregateRepository: Repository<UserAggregate>,
  ) {}

  /**
   * Get aggregated data for a specific user
   * Returns balance, earned, spent, payout, and paid out amounts
   */
  async getUserAggregates(userId: string): Promise<UserAggregateResponseDto> {
    this.logger.debug(`Fetching aggregates for user: ${userId}`);

    const userAggregate = await this.userAggregateRepository.findOne({
      where: { userId },
    });

    if (!userAggregate) {
      throw new NotFoundException(`No data found for user ${userId}`);
    }

    return {
      userId: userAggregate.userId,
      balance: Number(userAggregate.balance),
      earned: Number(userAggregate.earned),
      spent: Number(userAggregate.spent),
      payout: Number(userAggregate.payout),
      paidOut: Number(userAggregate.paidOut),
      lastUpdated: userAggregate.lastUpdated.toISOString(),
    };
  }

  /**
   * Get aggregated data for multiple users (for batch operations)
   */
  async getMultipleUserAggregates(
    userIds: string[],
  ): Promise<UserAggregateResponseDto[]> {
    this.logger.debug(`Fetching aggregates for ${userIds.length} users`);

    const userAggregates = await this.userAggregateRepository.find({
      where: userIds.map((userId) => ({ userId })),
    });

    return userAggregates.map((aggregate) => ({
      userId: aggregate.userId,
      balance: Number(aggregate.balance),
      earned: Number(aggregate.earned),
      spent: Number(aggregate.spent),
      payout: Number(aggregate.payout),
      paidOut: Number(aggregate.paidOut),
      lastUpdated: aggregate.lastUpdated.toISOString(),
    }));
  }

  /**
   * Check if user has sufficient balance for operation
   */
  async checkUserBalance(userId: string, amount: number): Promise<boolean> {
    const userAggregate = await this.userAggregateRepository.findOne({
      where: { userId },
    });

    if (!userAggregate) {
      return false;
    }

    return Number(userAggregate.balance) >= amount;
  }

  /**
   * Get users with positive balances (for analytics)
   */
  async getUsersWithPositiveBalance(): Promise<UserAggregateResponseDto[]> {
    const userAggregates = await this.userAggregateRepository
      .createQueryBuilder('userAggregate')
      .where('userAggregate.balance > 0')
      .orderBy('userAggregate.balance', 'DESC')
      .getMany();

    return userAggregates.map((aggregate) => ({
      userId: aggregate.userId,
      balance: Number(aggregate.balance),
      earned: Number(aggregate.earned),
      spent: Number(aggregate.spent),
      payout: Number(aggregate.payout),
      paidOut: Number(aggregate.paidOut),
      lastUpdated: aggregate.lastUpdated.toISOString(),
    }));
  }
}
