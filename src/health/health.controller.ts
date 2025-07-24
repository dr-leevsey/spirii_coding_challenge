import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async checkHealth() {
    return await this.healthService.getHealthStatus();
  }

  @Get('database')
  async checkDatabase() {
    return await this.healthService.checkDatabaseConnection();
  }

  @Get('sync')
  async checkSyncStatus() {
    return await this.healthService.checkSyncStatus();
  }

  @Get('metrics')
  async getMetrics() {
    return await this.healthService.getSystemMetrics();
  }
}
