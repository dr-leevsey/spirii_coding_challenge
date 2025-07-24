import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  SyncStatus,
  SyncStatusEnum,
  UserAggregate,
  Transaction,
} from '../entities';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectRepository(SyncStatus)
    private readonly syncStatusRepository: Repository<SyncStatus>,
    @InjectRepository(UserAggregate)
    private readonly userAggregateRepository: Repository<UserAggregate>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async getHealthStatus() {
    try {
      const [dbHealth, syncHealth, metrics] = await Promise.all([
        this.checkDatabaseConnection(),
        this.checkSyncStatus(),
        this.getSystemMetrics(),
      ]);

      const isHealthy =
        dbHealth.status === 'up' && syncHealth.status !== 'critical';

      return {
        status: isHealthy ? 'up' : 'down',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        synchronization: syncHealth,
        metrics,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkDatabaseConnection() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'up',
        timestamp: new Date().toISOString(),
        message: 'Database connection successful',
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'down',
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  async checkSyncStatus() {
    try {
      const lastSync = await this.syncStatusRepository.findOne({
        order: { createdAt: 'DESC' },
      });

      if (!lastSync) {
        return {
          status: 'warning',
          message: 'No synchronization records found',
          timestamp: new Date().toISOString(),
        };
      }

      const timeSinceLastSync = Date.now() - lastSync.createdAt.getTime();
      const minutesSinceLastSync = Math.floor(timeSinceLastSync / (1000 * 60));

      let status = 'healthy';
      if (lastSync.status === SyncStatusEnum.FAILED) {
        status = 'critical';
      } else if (minutesSinceLastSync > 5) {
        status = 'warning';
      }

      return {
        status,
        lastSyncDate: lastSync.lastSyncDate.toISOString(),
        lastSyncStatus: lastSync.status,
        minutesSinceLastSync,
        transactionsProcessed: lastSync.transactionsProcessed,
        errorMessage: lastSync.errorMessage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Sync status check failed:', error);
      return {
        status: 'critical',
        error:
          error instanceof Error ? error.message : 'Sync status check failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getSystemMetrics() {
    try {
      const [transactionCount, userCount] = await Promise.all([
        this.transactionRepository.count(),
        this.userAggregateRepository.count(),
      ]);

      const memoryUsage = process.memoryUsage();

      return {
        transactions: {
          total: transactionCount,
        },
        users: {
          total: userCount,
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('System metrics collection failed:', error);
      return {
        error:
          error instanceof Error ? error.message : 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
