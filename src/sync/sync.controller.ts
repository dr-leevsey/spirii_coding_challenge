import { Controller, Post, Get } from '@nestjs/common';
import { TransactionSyncService } from './transaction-sync.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncStatus } from '../entities';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly transactionSyncService: TransactionSyncService,
    @InjectRepository(SyncStatus)
    private readonly syncStatusRepository: Repository<SyncStatus>,
  ) {}

  /**
   * Manual trigger for transaction synchronization
   * Useful for testing and development
   */
  @Post('transactions')
  async triggerSync() {
    try {
      await this.transactionSyncService.synchronizeTransactions();
      return {
        success: true,
        message: 'Synchronization completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Synchronization failed',
      };
    }
  }

  /**
   * Get synchronization status and history
   */
  @Get('status')
  async getSyncStatus() {
    const recentSyncs = await this.syncStatusRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      recentSyncs: recentSyncs.map((sync) => ({
        id: sync.id,
        status: sync.status,
        lastSyncDate: sync.lastSyncDate,
        transactionsProcessed: sync.transactionsProcessed,
        errorMessage: sync.errorMessage,
        createdAt: sync.createdAt,
      })),
      totalSyncs: recentSyncs.length,
    };
  }
}
