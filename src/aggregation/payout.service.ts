import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayoutRequest, PayoutStatus } from '../entities';
import {
  PayoutRequestsResponseDto,
  PayoutRequestItemDto,
} from './dto/payout-requests-response.dto';

interface PayoutAggregateResult {
  userId: string;
  totalAmount: string;
}

interface PayoutStatsResult {
  status: string;
  count: string;
  totalAmount: string | null;
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    @InjectRepository(PayoutRequest)
    private readonly payoutRequestRepository: Repository<PayoutRequest>,
  ) {}

  /**
   * Get list of requested payouts aggregated by user ID
   * If there are several payouts requested by a user, the amount is aggregated into one
   */
  async getPayoutRequests(): Promise<PayoutRequestsResponseDto> {
    this.logger.debug('Fetching aggregated payout requests');

    // Aggregate payout amounts by user ID for pending requests
    const aggregatedPayouts = await this.payoutRequestRepository
      .createQueryBuilder('payoutRequest')
      .select('payoutRequest.userId', 'userId')
      .addSelect('SUM(payoutRequest.amount)', 'totalAmount')
      .where('payoutRequest.status = :status', { status: PayoutStatus.PENDING })
      .groupBy('payoutRequest.userId')
      .orderBy('"totalAmount"', 'DESC')
      .getRawMany<PayoutAggregateResult>();

    const requests: PayoutRequestItemDto[] = aggregatedPayouts.map((row) => ({
      userId: row.userId,
      totalAmount: Number(row.totalAmount),
    }));

    return {
      requests,
    };
  }

  /**
   * Get payout requests for a specific user
   */
  async getUserPayoutRequests(userId: string): Promise<PayoutRequestItemDto[]> {
    this.logger.debug(`Fetching payout requests for user: ${userId}`);

    const userPayouts = await this.payoutRequestRepository
      .createQueryBuilder('payoutRequest')
      .select('payoutRequest.userId', 'userId')
      .addSelect('SUM(payoutRequest.amount)', 'totalAmount')
      .where('payoutRequest.userId = :userId', { userId })
      .andWhere('payoutRequest.status = :status', {
        status: PayoutStatus.PENDING,
      })
      .groupBy('payoutRequest.userId')
      .getRawMany<PayoutAggregateResult>();

    return userPayouts.map((row) => ({
      userId: row.userId,
      totalAmount: Number(row.totalAmount),
    }));
  }

  /**
   * Get detailed payout requests for a specific user (individual transactions)
   */
  async getUserPayoutDetails(userId: string) {
    this.logger.debug(`Fetching detailed payout requests for user: ${userId}`);

    return await this.payoutRequestRepository.find({
      where: {
        userId,
        status: PayoutStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Process payout request (mark as processed)
   * This would typically integrate with external payment system
   */
  async processPayoutRequest(payoutRequestId: number): Promise<void> {
    this.logger.debug(`Processing payout request: ${payoutRequestId}`);

    await this.payoutRequestRepository.update(
      { id: payoutRequestId },
      { status: PayoutStatus.PROCESSED },
    );
  }

  /**
   * Get statistics about payout requests
   */
  async getPayoutStatistics() {
    const stats = await this.payoutRequestRepository
      .createQueryBuilder('payoutRequest')
      .select('payoutRequest.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payoutRequest.amount)', 'totalAmount')
      .groupBy('payoutRequest.status')
      .getRawMany<PayoutStatsResult>();

    return stats.map((stat) => ({
      status: stat.status,
      count: Number(stat.count),
      totalAmount: Number(stat.totalAmount || 0),
    }));
  }
}
