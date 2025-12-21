import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { GetToursDto } from './dto/get-tours.dto';
@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private toursRepository: Repository<Tour>,
  ) { }

  async create(createTourDto: CreateTourDto) {
    const tour = this.toursRepository.create({
      ...createTourDto,
    });
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
            qb.orWhere(`tour.type LIKE :${paramName}`, { [paramName]: `%${t}%` });
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

    queryBuilder.orderBy('tour.created_at', 'DESC').skip(skip).take(r);

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
    return this.toursRepository.findOneBy({ id });
  }

  async update(id: string, updateTourDto: UpdateTourDto) {
    const tour = await this.findOne(id);
    if (!tour) {
      throw new Error('Tour not found');
    }

    const updatedTour = this.toursRepository.merge(tour, updateTourDto);
    return this.toursRepository.save(updatedTour);
  }

  async remove(id: string) {
    const tour = await this.findOne(id);
    if (!tour) {
      throw new Error('Tour not found');
    }
    return this.toursRepository.remove(tour);
  }
}
