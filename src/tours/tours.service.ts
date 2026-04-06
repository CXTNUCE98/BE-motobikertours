import { Repository, Brackets, Not, IsNull } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { Review } from '../reviews/entities/review.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { GetToursDto } from './dto/get-tours.dto';
import { EstimateTourDto } from './dto/estimate-tour.dto';
import { OsrmRouterService } from './osrm-router.service';
import { HotSpotsService } from '../hot-spots/hot-spots.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private toursRepository: Repository<Tour>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private readonly osrmService: OsrmRouterService,
    private readonly hotSpotsService: HotSpotsService,
    private readonly vehiclesService: VehiclesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async invalidateTourCache(): Promise<void> {
    const store = (this.cacheManager as any).store ?? (this.cacheManager as any).stores?.[0];
    if (store && typeof store.keys === 'function') {
      const keys: string[] = await store.keys('tours:*');
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    } else {
      await this.cacheManager.clear();
    }
  }

  async create(createTourDto: CreateTourDto, userId?: string, ipAddress?: string) {
    const { itineraries, ...tourData } = createTourDto;
    const tour = this.toursRepository.create(tourData);

    if (itineraries) {
      tour.itineraries = itineraries.map((item, index) => ({
        activityDescription: item.activityDescription,
        durationMinutes: item.durationMinutes,
        hotSpot: { id: item.hotSpotId },
        order: item.order || index + 1,
      })) as any;
    }

    const result = await this.toursRepository.save(tour);
    await this.invalidateTourCache();

    await this.auditLogService.log({
      userId: userId || 'system',
      action: 'CREATE',
      entityType: 'Tour',
      entityId: result.id,
      changes: { after: result },
      ipAddress,
    });

    return result;
  }

  async findAll(query: GetToursDto) {
    const key = 'tours:' + JSON.stringify(query);
    const cached = await this.cacheManager.get(key);
    if (cached) return cached;

    const {
      q,
      p = 1,
      r = 10,
      priceMin,
      priceMax,
      durationRange,
      type,
      departFrom,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;
    const skip = (p - 1) * r;

    const queryBuilder = this.toursRepository.createQueryBuilder('tour');

    if (q) {
      queryBuilder.andWhere(
        '(tour.title LIKE :q OR tour.description LIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (priceMin) {
      queryBuilder.andWhere('tour.priceUsd >= :priceMin', { priceMin });
    }

    if (priceMax) {
      queryBuilder.andWhere('tour.priceUsd <= :priceMax', { priceMax });
    }

    if (durationRange) {
      queryBuilder.andWhere('tour.durationRange = :durationRange', {
        durationRange,
      });
    }

    if (type && type.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          type.forEach((t, index) => {
            const paramName = `type_${index}`;
            qb.orWhere(`tour.type LIKE :${paramName}`, {
              [paramName]: `%${t}%`,
            });
          });
        }),
      );
    }

    if (departFrom && departFrom.length > 0) {
      queryBuilder.andWhere('tour.departFrom IN (:...departFrom)', {
        departFrom,
      });
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('tour.isFeatured = :isFeatured', {
        isFeatured,
      });
    }

    const allowedSortColumns = ['priceUsd', 'createdAt', 'durationRange', 'title'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder
      .select([
        'tour.id',
        'tour.title',
        'tour.thumbnail',
        'tour.priceUsd',
        'tour.discount',
        'tour.duration',
        'tour.durationRange',
        'tour.departFrom',
        'tour.routes',
        'tour.type',
        'tour.isFeatured',
        'tour.createdAt',
        'tour.description',
      ])
      .leftJoinAndSelect('tour.suggestedVehicle', 'vehicle')
      .orderBy(`tour.${safeSortBy}`, safeSortOrder)
      .skip(skip)
      .take(r);

    const [tours, total] = await queryBuilder.getManyAndCount();

    const data = await Promise.all(
      tours.map(async (tour) => {
        const ratingStats = await this.computeRatingStats(tour.id);
        const truncatedDesc = tour.description?.length > 200
          ? tour.description.substring(0, 200) + '...'
          : tour.description;
        return {
          ...tour,
          description: truncatedDesc,
          ratingStats,
        };
      }),
    );

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

  async findOne(id: string, options?: { light?: boolean }) {
    const { light = false } = options || {};

    // Light mode: only basic info for booking page (skip reviews + itineraries)
    if (light) {
      const tour = await this.toursRepository.findOne({
        where: { id },
        relations: ['suggestedVehicle'],
      });

      if (!tour) return null;

      const ratingStats = await this.computeRatingStats(tour.id);

      return {
        id: tour.id,
        title: tour.title,
        thumbnail: tour.thumbnail,
        priceUsd: tour.priceUsd,
        discount: tour.discount,
        duration: tour.duration,
        durationRange: tour.durationRange,
        departFrom: tour.departFrom,
        type: tour.type,
        isFeatured: tour.isFeatured,
        description: tour.description,
        suggestedVehicle: tour.suggestedVehicle,
        ratingStats,
      };
    }

    // Full mode: load all relations (for tour detail page)
    const tour = await this.toursRepository.findOne({
      where: { id },
      relations: [
        'itineraries',
        'itineraries.hotSpot',
        'suggestedVehicle',
        'reviews',
        'reviews.user',
      ],
      order: {
        itineraries: {
          order: 'ASC',
        },
        reviews: {
          createdAt: 'DESC',
        },
      },
    });

    if (!tour) return null;

    const ratingStats = await this.computeRatingStats(tour.id);

    return {
      ...tour,
      ratingStats,
    };
  }

  private async computeRatingStats(tourId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    breakdown: Record<number, number>;
  }> {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .addSelect('review.rating', 'star')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.tourId = :tourId', { tourId })
      .groupBy('review.rating')
      .getRawMany();

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalReviews = 0;
    let weightedSum = 0;

    for (const row of stats) {
      const star = Math.round(Number(row.star));
      const count = Number(row.count);
      if (star >= 1 && star <= 5) {
        breakdown[star] = count;
      }
      totalReviews += count;
      weightedSum += star * count;
    }

    const averageRating =
      totalReviews > 0
        ? parseFloat((weightedSum / totalReviews).toFixed(1))
        : 0;

    return { averageRating, totalReviews, breakdown };
  }

  async update(id: string, updateTourDto: UpdateTourDto, userId?: string, ipAddress?: string) {
    const { itineraries, ...tourData } = updateTourDto;
    const existingTour = await this.toursRepository.findOne({ where: { id } });
    if (!existingTour) {
      throw new NotFoundException('Tour not found');
    }

    const before = { ...existingTour };

    if (itineraries) {
      existingTour.itineraries = itineraries.map((item, index) => ({
        activityDescription: item.activityDescription,
        durationMinutes: item.durationMinutes,
        hotSpot: { id: item.hotSpotId },
        order: item.order || index + 1,
      })) as any;
    }

    const updatedTour = this.toursRepository.merge(existingTour, tourData);
    const result = await this.toursRepository.save(updatedTour);
    await this.invalidateTourCache();

    await this.auditLogService.log({
      userId: userId || 'system',
      action: 'UPDATE',
      entityType: 'Tour',
      entityId: id,
      changes: { before, after: result },
      ipAddress,
    });

    return result;
  }

  async estimate(estimateDto: EstimateTourDto) {
    const { hotSpotIds, vehicleId } = estimateDto;

    // 1. Lấy thông tin Hot Spots và Vehicle
    const hotSpots = await Promise.all(
      hotSpotIds.map((id) => this.hotSpotsService.executeFindOne(id)),
    );
    const vehicle = await this.vehiclesService.findOne(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // 2. Lấy tọa độ để tính toán lộ trình
    const coordinates: [number, number][] = hotSpots.map((spot) => [
      Number(spot.lng),
      Number(spot.lat),
    ]);

    // 3. Gọi OSRM API
    const route = await this.osrmService.calculateRoute(coordinates);

    // 4. Tính toán giá tiền
    // Giá = (Tiền xe/km * Quãng đường) + Phí dịch vụ cố định (ví dụ 10 USD)
    const basePrice = Number(vehicle.pricePerKm) * route.distance;
    const serviceFee = 10;
    const totalUsd = Math.round((basePrice + serviceFee) * 100) / 100;

    return {
      ...route,
      vehicle: {
        id: vehicle.id,
        model: vehicle.model,
        pricePerKm: vehicle.pricePerKm,
      },
      priceEstimateUsd: totalUsd,
      currency: 'USD',
    };
  }

  async remove(id: string, userId?: string, ipAddress?: string) {
    const tour = await this.toursRepository.findOne({ where: { id } });
    if (!tour) {
      throw new NotFoundException('Tour not found');
    }
    const result = await this.toursRepository.softRemove(tour);
    await this.invalidateTourCache();

    await this.auditLogService.log({
      userId: userId || 'system',
      action: 'DELETE',
      entityType: 'Tour',
      entityId: id,
      changes: { before: tour },
      ipAddress,
    });

    return result;
  }

  async findDeleted(): Promise<Tour[]> {
    return this.toursRepository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
    });
  }

  async restore(id: string, userId?: string, ipAddress?: string): Promise<Tour> {
    const tour = await this.toursRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!tour) {
      throw new NotFoundException('Tour not found');
    }
    const result = await this.toursRepository.recover(tour);
    await this.invalidateTourCache();

    await this.auditLogService.log({
      userId: userId || 'system',
      action: 'RESTORE',
      entityType: 'Tour',
      entityId: id,
      changes: { before: { deletedAt: tour.deletedAt }, after: { deletedAt: null } },
      ipAddress,
    });

    return result;
  }
}
