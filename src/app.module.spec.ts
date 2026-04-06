import * as fc from 'fast-check';
import { ConfigService } from '@nestjs/config';

/**
 * Feature: advanced-infrastructure
 *
 * Property tests for CacheModule configuration factory in AppModule.
 * We extract and test the cache config factory logic by simulating
 * the same decision path used in CacheModule.registerAsync().
 */

// Replicate the cache config factory logic from AppModule for testability
async function cacheConfigFactory(
  configService: ConfigService,
  redisStoreFactory: (opts: { url: string }) => Promise<any>,
): Promise<{ store?: any; ttl: number }> {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    try {
      const store = await redisStoreFactory({ url: redisUrl });
      return { store, ttl: 60000 };
    } catch {
      // fallback to in-memory
    }
  }

  return { ttl: 60000 };
}

function createMockConfigService(
  envMap: Record<string, string | undefined>,
): ConfigService {
  return {
    get: (key: string) => envMap[key],
  } as unknown as ConfigService;
}

describe('AppModule Cache Config Factory', () => {
  // Feature: advanced-infrastructure, Property 1: Cache store selection dựa trên REDIS_URL
  // **Validates: Requirements 1.1, 1.2**
  it('Property 1: if REDIS_URL is non-empty, config has store; if undefined/empty, config has no store', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.webUrl(), { nil: undefined }),
        async (redisUrl: string | undefined) => {
          const envMap: Record<string, string | undefined> = {
            REDIS_URL: redisUrl,
          };
          const mockConfigService = createMockConfigService(envMap);
          const fakeStore = { type: 'redis' };
          const redisStoreFactory = async () => fakeStore;

          const config = await cacheConfigFactory(
            mockConfigService,
            redisStoreFactory,
          );

          if (redisUrl && redisUrl.length > 0) {
            // REDIS_URL is a non-empty string → config must have store
            expect(config).toHaveProperty('store');
            expect(config.store).toBe(fakeStore);
          } else {
            // REDIS_URL is undefined/empty → config must NOT have store
            expect(config).not.toHaveProperty('store');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: advanced-infrastructure, Property 2: TTL mặc định là bất biến
  // **Validates: Requirements 1.4**
  it('Property 2: TTL is always 60000 regardless of Redis or in-memory config', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          redisUrl: fc.option(fc.webUrl(), { nil: undefined }),
        }),
        async ({ redisUrl }) => {
          const envMap: Record<string, string | undefined> = {
            REDIS_URL: redisUrl,
          };
          const mockConfigService = createMockConfigService(envMap);
          const fakeStore = { type: 'redis' };
          const redisStoreFactory = async () => fakeStore;

          const config = await cacheConfigFactory(
            mockConfigService,
            redisStoreFactory,
          );

          expect(config.ttl).toBe(60000);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Additional edge case: Redis connection failure still returns in-memory config with correct TTL
  it('should fallback to in-memory with ttl=60000 when Redis connection fails', async () => {
    await fc.assert(
      fc.asyncProperty(fc.webUrl(), async (redisUrl: string) => {
        const envMap: Record<string, string | undefined> = {
          REDIS_URL: redisUrl,
        };
        const mockConfigService = createMockConfigService(envMap);
        const failingRedisStoreFactory = async () => {
          throw new Error('Connection refused');
        };

        const config = await cacheConfigFactory(
          mockConfigService,
          failingRedisStoreFactory,
        );

        // Should fallback: no store property, TTL still 60000
        expect(config).not.toHaveProperty('store');
        expect(config.ttl).toBe(60000);
      }),
      { numRuns: 100 },
    );
  });
});

// Replicate the synchronize config logic from AppModule for testability
function computeShouldSynchronize(
  nodeEnv: string,
  dbSyncConfig: string | undefined,
): boolean {
  const isProduction = nodeEnv === 'production';
  const shouldSynchronize = isProduction
    ? false
    : dbSyncConfig !== undefined
      ? dbSyncConfig.toLowerCase() === 'true'
      : true;
  return shouldSynchronize;
}

describe('AppModule TypeORM Synchronize Config', () => {
  // Feature: advanced-infrastructure, Property 3: Synchronize config theo môi trường
  // **Validates: Requirements 2.1, 2.8**
  it('Property 3: production always has synchronize=false regardless of DB_SYNCHRONIZE; non-production defaults to true when DB_SYNCHRONIZE is not set', () => {
    fc.assert(
      fc.property(
        fc.record({
          nodeEnv: fc.constantFrom('production', 'development', 'test'),
          dbSync: fc.option(fc.constantFrom('true', 'false'), {
            nil: undefined,
          }),
        }),
        ({ nodeEnv, dbSync }) => {
          const result = computeShouldSynchronize(nodeEnv, dbSync);

          if (nodeEnv === 'production') {
            // Requirement 2.1: production → synchronize must be false regardless of DB_SYNCHRONIZE
            expect(result).toBe(false);
          } else if (dbSync === undefined) {
            // Requirement 2.8: non-production + DB_SYNCHRONIZE not set → synchronize must be true
            expect(result).toBe(true);
          } else {
            // non-production + DB_SYNCHRONIZE explicitly set → follows the value
            expect(result).toBe(dbSync.toLowerCase() === 'true');
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
