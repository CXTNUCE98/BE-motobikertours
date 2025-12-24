import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotSpot } from './entities/hot-spot.entity';
import { CreateHotSpotDto } from './dto/create-hot-spot.dto';
import { UpdateHotSpotDto } from './dto/update-hot-spot.dto';
import { GetHotSpotsDto } from './dto/get-hot-spots.dto';

@Injectable()
export class HotSpotsService {
  constructor(
    @InjectRepository(HotSpot)
    private readonly hotSpotRepository: Repository<HotSpot>,
  ) {}

  async executeCreate(createHotSpotDto: CreateHotSpotDto): Promise<HotSpot> {
    const hotSpot = this.hotSpotRepository.create(createHotSpotDto);
    return await this.hotSpotRepository.save(hotSpot);
  }

  async executeFindAll(query: GetHotSpotsDto) {
    const { lat, lng, category } = query;
    const qb = this.hotSpotRepository.createQueryBuilder('hot_spot');

    if (category) {
      qb.andWhere('hot_spot.category = :category', { category });
    }

    const spots = await qb.getMany();

    if (lat !== undefined && lng !== undefined) {
      return spots
        .map((spot) => {
          const distance = this.calculateDistance(
            lat,
            lng,
            Number(spot.lat),
            Number(spot.lng),
          );
          return { ...spot, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal
        })
        .sort((a, b) => a.distance - b.distance);
    }

    return spots;
  }

  async executeFindOne(id: string): Promise<HotSpot & { nearby?: any[] }> {
    const spot = await this.hotSpotRepository.findOne({ where: { id } });
    if (!spot) {
      throw new NotFoundException(`HotSpot with ID ${id} not found`);
    }

    // Get nearby spots (same category or closest)
    const allSpots = await this.hotSpotRepository.find();
    const nearby = allSpots
      .filter((s) => s.id !== id)
      .map((s) => ({
        ...s,
        distance: this.calculateDistance(
          Number(spot.lat),
          Number(spot.lng),
          Number(s.lat),
          Number(s.lng),
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);

    return { ...spot, nearby };
  }

  async executeUpdate(
    id: string,
    updateHotSpotDto: UpdateHotSpotDto,
  ): Promise<HotSpot> {
    const spot = await this.executeFindOne(id);
    const updated = Object.assign(spot, updateHotSpotDto);
    return await this.hotSpotRepository.save(updated);
  }

  async executeRemove(id: string): Promise<void> {
    const spot = await this.executeFindOne(id);
    await this.hotSpotRepository.remove(spot);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
