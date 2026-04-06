import { Controller, Get, Inject, OnModuleInit } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController implements OnModuleInit {
  private startTime: number;

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @Inject(CACHE_MANAGER) private cacheManager: any,
  ) {}

  onModuleInit() {
    this.startTime = Date.now();
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health status' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
  })
  async check() {
    const indicators = [() => this.db.pingCheck('database')];

    // Add Redis health check if Redis store is active
    if (this.isRedisStore()) {
      indicators.push(() => this.checkRedis());
    }

    const result: HealthCheckResult = await this.health.check(indicators);

    return {
      ...result,
      uptime: (Date.now() - this.startTime) / 1000,
    };
  }

  private isRedisStore(): boolean {
    try {
      const store = (this.cacheManager as any).store;
      // cache-manager-redis-yet exposes a client property on the Redis store
      return !!(store && store.client);
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<any> {
    try {
      const store = (this.cacheManager as any).store;
      await store.client.ping();
      return { redis: { status: 'up' } };
    } catch (error) {
      throw new Error(`Redis health check failed: ${error.message}`);
    }
  }
}
