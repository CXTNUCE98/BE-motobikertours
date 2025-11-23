import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

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

    findAll() {
        return this.toursRepository.find();
    }

    findOne(id: string) {
        return this.toursRepository.findOneBy({ id });
    }

    // Add update and remove methods as needed
}
