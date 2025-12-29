import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Service } from './entities/service.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async findAll(query: PaginationDto) {
    const { q, p = 1, r = 10 } = query;
    const skip = (p - 1) * r;

    const where = q
      ? [
          { title: Like(`%${q}%`) },
          { shortTitle: Like(`%${q}%`) },
          { description: Like(`%${q}%`) },
        ]
      : {};

    const [data, total] = await this.servicesRepository.findAndCount({
      where,
      skip,
      take: r,
      order: { createdAt: 'DESC' },
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
    return this.servicesRepository.findOneBy({ id });
  }
}
