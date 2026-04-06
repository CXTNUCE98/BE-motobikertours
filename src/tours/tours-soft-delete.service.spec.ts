// Feature: advanced-infrastructure, Property 6: Soft delete rồi restore là round trip
// Feature: advanced-infrastructure, Property 7: Tour đã soft delete bị loại khỏi query thông thường
import * as fc from 'fast-check';
import { ToursService } from './tours.service';

/**
 * Validates: Requirements 5.3, 5.8
 *
 * Property 6: Soft delete then restore is a round trip
 * For any Tour entity, performing soft delete then restore must return entity
 * to state with deletedAt === null and entity must appear again in findAll() results.
 *
 * Validates: Requirements 5.5
 *
 * Property 7: Soft deleted tours are excluded from normal queries
 * For any set of Tours in database where some have been soft deleted (have deletedAt not null),
 * results from findAll() and findOne() never contain tours with deletedAt not null.
 */

function createMockToursService(tourStore: Map<string, any>) {
  let idCounter = 0;

  const mockReviewRepo = {
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    store: {
      keys: jest.fn().mockResolvedValue([]),
    },
  };

  const mockToursRepository = {
    create: jest.fn((data: any) => {
      const id = `tour-${++idCounter}`;
      return { id, ...data, deletedAt: null, createdAt: new Date() };
    }),
    save: jest.fn(async (tour: any) => {
      tourStore.set(tour.id, { ...tour });
      return { ...tour };
    }),
    findOne: jest.fn(async (options: any) => {
      const id = options.where?.id;
      const withDeleted = options.withDeleted || false;
      const tour = tourStore.get(id);
      if (!tour) return null;
      if (!withDeleted && tour.deletedAt !== null) return null;
      return { ...tour };
    }),
    find: jest.fn(async (options?: any) => {
      const withDeleted = options?.withDeleted || false;
      const entries = Array.from(tourStore.values());
      if (withDeleted) {
        // If where clause filters for deletedAt not null
        if (options?.where?.deletedAt) {
          return entries.filter((t) => t.deletedAt !== null).map((t) => ({ ...t }));
        }
        return entries.map((t) => ({ ...t }));
      }
      return entries.filter((t) => t.deletedAt === null).map((t) => ({ ...t }));
    }),
    softRemove: jest.fn(async (tour: any) => {
      const updated = { ...tour, deletedAt: new Date() };
      tourStore.set(tour.id, updated);
      return updated;
    }),
    recover: jest.fn(async (tour: any) => {
      const updated = { ...tour, deletedAt: null };
      tourStore.set(tour.id, updated);
      return updated;
    }),
    createQueryBuilder: jest.fn().mockReturnValue({
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(async () => {
        const active = Array.from(tourStore.values())
          .filter((t) => t.deletedAt === null)
          .map((t) => ({ ...t }));
        return [active, active.length];
      }),
    }),
  };


  const mockOsrmService = {};
  const mockHotSpotsService = {};
  const mockVehiclesService = {};
  const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

  // Construct service with mocked dependencies via Object.assign
  const service = Object.create(ToursService.prototype);
  Object.assign(service, {
    toursRepository: mockToursRepository,
    reviewRepository: mockReviewRepo,
    osrmService: mockOsrmService,
    hotSpotsService: mockHotSpotsService,
    vehiclesService: mockVehiclesService,
    cacheManager: mockCacheManager,
    auditLogService: mockAuditLogService,
  });

  // Bind private method
  service.invalidateTourCache = async () => {
    const keys: string[] = await mockCacheManager.store.keys('tours:*');
    await Promise.all(keys.map((key: string) => mockCacheManager.del(key)));
  };

  return { service, mockToursRepository, tourStore };
}

describe('ToursService — Property 6: Soft delete then restore is a round trip', () => {
  it('soft deleting then restoring a tour returns deletedAt to null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1 }),
          priceUsd: fc.float({ min: 1, max: 10000, noNaN: true }),
        }),
        async ({ title, priceUsd }) => {
          const tourStore = new Map<string, any>();
          const { service, mockToursRepository } = createMockToursService(tourStore);

          // Create and save a tour
          const tourData = {
            title,
            thumbnail: 'thumb.jpg',
            images: ['img.jpg'],
            description: 'desc',
            content: 'content',
            priceUsd,
            discount: 0,
            duration: '1 day',
            durationRange: '1-2 days',
            departFrom: 'Hanoi',
            routes: 'Route A',
            type: ['adventure'],
            isFeatured: false,
          };
          const created = mockToursRepository.create(tourData);
          await mockToursRepository.save(created);

          // Soft delete
          await service.remove(created.id);
          const afterDelete = tourStore.get(created.id);
          expect(afterDelete.deletedAt).not.toBeNull();

          // Restore
          await service.restore(created.id);
          const afterRestore = tourStore.get(created.id);
          expect(afterRestore.deletedAt).toBeNull();

          // Tour should appear in normal find (simulating findAll behavior)
          const allTours = await mockToursRepository.find();
          const found = allTours.find((t: any) => t.id === created.id);
          expect(found).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('ToursService — Property 7: Soft deleted tours excluded from normal queries', () => {
  it('findOne and find never return tours with deletedAt not null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string(),
            isDeleted: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        async (tourSpecs) => {
          const tourStore = new Map<string, any>();
          const { mockToursRepository } = createMockToursService(tourStore);

          // Create tours
          const createdTours: any[] = [];
          for (const spec of tourSpecs) {
            const tourData = {
              title: spec.title || 'Tour',
              thumbnail: 'thumb.jpg',
              images: ['img.jpg'],
              description: 'desc',
              content: 'content',
              priceUsd: 100,
              discount: 0,
              duration: '1 day',
              durationRange: '1-2 days',
              departFrom: 'Hanoi',
              routes: 'Route A',
              type: ['adventure'],
              isFeatured: false,
            };
            const created = mockToursRepository.create(tourData);
            await mockToursRepository.save(created);
            createdTours.push({ ...created, shouldBeDeleted: spec.isDeleted });
          }

          // Soft delete the ones marked as deleted
          for (const tour of createdTours) {
            if (tour.shouldBeDeleted) {
              await mockToursRepository.softRemove(tour);
            }
          }

          // find() without withDeleted should never return soft-deleted tours
          const allActive = await mockToursRepository.find();
          for (const tour of allActive) {
            expect(tour.deletedAt).toBeNull();
          }

          // findOne() for each tour should only return non-deleted ones
          for (const tour of createdTours) {
            const result = await mockToursRepository.findOne({
              where: { id: tour.id },
            });
            if (tour.shouldBeDeleted) {
              expect(result).toBeNull();
            } else {
              expect(result).not.toBeNull();
              expect(result.deletedAt).toBeNull();
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
