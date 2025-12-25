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
        ...item,
        order: index + 1,
      })) as any;
    }

    return this.toursRepository.save(tour);
  }

  async findAll(query: GetToursDto) {
    const {
      q,
      p = 1,
      r = 10,
      price_min,
      price_max,
      duration_range,
      type,
      depart_from,
      is_featured,
    } = query;
    const skip = (p - 1) * r;

    const queryBuilder = this.toursRepository.createQueryBuilder('tour');

    if (q) {
      queryBuilder.andWhere(
        '(tour.title LIKE :q OR tour.description LIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (price_min) {
      queryBuilder.andWhere('tour.price_usd >= :price_min', { price_min });
    }

    if (price_max) {
      queryBuilder.andWhere('tour.price_usd <= :price_max', { price_max });
    }

    if (duration_range) {
      queryBuilder.andWhere('tour.duration_range = :duration_range', {
        duration_range,
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

    if (depart_from && depart_from.length > 0) {
      queryBuilder.andWhere('tour.depart_from IN (:...depart_from)', {
        depart_from,
      });
    }

    if (is_featured !== undefined) {
      queryBuilder.andWhere('tour.is_featured = :is_featured', {
        is_featured,
      });
    }

    queryBuilder
      .leftJoinAndSelect('tour.itineraries', 'itinerary')
      .leftJoinAndSelect('itinerary.hot_spot', 'hot_spot')
      .leftJoinAndSelect('tour.suggested_vehicle', 'vehicle')
      .orderBy('tour.created_at', 'DESC')
      .addOrderBy('itinerary.order', 'ASC')
      .skip(skip)
      .take(r);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: p,
      perPage: r,
      totalPages: Math.ceil(total / r),
    };
  }

  findOne(id: string) {
    return this.toursRepository.findOne({
      where: { id },
      relations: ['itineraries', 'itineraries.hot_spot', 'suggested_vehicle'],
      order: {
        itineraries: {
          order: 'ASC',
        },
      },
    });
  }

  async update(id: string, updateTourDto: UpdateTourDto) {
    const { itineraries, ...tourData } = updateTourDto;
    const tour = await this.findOne(id);
    if (!tour) {
      throw new Error('Tour not found');
    }

    if (itineraries) {
      // Simple strategy: Clear old itineraries and re-create
      // In a real production app, we should use a more sophisticated approach
      tour.itineraries = itineraries.map((item, index) => ({
        ...item,
        order: index + 1,
      })) as any;
    }

    const updatedTour = this.toursRepository.merge(tour, tourData);
    return this.toursRepository.save(updatedTour);
  }

  async estimate(estimateDto: EstimateTourDto) {
    const { hot_spot_ids, vehicle_id } = estimateDto;

    // 1. Lấy thông tin Hot Spots và Vehicle
    const hotSpots = await Promise.all(
      hot_spot_ids.map((id) => this.hotSpotsService.executeFindOne(id)),
    );
    const vehicle = await this.vehiclesService.findOne(vehicle_id);

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
    const basePrice = Number(vehicle.price_per_km) * route.distance;
    const serviceFee = 10;
    const total_usd = Math.round((basePrice + serviceFee) * 100) / 100;

    return {
      ...route,
      vehicle: {
        id: vehicle.id,
        model: vehicle.model,
        price_per_km: vehicle.price_per_km,
      },
      price_estimate_usd: total_usd,
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
