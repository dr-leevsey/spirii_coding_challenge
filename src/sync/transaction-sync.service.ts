import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransactionApiService } from '../transaction-api/transaction-api.service';
import { TransactionApiItemDto } from '../transaction-api/dto/transaction-api.dto';
import {
  Transaction,
  TransactionType,
  UserAggregate,
  PayoutRequest,
  PayoutStatus,
  SyncStatus,
  SyncStatusEnum,
} from '../entities';

@Injectable()
export class TransactionSyncService {
  private readonly logger = new Logger(TransactionSyncService.name);
  private readonly rateLimitQueue: number[] = [];
  private readonly maxRequestsPerMinute = 5;
  private readonly maxTransactionsPerRequest = 1000;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(UserAggregate)
    private readonly userAggregateRepository: Repository<UserAggregate>,
    @InjectRepository(PayoutRequest)
    private readonly payoutRequestRepository: Repository<PayoutRequest>,
    @InjectRepository(SyncStatus)
    private readonly syncStatusRepository: Repository<SyncStatus>,
    private readonly transactionApiService: TransactionApiService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Synchronize transactions from external API
   * Respects rate limiting (5 requests per minute, max 1000 transactions)
   */
  async synchronizeTransactions(): Promise<void> {
    const syncRecord = await this.createSyncRecord();

    try {
      this.logger.log('Starting transaction synchronization...');

      // Get last successful sync date
      const lastSyncDate = await this.getLastSuccessfulSyncDate();
      const currentDate = new Date();

      let totalProcessed = 0;
      let page = 1;
      let hasMoreData = true;

      while (hasMoreData && totalProcessed < this.maxTransactionsPerRequest) {
        // Check rate limiting
        await this.enforceRateLimit();

        this.logger.debug(`Fetching page ${page} of transactions...`);

        // Fetch transactions from API
        const response = await this.transactionApiService.getTransactions({
          startDate: lastSyncDate.toISOString(),
          endDate: currentDate.toISOString(),
          page,
          limit: Math.min(
            this.maxTransactionsPerRequest - totalProcessed,
            1000,
          ),
        });

        if (response.items.length === 0) {
          this.logger.debug('No more transactions to process');
          break;
        }

        // Process transactions in database transaction
        const newTransactionsCount = await this.processTransactionsBatch(
          response.items,
        );
        totalProcessed += newTransactionsCount;

        this.logger.debug(
          `Processed ${newTransactionsCount} new transactions from page ${page}`,
        );

        // Check if there are more pages
        hasMoreData = page < response.meta.totalPages;
        page++;
      }

      // Update aggregates for affected users
      await this.updateUserAggregates();

      // Mark sync as completed
      await this.completeSyncRecord(syncRecord, totalProcessed, currentDate);

      this.logger.log(
        `Synchronization completed successfully. Processed ${totalProcessed} transactions.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        'Synchronization failed:',
        error instanceof Error ? error.stack : error,
      );
      await this.failSyncRecord(syncRecord, errorMessage);
      throw error;
    }
  }

  /**
   * Process a batch of transactions and save to database
   */
  private async processTransactionsBatch(
    apiTransactions: TransactionApiItemDto[],
  ): Promise<number> {
    return await this.dataSource.transaction(async (manager) => {
      let newTransactionsCount = 0;

      for (const apiTxn of apiTransactions) {
        // Check if transaction already exists
        const existingTransaction = await manager.findOne(Transaction, {
          where: { id: apiTxn.id },
        });

        if (existingTransaction) {
          continue; // Skip duplicate
        }

        // Create new transaction
        const transaction = manager.create(Transaction, {
          id: apiTxn.id,
          userId: apiTxn.userId,
          createdAt: new Date(apiTxn.createdAt),
          type: apiTxn.type as TransactionType,
          amount: apiTxn.amount,
        });

        await manager.save(Transaction, transaction);

        // Create payout request if transaction is payout type
        if (apiTxn.type === TransactionType.PAYOUT) {
          const payoutRequest = manager.create(PayoutRequest, {
            userId: apiTxn.userId,
            transactionId: apiTxn.id,
            amount: apiTxn.amount,
            createdAt: new Date(apiTxn.createdAt),
            status: PayoutStatus.PENDING,
          });

          await manager.save(PayoutRequest, payoutRequest);
        }

        newTransactionsCount++;
      }

      return newTransactionsCount;
    });
  }

  /**
   * Update user aggregates based on all transactions
   */
  private async updateUserAggregates(): Promise<void> {
    this.logger.debug('Updating user aggregates...');

    // Get all users who have transactions
    const userIds = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.userId', 'userId')
      .getRawMany();

    for (const { userId } of userIds) {
      await this.updateUserAggregate(userId);
    }

    this.logger.debug(`Updated aggregates for ${userIds.length} users`);
  }

  /**
   * Update aggregate data for a specific user
   */
  private async updateUserAggregate(userId: string): Promise<void> {
    const transactions = await this.transactionRepository.find({
      where: { userId },
    });

    let earned = 0;
    let spent = 0;
    let payout = 0;

    for (const txn of transactions) {
      switch (txn.type) {
        case TransactionType.EARNED:
          earned += Number(txn.amount);
          break;
        case TransactionType.SPENT:
          spent += Number(txn.amount);
          break;
        case TransactionType.PAYOUT:
          payout += Number(txn.amount);
          break;
      }
    }

    const balance = earned - spent - payout;
    const paidOut = 0; // For MVP, assume no payouts are processed yet

    // Upsert user aggregate
    await this.userAggregateRepository
      .createQueryBuilder()
      .insert()
      .into(UserAggregate)
      .values({
        userId,
        balance,
        earned,
        spent,
        payout,
        paidOut,
      })
      .orUpdate(
        ['balance', 'earned', 'spent', 'payout', 'paid_out', 'last_updated'],
        ['user_id'],
      )
      .execute();
  }

  /**
   * Enforce rate limiting (5 requests per minute)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Remove requests older than 1 minute
    while (
      this.rateLimitQueue.length > 0 &&
      this.rateLimitQueue[0] < oneMinuteAgo
    ) {
      this.rateLimitQueue.shift();
    }

    // Check if we've hit the rate limit
    if (this.rateLimitQueue.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.rateLimitQueue[0];
      const waitTime = oldestRequest + 60 * 1000 - now + 1000; // Add 1 second buffer

      this.logger.debug(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Retry rate limit check
      return this.enforceRateLimit();
    }

    // Add current request to queue
    this.rateLimitQueue.push(now);
  }

  /**
   * Get the last successful synchronization date
   */
  private async getLastSuccessfulSyncDate(): Promise<Date> {
    const lastSync = await this.syncStatusRepository.findOne({
      where: { status: SyncStatusEnum.COMPLETED },
      order: { createdAt: 'DESC' },
    });

    if (lastSync?.lastSyncDate) {
      return lastSync.lastSyncDate;
    }

    // If no previous sync, start from 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo;
  }

  /**
   * Create a new sync record
   */
  private async createSyncRecord(): Promise<SyncStatus> {
    const syncRecord = this.syncStatusRepository.create({
      lastSyncDate: new Date(),
      status: SyncStatusEnum.RUNNING,
      transactionsProcessed: 0,
    });

    return await this.syncStatusRepository.save(syncRecord);
  }

  /**
   * Mark sync record as completed
   */
  private async completeSyncRecord(
    syncRecord: SyncStatus,
    transactionsProcessed: number,
    lastSyncDate: Date,
  ): Promise<void> {
    syncRecord.status = SyncStatusEnum.COMPLETED;
    syncRecord.transactionsProcessed = transactionsProcessed;
    syncRecord.lastSyncDate = lastSyncDate;
    syncRecord.errorMessage = null;

    await this.syncStatusRepository.save(syncRecord);
  }

  /**
   * Mark sync record as failed
   */
  private async failSyncRecord(
    syncRecord: SyncStatus,
    errorMessage: string,
  ): Promise<void> {
    syncRecord.status = SyncStatusEnum.FAILED;
    syncRecord.errorMessage = errorMessage;

    await this.syncStatusRepository.save(syncRecord);
  }
}
