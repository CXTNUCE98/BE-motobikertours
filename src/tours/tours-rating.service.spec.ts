// Feature: api-performance-improvements, Property 6: rating stats correctness
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
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 *
 * Property 6: Rating stats correctness and structure
 * For any tour with a set of reviews, the returned ratingStats should have:
 * - averageRating equal to the arithmetic mean of all ratings rounded to 1 decimal place
 * - totalReviews equal to the count of reviews
 * - breakdown containing the correct count per star rating (1-5)
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
    title: 'Rating Test Tour',
    thumbnail: 'thumb.jpg',
    images: ['img1.jpg'],
    description: 'A test tour for rating stats',
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

describe('ToursService — Property 6: rating stats correctness', () => {
  let service: ToursService;
  let tourRepo: Repository<Tour>;
  let reviewRepo: Repository<Review>;
  let userRepo: Repository<User>;
  let ds: DataSource;
  let module: TestingModule;

  const mockOsrm = { calculateRoute: jest.fn() };
  const mockHotSpots = { executeFindOne: jest.fn() };
  const mockVehicles = { findOne: jest.fn() };
  const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

  beforeAll(async () => {
    ds = await getDataSource();
    tourRepo = ds.getRepository(Tour);
    reviewRepo = ds.getRepository(Review);
    userRepo = ds.getRepository(User);

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

  it('ratingStats matches arithmetic mean, totalReviews, and per-star breakdown', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 0, maxLength: 50 }),
        async (ratings) => {
          // Clean slate
          await reviewRepo.query('DELETE FROM reviews');
          await tourRepo.query('DELETE FROM tour');

          // Create a user for reviews
          const user = await userRepo.save(
            userRepo.create({
              userName: `user_${Date.now()}_${Math.random()}`,
              email: `user_${Date.now()}_${Math.random()}@test.com`,
              password: 'hashed',
            }),
          );

          // Create a tour
          const tour = await tourRepo.save(tourRepo.create(makeTourData()));

          // Seed reviews
          for (const rating of ratings) {
            await reviewRepo.save(
              reviewRepo.create({
                tourId: tour.id,
                userId: user.id,
                rating,
                content: 'Test review',
                images: [],
              }),
            );
          }

          // Call findOne
          const result = await service.findOne(tour.id) as any;
          expect(result).not.toBeNull();

          const { ratingStats } = result;
          expect(ratingStats).toBeDefined();

          // Assert totalReviews
          expect(ratingStats.totalReviews).toBe(ratings.length);

          // Assert averageRating
          const expectedAvg =
            ratings.length > 0
              ? parseFloat(
                  (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
                )
              : 0;
          expect(ratingStats.averageRating).toBe(expectedAvg);

          // Assert breakdown has correct per-star counts
          const expectedBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          for (const r of ratings) {
            expectedBreakdown[r]++;
          }
          expect(ratingStats.breakdown).toEqual(expectedBreakdown);
        },
      ),
      { numRuns: 100 },
    );
  });
});
