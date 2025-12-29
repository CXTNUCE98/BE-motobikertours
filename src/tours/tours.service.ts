import { Repository, Brackets } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { GetToursDto } from './dto/get-tours.dto';
import { EstimateTourDto } from './dto/estimate-tour.dto';
import { OsrmRouterService } from './osrm-router.service';
import { HotSpotsService } from '../hot-spots/hot-spots.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private toursRepository: Repository<Tour>,
    private readonly osrmService: OsrmRouterService,
    private readonly hotSpotsService: HotSpotsService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(createTourDto: CreateTourDto) {
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

    return this.toursRepository.save(tour);
  }

  async findAll(query: GetToursDto) {
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

    queryBuilder
      .leftJoinAndSelect('tour.itineraries', 'itinerary')
      .leftJoinAndSelect('itinerary.hotSpot', 'hotSpot')
      .leftJoinAndSelect('tour.suggestedVehicle', 'vehicle')
      .leftJoinAndSelect('tour.reviews', 'review')
      .orderBy('tour.createdAt', 'DESC')
      .addOrderBy('itinerary.order', 'ASC')
      .skip(skip)
      .take(r);

    const [tours, total] = await queryBuilder.getManyAndCount();

    const data = tours.map((tour) => {
      const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const totalReviews = tour.reviews?.length || 0;
      let sum = 0;
      if (tour.reviews) {
        tour.reviews.forEach((r) => {
          sum += r.rating;
          const star = Math.round(r.rating);
          if (star >= 1 && star <= 5) {
            breakdown[star]++;
          }
        });
      }

      const averageRating =
        totalReviews > 0 ? parseFloat((sum / totalReviews).toFixed(1)) : 0;
      return {
        ...tour,
        reviews: undefined,
        ratingStats: {
          averageRating,
          totalReviews,
          breakdown,
        },
      };
    });

    return {
      data,
      total,
      page: p,
      perPage: r,
      totalPages: Math.ceil(total / r),
    };
  }

  async findOne(id: string) {
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

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const totalReviews = tour.reviews?.length || 0;
    let sum = 0;
    if (tour.reviews) {
      tour.reviews.forEach((r) => {
        sum += r.rating;
        const star = Math.round(r.rating);
        if (star >= 1 && star <= 5) {
          breakdown[star]++;
        }
      });
    }

    const averageRating =
      totalReviews > 0 ? parseFloat((sum / totalReviews).toFixed(1)) : 0;

    return {
      ...tour,
      ratingStats: {
        averageRating,
        totalReviews,
        breakdown,
      },
    };
  }

  async update(id: string, updateTourDto: UpdateTourDto) {
    const { itineraries, ...tourData } = updateTourDto;
    const existingTour = await this.toursRepository.findOne({ where: { id } });
    if (!existingTour) {
      throw new Error('Tour not found');
    }

    if (itineraries) {
      existingTour.itineraries = itineraries.map((item, index) => ({
        activityDescription: item.activityDescription,
        durationMinutes: item.durationMinutes,
        hotSpot: { id: item.hotSpotId },
        order: item.order || index + 1,
      })) as any;
    }

    const updatedTour = this.toursRepository.merge(existingTour, tourData);
    return this.toursRepository.save(updatedTour);
  }

  async estimate(estimateDto: EstimateTourDto) {
    const { hotSpotIds, vehicleId } = estimateDto;

    // 1. Lấy thông tin Hot Spots và Vehicle
    const hotSpots = await Promise.all(
      hotSpotIds.map((id) => this.hotSpotsService.executeFindOne(id)),
    );
    const vehicle = await this.vehiclesService.findOne(vehicleId);

    if (!vehicle) {
      throw new Error('Vehicle not found');
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

  async remove(id: string) {
    const tour = await this.findOne(id);
    if (!tour) {
      throw new Error('Tour not found');
    }
    return this.toursRepository.remove(tour);
  }
}
