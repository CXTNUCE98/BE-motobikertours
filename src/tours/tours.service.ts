import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { GetToursDto, DurationRange } from './dto/get-tours.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private toursRepository: Repository<Tour>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createTourDto: CreateTourDto, file: Express.Multer.File) {
    let thumbnailUrl = '';
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      thumbnailUrl = uploadResult.secure_url;
    }

    const tour = this.toursRepository.create({
      ...createTourDto,
      thumbnail: thumbnailUrl,
      images: createTourDto.images || [],
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
      switch (duration_range) {
        case DurationRange.ONE_TO_THREE:
          queryBuilder.andWhere('tour.duration_days BETWEEN 1 AND 3');
          break;
        case DurationRange.FOUR_TO_SEVEN:
          queryBuilder.andWhere('tour.duration_days BETWEEN 4 AND 7');
          break;
        case DurationRange.EIGHT_PLUS:
          queryBuilder.andWhere('tour.duration_days >= 8');
          break;
      }
    }

    if (type && type.length > 0) {
      queryBuilder.andWhere('tour.type IN (:...type)', { type });
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

  async update(
    id: string,
    updateTourDto: UpdateTourDto,
    file?: Express.Multer.File,
  ) {
    const tour = await this.findOne(id);
    if (!tour) {
      throw new Error('Tour not found');
    }

    let thumbnailUrl = tour.thumbnail;
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      thumbnailUrl = uploadResult.secure_url;
    }

    const updatedTour = this.toursRepository.merge(tour, {
      ...updateTourDto,
      thumbnail: thumbnailUrl,
    });

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
