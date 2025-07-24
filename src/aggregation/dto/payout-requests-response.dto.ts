import { IsString, IsNumber, IsArray } from 'class-validator';

export class PayoutRequestItemDto {
  @IsString()
  userId: string;

  @IsNumber()
  totalAmount: number;
}

export class PayoutRequestsResponseDto {
  @IsArray()
  requests: PayoutRequestItemDto[];
}
