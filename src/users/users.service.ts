import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(email: string): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ email });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(query: PaginationDto) {
    const { q, p = 1, r = 10 } = query;
    const skip = (p - 1) * r;

    const where = q
      ? [{ userName: Like(`%${q}%`) }, { email: Like(`%${q}%`) }]
      : {};

    const [data, total] = await this.usersRepository.findAndCount({
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

  async findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ id });
  }

  async update(id: string, attrs: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, attrs);
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
