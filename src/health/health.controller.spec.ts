import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HealthController } from './health.controller';

/**
 * Feature: advanced-infrastructure
 *
 * Property and unit tests for HealthController.
 * Tests cover uptime invariant, healthy response (200), and unhealthy response (503).
 */

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let dbIndicator: TypeOrmHealthIndicator;

  const mockCacheManager = {
    store: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    dbIndicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);

    // Trigger onModuleInit to set startTime
    controller.onModuleInit();
  });

  // Feature: advanced-infrastructure, Property 4: Health check uptime luôn non-negative
  // **Validates: Requirements 3.8**
  it('Property 4: uptime is always non-negative across multiple calls', async () => {
    (healthCheckService.check as jest.Mock).mockImplementation(
      async (indicators: Array<() => Promise<any>>) => ({
        status: 'ok',
        info: { database: { status: 'up' } },
        details: { database: { status: 'up' } },
      }),
    );

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        async (callCount: number) => {
          for (let i = 0; i < callCount; i++) {
            const result = await controller.check();
            expect(typeof result.uptime).toBe('number');
            expect(result.uptime).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Unit test: Health returns 200 with status 'ok' when all dependencies are healthy
  it('should return healthy status when database is up', async () => {
    const healthyResult = {
      status: 'ok',
      info: { database: { status: 'up' } },
      details: { database: { status: 'up' } },
    };

    (healthCheckService.check as jest.Mock).mockResolvedValue(healthyResult);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.info).toEqual({ database: { status: 'up' } });
    expect(typeof result.uptime).toBe('number');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  // Unit test: Health returns 503 info when database is down
  it('should propagate error status when database is down', async () => {
    const unhealthyResult = {
      status: 'error',
      info: {},
      error: { database: { status: 'down', message: 'Connection refused' } },
      details: {
        database: { status: 'down', message: 'Connection refused' },
      },
    };

    (healthCheckService.check as jest.Mock).mockRejectedValue({
      response: unhealthyResult,
    });

    await expect(controller.check()).rejects.toEqual({
      response: unhealthyResult,
    });
  });
});
