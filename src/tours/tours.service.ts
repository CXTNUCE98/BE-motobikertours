import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private toursRepository: Repository<Tour>,
    private cloudinaryService: CloudinaryService,
  ) { }

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

  async findAll(query: PaginationDto) {
    const { q, p = 1, r = 10 } = query;
    const skip = (p - 1) * r;

    const where = q
      ? [
        { title: Like(`%${q}%`) },
        { description: Like(`%${q}%`) },
      ]
      : {};

    const [data, total] = await this.toursRepository.findAndCount({
      where,
      skip,
      take: r,
      order: { created_at: 'DESC' },
    });

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

  // Add update and remove methods as needed
}
