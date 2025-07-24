import { Controller, Get } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { PayoutRequestsResponseDto } from './dto/payout-requests-response.dto';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutService: PayoutService) {}

  /**
   * Get list of requested payouts (user ID, payout amount)
   * If there are several payouts requested by a user, the amount is aggregated into one
   *
   * @example GET /payouts/requests
   */
  @Get('requests')
  async getPayoutRequests(): Promise<PayoutRequestsResponseDto> {
    return this.payoutService.getPayoutRequests();
  }

  /**
   * Get payout statistics (optional endpoint for monitoring)
   */
  @Get('statistics')
  async getPayoutStatistics() {
    return this.payoutService.getPayoutStatistics();
  }
}
