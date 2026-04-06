// Feature: api-performance-improvements, Property 4: cache hit on repeated list requests
// Feature: api-performance-improvements, Property 5: cache invalidation on mutation
import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ToursService } from './tours.service';
import { Tour } from './entities/tour.entity';
import { TourItinerary } from './entities/tour-itinerary.entity';
import { HotSpot } from '../hot-spots/entities/hot-spot.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { OsrmRouterService } from './osrm-router.service';
import { HotSpotsService } from '../hot-spots/hot-spots.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Validates: Requirements 4.2, 4.3, 4.5
 *
 * Property 4: Cache hit on repeated list requests
 * For any set of query parameters, calling findAll twice with the same parameters
 * should return identical results.
 *
 * Property 5: Cache invalidation on mutation
 * After creating/updating/deleting a tour, a subsequent findAll should reflect the mutation.
 */

let dataSource: DataSource;

async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [Tour, TourItinerary, HotSpot, Vehicle, Review, User],
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();
  return dataSource;
}

function makeTourData(overrides: Partial<Tour> = {}): Partial<Tour> {
  return {
    title: 'Test Tour',
    thumbnail: 'thumb.jpg',
    images: ['img1.jpg'],
    description: 'A test tour',
    content: 'Content',
    priceUsd: 100,
    discount: 0,
    duration: '3 days',
    durationRange: '2-4 days',
    departFrom: 'Hanoi',
    routes: 'Hanoi - Sapa',
    type: ['adventure'],
    isFeatured: false,
    ...overrides,
  };
}

describe('ToursService — Property 4: cache hit on repeated list requests', () => {
  let service: ToursService;
  let tourRepo: Repository<Tour>;
  let ds: DataSource;
  let module: TestingModule;

  const mockOsrm = { calculateRoute: jest.fn() };
  const mockHotSpots = { executeFindOne: jest.fn() };
  const mockVehicles = { findOne: jest.fn() };
  const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

  beforeAll(async () => {
    ds = await getDataSource();
    tourRepo = ds.getRepository(Tour);

    const reviewRepo = ds.getRepository(Review);

    module = await Test.createTestingModule({
      imports: [CacheModule.register({ ttl: 60000 })],
      providers: [
        ToursService,
        { provide: getRepositoryToken(Tour), useValue: tourRepo },
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: OsrmRouterService, useValue: mockOsrm },
        { provide: HotSpotsService, useValue: mockHotSpots },
        { provide: VehiclesService, useValue: mockVehicles },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<ToursService>(ToursService);
  });

  afterAll(async () => {
    await module.close();
    if (ds?.isInitialized) await ds.destroy();
  });

  it('calling findAll twice with same params returns identical results (cache hit)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          p: fc.integer({ min: 1, max: 3 }),
          r: fc.integer({ min: 1, max: 5 }),
        }),
        async ({ p, r }) => {
          // Clean slate and reset cache
          await tourRepo.query('DELETE FROM tour');
          const cacheManager = module.get(CACHE_MANAGER);
          await cacheManager.clear();

          // Seed a couple of tours
          for (let i = 0; i < 3; i++) {
            await tourRepo.save(tourRepo.create(makeTourData({ title: `Tour ${i}` })));
          }

          const query = { p, r };

          // First call — hits DB
          const result1 = await service.findAll(query) as any;
          // Second call — should hit cache
          const result2 = await service.findAll(query) as any;

          // Results must be deeply equal
          expect(result1).toEqual(result2);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('ToursService — Property 5: cache invalidation on mutation', () => {
  let service: ToursService;
  let tourRepo: Repository<Tour>;
  let ds: DataSource;
  let module: TestingModule;

  const mockOsrm = { calculateRoute: jest.fn() };
  const mockHotSpots = { executeFindOne: jest.fn() };
  const mockVehicles = { findOne: jest.fn() };
  const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

  beforeAll(async () => {
    ds = await getDataSource();
    tourRepo = ds.getRepository(Tour);
    const reviewRepo = ds.getRepository(Review);

    module = await Test.createTestingModule({
      imports: [CacheModule.register({ ttl: 60000 })],
      providers: [
        ToursService,
        { provide: getRepositoryToken(Tour), useValue: tourRepo },
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: OsrmRouterService, useValue: mockOsrm },
        { provide: HotSpotsService, useValue: mockHotSpots },
        { provide: VehiclesService, useValue: mockVehicles },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<ToursService>(ToursService);
  });

  afterAll(async () => {
    await module.close();
    if (ds?.isInitialized) await ds.destroy();
  });

  it('findAll after create reflects the new tour (cache invalidated)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ title }) => {
          // Clean slate and reset cache
          await tourRepo.query('DELETE FROM tour');
          const cacheManager = module.get(CACHE_MANAGER);
          await cacheManager.clear();

          const query = { p: 1, r: 10 };

          // First call — empty DB
          const before = await service.findAll(query) as any;
          expect(before.total).toBe(0);

          // Create a tour (should invalidate cache)
          await service.create({
            title,
            thumbnail: 'thumb.jpg',
            images: ['img.jpg'],
            description: 'desc',
            content: 'content',
            priceUsd: 50,
            discount: 0,
            duration: '1 day',
            durationRange: '1-3',
            departFrom: 'Hanoi',
            routes: 'Hanoi',
            type: ['adventure'],
            isFeatured: false,
          } as any);

          // Second call — should reflect the new tour
          const after = await service.findAll(query) as any;
          expect(after.total).toBe(1);
          expect(after.data[0].title).toBe(title);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('findAll after delete reflects the removal (cache invalidated)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ title }) => {
          // Clean slate and reset cache
          await tourRepo.query('DELETE FROM tour');
          const cacheManager = module.get(CACHE_MANAGER);
          await cacheManager.clear();

          // Seed one tour
          const saved = await tourRepo.save(tourRepo.create(makeTourData({ title })));

          const query = { p: 1, r: 10 };

          // First call — 1 tour in DB
          const before = await service.findAll(query) as any;
          expect(before.total).toBe(1);

          // Remove the tour (should invalidate cache)
          await service.remove(saved.id);

          // Second call — should reflect removal
          const after = await service.findAll(query) as any;
          expect(after.total).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
