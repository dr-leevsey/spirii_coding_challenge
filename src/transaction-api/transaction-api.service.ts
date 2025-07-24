import { Injectable } from '@nestjs/common';
import {
  TransactionApiResponseDto,
  TransactionApiItemDto,
  TransactionApiQueryDto,
} from './dto/transaction-api.dto';

@Injectable()
export class TransactionApiService {
  private readonly mockUsers = [
    '074092',
    '074093',
    '074094',
    '074095',
    '074096',
    '074097',
    '074098',
    '074099',
    '075001',
    '075002',
  ];

  private readonly transactionTypes = ['earned', 'spent', 'payout'] as const;

  /**
   * Get transactions for the specified date range with pagination
   * Simulates the external Transaction API endpoint
   */
  async getTransactions(
    query: TransactionApiQueryDto,
  ): Promise<TransactionApiResponseDto> {
    const { startDate, endDate, page = 1, limit = 1000 } = query;

    // Simulate network delay (100-300ms)
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 200 + 100),
    );

    // Generate mock transactions based on date range
    const mockTransactions = this.generateMockTransactions(startDate, endDate);

    // Apply pagination
    const totalItems = mockTransactions.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);
    const paginatedItems = mockTransactions.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      meta: {
        totalItems,
        itemCount: paginatedItems.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  /**
   * Generate mock transactions for testing purposes
   * Creates realistic data with different users, types, and amounts
   */
  private generateMockTransactions(
    startDate: string,
    endDate: string,
  ): TransactionApiItemDto[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const transactions: TransactionApiItemDto[] = [];

    // Generate 50-200 transactions per day range
    const daysInRange = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const transactionsPerDay = Math.max(50, Math.min(200, daysInRange * 30));

    for (let i = 0; i < transactionsPerDay; i++) {
      transactions.push(this.createMockTransaction(start, end));
    }

    return transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Create a single mock transaction with realistic data
   */
  private createMockTransaction(
    startDate: Date,
    endDate: Date,
  ): TransactionApiItemDto {
    const randomDate = new Date(
      startDate.getTime() +
        Math.random() * (endDate.getTime() - startDate.getTime()),
    );

    const userId =
      this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
    const type =
      this.transactionTypes[
        Math.floor(Math.random() * this.transactionTypes.length)
      ];

    return {
      id: this.generateUUID(),
      userId,
      createdAt: randomDate.toISOString(),
      type,
      amount: this.generateRealisticAmount(type),
    };
  }

  /**
   * Generate realistic amounts based on transaction type
   */
  private generateRealisticAmount(type: string): number {
    switch (type) {
      case 'earned':
        // Earned amounts: 0.1 to 50 SCR
        return Math.round((Math.random() * 49.9 + 0.1) * 100) / 100;
      case 'spent':
        // Spent amounts: 1 to 100 SCR
        return Math.round((Math.random() * 99 + 1) * 100) / 100;
      case 'payout':
        // Payout amounts: 10 to 500 SCR
        return Math.round((Math.random() * 490 + 10) * 100) / 100;
      default:
        return 1.0;
    }
  }

  /**
   * Generate a simple UUID for transaction IDs
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
