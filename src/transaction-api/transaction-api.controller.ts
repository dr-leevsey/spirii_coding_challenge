import { Controller, Get, Query } from '@nestjs/common';
import { TransactionApiService } from './transaction-api.service';
import {
  TransactionApiResponseDto,
  TransactionApiQueryDto,
} from './dto/transaction-api.dto';

@Controller('transactions')
export class TransactionApiController {
  constructor(private readonly transactionApiService: TransactionApiService) {}

  /**
   * Get transactions with pagination
   * Simulates external Transaction API endpoint
   *
   * @example GET /transactions?startDate=2023-02-01T00:00:00&endDate=2023-02-01T23:59:59
   */
  @Get()
  async getTransactions(
    @Query() query: TransactionApiQueryDto,
  ): Promise<TransactionApiResponseDto> {
    return this.transactionApiService.getTransactions(query);
  }
}
