import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { Tour } from './entities/tour.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tour]), CloudinaryModule],
  controllers: [ToursController],
  providers: [ToursService],
})
export class ToursModule {}
