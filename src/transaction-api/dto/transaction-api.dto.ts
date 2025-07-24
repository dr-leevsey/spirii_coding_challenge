import { IsString, IsNumber, IsISO8601, IsIn } from 'class-validator';

export class TransactionApiItemDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsISO8601()
  createdAt: string;

  @IsIn(['earned', 'spent', 'payout'])
  type: 'earned' | 'spent' | 'payout';

  @IsNumber()
  amount: number;
}

export class TransactionApiMetaDto {
  @IsNumber()
  totalItems: number;

  @IsNumber()
  itemCount: number;

  @IsNumber()
  itemsPerPage: number;

  @IsNumber()
  totalPages: number;

  @IsNumber()
  currentPage: number;
}

export class TransactionApiResponseDto {
  items: TransactionApiItemDto[];
  meta: TransactionApiMetaDto;
}

export class TransactionApiQueryDto {
  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;

  @IsNumber()
  page?: number = 1;

  @IsNumber()
  limit?: number = 1000;
}
