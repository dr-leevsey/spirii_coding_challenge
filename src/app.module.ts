import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  Transaction,
  UserAggregate,
  PayoutRequest,
  SyncStatus,
} from './entities';
import { TransactionApiModule } from './transaction-api/transaction-api.module';
import { SyncModule } from './sync/sync.module';
import { AggregationModule } from './aggregation/aggregation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'spirii_user'),
        password: configService.get<string>('DB_PASSWORD', 'spirii_password'),
        database: configService.get<string>('DB_NAME', 'spirii_transactions'),
        entities: [Transaction, UserAggregate, PayoutRequest, SyncStatus],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
        retryAttempts: 3,
        retryDelay: 5000,
      }),
      inject: [ConfigService],
    }),
    TransactionApiModule,
    SyncModule,
    AggregationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
