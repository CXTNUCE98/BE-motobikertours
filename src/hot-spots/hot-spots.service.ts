import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HotSpot } from './entities/hot-spot.entity';
import { CreateHotSpotDto } from './dto/create-hot-spot.dto';
import { UpdateHotSpotDto } from './dto/update-hot-spot.dto';
import { GetHotSpotsDto } from './dto/get-hot-spots.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class HotSpotsService {
  constructor(
    @InjectRepository(HotSpot)
    private readonly hotSpotRepository: Repository<HotSpot>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async invalidateHotSpotCache(): Promise<void> {
    const store = (this.cacheManager as any).store ?? (this.cacheManager as any).stores?.[0];
    if (store && typeof store.keys === 'function') {
      const keys: string[] = await store.keys('hotspots:*');
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    } else {
      await this.cacheManager.clear();
    }
  }

  async executeCreate(createHotSpotDto: CreateHotSpotDto): Promise<HotSpot> {
    const hotSpot = this.hotSpotRepository.create(createHotSpotDto);
    const result = await this.hotSpotRepository.save(hotSpot);
    await this.invalidateHotSpotCache();
    return result;
  }

  async executeFindAll(query: GetHotSpotsDto) {
    const key = 'hotspots:' + JSON.stringify(query);
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;

    const { lat, lng, category, p = 1, r = 20 } = query;
    const skip = (p - 1) * r;
    const qb = this.hotSpotRepository.createQueryBuilder('hotSpot');

    if (category) {
      qb.andWhere('hotSpot.category = :category', { category });
    }

    let data: any[];
    let total: number;

    if (lat !== undefined && lng !== undefined) {
      // With lat/lng: load all spots for distance calculation, then paginate in-memory
      const spots = await qb.getMany();
      const R = 6371;
      const withDistance = spots
        .map((spot) => {
          const lat1 = lat;
          const lon1 = lng;
          const lat2 = Number(spot.lat);
          const lon2 = Number(spot.lng);
          const toRad = (v: number) => (v * Math.PI) / 180;
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
              Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return { ...spot, distance: Math.round(distance * 10) / 10 };
        })
        .sort((a, b) => a.distance - b.distance);

      total = withDistance.length;
      data = withDistance.slice(skip, skip + r);
    } else {
      // Without lat/lng: use DB-level pagination
      qb.skip(skip).take(r);
      [data, total] = await qb.getManyAndCount();
    }

    const result = {
      data,
      total,
      page: p,
      perPage: r,
      totalPages: Math.ceil(total / r),
    };

    await this.cacheManager.set(key, result, 60000);
    return result;
  }

  async executeFindOne(id: string): Promise<HotSpot & { nearby?: any[] }> {
    const spot = await this.hotSpotRepository.findOne({ where: { id } });
    if (!spot) {
      throw new NotFoundException(`HotSpot with ID ${id} not found`);
    }

    const dbType = this.dataSource.options.type;
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);

    let nearby: any[];

    if (dbType === 'sqlite') {
      nearby = await this.dataSource.query(
        `SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(CAST(lat AS REAL))) * cos(radians(CAST(lng AS REAL)) - radians(?)) + sin(radians(?)) * sin(radians(CAST(lat AS REAL))))) AS distance FROM hot_spot WHERE id != ? ORDER BY distance ASC LIMIT 4`,
        [lat, lng, lat, id],
      );
    } else {
      // PostgreSQL
      nearby = await this.dataSource.query(
        `SELECT *, (6371 * acos(cos(radians($1)) * cos(radians(lat::numeric)) * cos(radians(lng::numeric) - radians($2)) + sin(radians($1)) * sin(radians(lat::numeric)))) AS distance FROM hot_spot WHERE id != $3 ORDER BY distance ASC LIMIT 4`,
        [lat, lng, id],
      );
    }

    return { ...spot, nearby };
  }

  async executeUpdate(
    id: string,
    updateHotSpotDto: UpdateHotSpotDto,
  ): Promise<HotSpot> {
    const spot = await this.executeFindOne(id);
    const updated = Object.assign(spot, updateHotSpotDto);
    const result = await this.hotSpotRepository.save(updated as HotSpot);
    await this.invalidateHotSpotCache();
    return result;
  }

  async executeRemove(id: string): Promise<void> {
    const spot = await this.executeFindOne(id);
    await this.hotSpotRepository.remove(spot as HotSpot);
    await this.invalidateHotSpotCache();
  }
}
