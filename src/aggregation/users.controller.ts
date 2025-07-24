import { Controller, Get, Param } from '@nestjs/common';
import { UserAggregationService } from './user-aggregation.service';
import { UserAggregateResponseDto } from './dto/user-aggregate-response.dto';
import { UserIdParamDto } from './dto/user-id-param.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userAggregationService: UserAggregationService,
  ) {}

  /**
   * Get aggregated data by user ID: balance, earned, spent, payout, paid out
   *
   * @example GET /users/074092/aggregates
   */
  @Get(':userId/aggregates')
  async getUserAggregates(
    @Param() params: UserIdParamDto,
  ): Promise<UserAggregateResponseDto> {
    return this.userAggregationService.getUserAggregates(params.userId);
  }
}
