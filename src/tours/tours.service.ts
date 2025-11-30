import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tour } from './entities/tour.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { GetToursDto } from './dto/get-tours.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private toursRepository: Repository<Tour>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createTourDto: CreateTourDto,
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    let thumbnailUrl = '';
    if (files?.thumbnail?.[0]) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        files.thumbnail[0],
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    const imageUrls: string[] = [];
    if (files?.images && files.images.length > 0) {
      const uploadPromises = files.images.map((file) =>
        this.cloudinaryService.uploadImage(file),
      );
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls.push(...uploadResults.map((result) => result.secure_url));
    }

    // Ensure createTourDto.images is an array (it might be a single string or undefined from multipart)
    let dtoImages: string[] = [];
    if (createTourDto.images) {
      if (Array.isArray(createTourDto.images)) {
        dtoImages = createTourDto.images;
      } else {
        dtoImages = [createTourDto.images];
      }
    }

    const tour = this.toursRepository.create({
      ...createTourDto,
      thumbnail: thumbnailUrl,
      images: [...dtoImages, ...imageUrls],
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
      depart_from,
      is_featured,
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
      queryBuilder.andWhere('tour.duration_range = :duration_range', {
        duration_range,
      });
    }

    if (type && type.length > 0) {
      queryBuilder.andWhere('tour.type IN (:...type)', { type });
    }

    if (depart_from && depart_from.length > 0) {
      queryBuilder.andWhere('tour.depart_from IN (:...depart_from)', {
        depart_from,
      });
    }

    if (is_featured !== undefined) {
      queryBuilder.andWhere('tour.is_featured = :is_featured', {
        is_featured,
      });
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
    files?: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    console.log('Update tour called with:', { id, updateTourDto, files });
    console.log(
      'is_featured in DTO:',
      updateTourDto.is_featured,
      'type:',
      typeof updateTourDto.is_featured,
    );

    const tour = await this.findOne(id);
    if (!tour) {
      throw new Error('Tour not found');
    }

    let thumbnailUrl = tour.thumbnail;
    if (files?.thumbnail?.[0]) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        files.thumbnail[0],
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    const newImageUrls: string[] = [];
    if (files?.images && files.images.length > 0) {
      const uploadPromises = files.images.map((file) =>
        this.cloudinaryService.uploadImage(file),
      );
      const uploadResults = await Promise.all(uploadPromises);
      newImageUrls.push(...uploadResults.map((result) => result.secure_url));
    }

    // Handle images from DTO
    let finalImages = tour.images; // Default: keep existing images

    if (updateTourDto.images !== undefined) {
      // If images field is explicitly provided in the DTO, use it
      if (Array.isArray(updateTourDto.images)) {
        finalImages = [...updateTourDto.images, ...newImageUrls];
      } else if (typeof updateTourDto.images === 'string') {
        finalImages = [updateTourDto.images, ...newImageUrls];
      } else {
        // If images is null or empty, reset to only new uploads
        finalImages = newImageUrls;
      }
    } else if (newImageUrls.length > 0) {
      // If no images in DTO but we have new uploads, append them
      finalImages = [...tour.images, ...newImageUrls];
    }

    // Build update object, only including fields that are actually provided
    const updateData: any = {};

    // Only update fields that are explicitly provided in updateTourDto
    Object.keys(updateTourDto).forEach((key) => {
      if (
        updateTourDto[key] !== undefined &&
        key !== 'images' &&
        key !== 'is_featured'
      ) {
        updateData[key] = updateTourDto[key];
      }
    });

    // Explicitly handle is_featured to ensure false values are properly set
    // Handle both string and boolean values from form-data
    if ('is_featured' in updateTourDto) {
      const isFeaturedValue = updateTourDto.is_featured;
      console.log(
        'is_featured value received:',
        isFeaturedValue,
        'type:',
        typeof isFeaturedValue,
      );

      if (typeof isFeaturedValue === 'string') {
        // Handle string values: 'true', 'false', '1', '0', etc.
        const normalizedValue = String(isFeaturedValue).toLowerCase().trim();
        updateData.is_featured =
          normalizedValue === 'true' ||
          normalizedValue === '1' ||
          normalizedValue === 'yes';
        console.log('Converted string to boolean:', updateData.is_featured);
      } else if (typeof isFeaturedValue === 'boolean') {
        updateData.is_featured = isFeaturedValue;
        console.log('Boolean value used as-is:', updateData.is_featured);
      } else {
        // Fallback: convert to boolean
        updateData.is_featured = Boolean(isFeaturedValue);
        console.log('Converted to boolean:', updateData.is_featured);
      }
    }

    // Always set thumbnail and images
    updateData.thumbnail = thumbnailUrl;
    updateData.images = finalImages;

    console.log('Update data:', updateData);

    const updatedTour = this.toursRepository.merge(tour, updateData);

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
