import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotSpotsService } from './hot-spots.service';
import { HotSpotsController } from './hot-spots.controller';
import { HotSpot } from './entities/hot-spot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotSpot])],
  controllers: [HotSpotsController],
  providers: [HotSpotsService],
  exports: [HotSpotsService],
})
export class HotSpotsModule {}
