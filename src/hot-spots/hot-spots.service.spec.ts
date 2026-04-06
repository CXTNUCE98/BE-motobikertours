// Feature: api-performance-improvements, Property 2: nearby spots correctness
import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource, Repository } from 'typeorm';
import { HotSpotsService } from './hot-spots.service';
import { HotSpot } from './entities/hot-spot.entity';

/**
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 *
 * Property 2: Nearby spots correctness
 * For any hot spot with id X in a database of N spots, executeFindOne(X) should
 * return a nearby array of at most 4 spots, sorted by ascending distance,
 * where none of the spots has id X.
 */

let dataSource: DataSource;

async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [HotSpot],
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();
  return dataSource;
}

describe('HotSpotsService — Property 2: nearby spots correctness', () => {
  let service: HotSpotsService;
  let hotSpotRepo: Repository<HotSpot>;
  let ds: DataSource;

  beforeAll(async () => {
    ds = await getDataSource();
    hotSpotRepo = ds.getRepository(HotSpot);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotSpotsService,
        { provide: getRepositoryToken(HotSpot), useValue: hotSpotRepo },
        { provide: DataSource, useValue: ds },
        {
          provide: CACHE_MANAGER,
          useValue: { get: async () => null, set: async () => {}, clear: async () => {} },
        },
      ],
    }).compile();

    service = module.get<HotSpotsService>(HotSpotsService);
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  it('nearby array has at most 4 spots, sorted by distance ASC, and excludes the queried spot', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            lat: fc.float({ min: -89, max: 89, noNaN: true }),
            lng: fc.float({ min: -179, max: 179, noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        async (spotDefs) => {
          // Clean slate
          await hotSpotRepo.query('DELETE FROM hot_spot');

          // Seed spots
          const saved: HotSpot[] = [];
          for (const def of spotDefs) {
            const spot = hotSpotRepo.create({
              name: 'Spot',
              category: 'Check-in',
              address: 'Test address',
              lat: def.lat,
              lng: def.lng,
              rating: 0,
              isHot: false,
            });
            saved.push(await hotSpotRepo.save(spot));
          }

          // Pick the first spot as the target
          const target = saved[0];
          const result = await service.executeFindOne(target.id);

          const nearby: any[] = result.nearby ?? [];

          // 1. At most 4 nearby spots
          expect(nearby.length).toBeLessThanOrEqual(4);

          // 2. Does not contain the queried spot's id
          for (const n of nearby) {
            expect(n.id).not.toBe(target.id);
          }

          // 3. Sorted by distance ASC
          for (let i = 1; i < nearby.length; i++) {
            expect(Number(nearby[i].distance)).toBeGreaterThanOrEqual(
              Number(nearby[i - 1].distance),
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
