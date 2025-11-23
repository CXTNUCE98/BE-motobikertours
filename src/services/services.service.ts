import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  findAll() {
    return this.servicesRepository.find();
  }

  findOne(id: string) {
    return this.servicesRepository.findOneBy({ id });
  }
}
