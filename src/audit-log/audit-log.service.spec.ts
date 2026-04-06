// Feature: advanced-infrastructure, Property 9: Mọi hành động admin tạo audit log
// Feature: advanced-infrastructure, Property 10: Audit log filter theo entityType chính xác
// Feature: advanced-infrastructure, Property 11: Audit log filter theo date range chính xác
import * as fc from 'fast-check';
import { DataSource, Repository } from 'typeorm';
import { AuditLogService, AuditLogEntry } from './audit-log.service';
import { AuditLog } from './entities/audit-log.entity';

/**
 * Validates: Requirements 6.2, 6.3, 6.4
 *
 * Property 9: Mọi hành động admin tạo audit log
 * For any admin action (CREATE, UPDATE, DELETE, RESTORE, CANCEL) on any entity
 * (Tour, Booking), the system must create exactly one AuditLog record with correct
 * action, entityType, entityId, and userId.
 */

/**
 * Validates: Requirements 6.6
 *
 * Property 10: Audit log filter theo entityType chính xác
 * For any entityType value used as filter, all audit log records returned must have
 * entityType matching exactly with the filter value.
 */

/**
 * Validates: Requirements 6.7
 *
 * Property 11: Audit log filter theo date range chính xác
 * For any time range [fromDate, toDate], all audit log records returned must have
 * createdAt within that range (inclusive).
 */

// ─── Property 9: Mock-based test ───────────────────────────────────────────────

describe('AuditLogService — Property 9: Mọi hành động admin tạo audit log', () => {
  it('every admin action creates exactly one AuditLog with correct fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          action: fc.constantFrom(
            'CREATE' as const,
            'UPDATE' as const,
            'DELETE' as const,
            'RESTORE' as const,
            'CANCEL' as const,
          ),
          entityType: fc.constantFrom('Tour', 'Booking'),
          entityId: fc.uuid(),
          userId: fc.uuid(),
        }),
        async ({ action, entityType, entityId, userId }) => {
          const savedEntities: any[] = [];

          const mockRepository = {
            create: jest.fn((data: any) => ({ ...data })),
            save: jest.fn(async (entity: any) => {
              savedEntities.push(entity);
              return entity;
            }),
          } as unknown as Repository<AuditLog>;

          const service = new AuditLogService(mockRepository);

          const entry: AuditLogEntry = {
            userId,
            action,
            entityType,
            entityId,
          };

          await service.log(entry);

          // Exactly one record saved
          expect(savedEntities).toHaveLength(1);

          const saved = savedEntities[0];
          expect(saved.action).toBe(action);
          expect(saved.entityType).toBe(entityType);
          expect(saved.entityId).toBe(entityId);
          expect(saved.userId).toBe(userId);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 10 & 11: In-memory SQLite tests ─────────────────────────────────

let dataSource: DataSource;
let repository: Repository<AuditLog>;
let service: AuditLogService;

async function setupSqlite(): Promise<void> {
  dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [AuditLog],
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();
  repository = dataSource.getRepository(AuditLog);
  service = new AuditLogService(repository);
}

async function teardownSqlite(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}

describe('AuditLogService — Property 10: Audit log filter theo entityType chính xác', () => {
  beforeEach(async () => {
    await setupSqlite();
  });

  afterEach(async () => {
    await teardownSqlite();
  });

  it('all returned records match the entityType filter exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          filterType: fc.constantFrom('Tour', 'Booking', 'BlogPost'),
          logs: fc.array(
            fc.record({
              entityType: fc.constantFrom('Tour', 'Booking', 'BlogPost'),
              action: fc.constantFrom(
                'CREATE' as const,
                'UPDATE' as const,
                'DELETE' as const,
              ),
            }),
            { minLength: 1, maxLength: 20 },
          ),
        }),
        async ({ filterType, logs }) => {
          // Clear table
          await repository.clear();

          // Seed logs
          for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            await repository.save(
              repository.create({
                userId: 'user-1',
                action: log.action,
                entityType: log.entityType,
                entityId: `entity-${i}`,
              }),
            );
          }

          // Query with entityType filter
          const result = await service.findAll({
            entityType: filterType,
            page: 1,
            limit: 100,
          });

          // Every returned record must match the filter
          for (const record of result.data) {
            expect(record.entityType).toBe(filterType);
          }

          // Count should match expected
          const expectedCount = logs.filter(
            (l) => l.entityType === filterType,
          ).length;
          expect(result.total).toBe(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('AuditLogService — Property 11: Audit log filter theo date range chính xác', () => {
  beforeEach(async () => {
    await setupSqlite();
  });

  afterEach(async () => {
    await teardownSqlite();
  });

  it('all returned records have createdAt within [fromDate, toDate]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          date1: fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2030-12-31'),
            noInvalidDate: true,
          }),
          date2: fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2030-12-31'),
            noInvalidDate: true,
          }),
        }),
        async ({ date1, date2 }) => {
          // Sort so fromDate <= toDate
          const [fromDate, toDate] =
            date1 <= date2 ? [date1, date2] : [date2, date1];

          // Clear table
          await repository.clear();

          // Create logs at various dates: before, within, and after the range
          const dayMs = 24 * 60 * 60 * 1000;
          const testDates = [
            new Date(fromDate.getTime() - 2 * dayMs), // before range
            new Date(fromDate.getTime()),              // at fromDate
            new Date(
              fromDate.getTime() +
                (toDate.getTime() - fromDate.getTime()) / 2,
            ),                                          // middle of range
            new Date(toDate.getTime()),                // at toDate
            new Date(toDate.getTime() + 2 * dayMs),   // after range
          ];

          // Insert logs with specific createdAt by using query builder
          for (let i = 0; i < testDates.length; i++) {
            await repository
              .createQueryBuilder()
              .insert()
              .into(AuditLog)
              .values({
                userId: 'user-1',
                action: 'CREATE',
                entityType: 'Tour',
                entityId: `entity-${i}`,
                createdAt: testDates[i],
              })
              .execute();
          }

          // Query with date range filter
          const result = await service.findAll({
            fromDate: fromDate.toISOString(),
            toDate: toDate.toISOString(),
            page: 1,
            limit: 100,
          });

          // Every returned record must have createdAt within [fromDate, toDate]
          for (const record of result.data) {
            const createdAt = new Date(record.createdAt).getTime();
            expect(createdAt).toBeGreaterThanOrEqual(fromDate.getTime());
            expect(createdAt).toBeLessThanOrEqual(toDate.getTime());
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
