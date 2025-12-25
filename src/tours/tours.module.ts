import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { Tour } from './entities/tour.entity';
import { TourItinerary } from './entities/tour-itinerary.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { HotSpotsModule } from '../hot-spots/hot-spots.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { OsrmRouterService } from './osrm-router.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tour, TourItinerary]),
    CloudinaryModule,
    HotSpotsModule,
    VehiclesModule,
  ],
  controllers: [ToursController],
  providers: [ToursService, OsrmRouterService],
  exports: [ToursService],
})
export class ToursModule {}
