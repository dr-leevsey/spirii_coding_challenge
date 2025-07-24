import { IsString, IsNumber, IsISO8601 } from 'class-validator';

export class UserAggregateResponseDto {
  @IsString()
  userId: string;

  @IsNumber()
  balance: number;

  @IsNumber()
  earned: number;

  @IsNumber()
  spent: number;

  @IsNumber()
  payout: number;

  @IsNumber()
  paidOut: number;

  @IsISO8601()
  lastUpdated: string;
}
