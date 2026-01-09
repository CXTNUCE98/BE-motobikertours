import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';
import { Tour } from '../tours/entities/tour.entity';
import { InvoiceService } from '../notifications/invoice.service';

/**
 * Service xử lý business logic cho bookings
 */
@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Tour)
    private toursRepository: Repository<Tour>,
    private invoiceService: InvoiceService,
  ) {}

  /**
   * Create new booking
   */
  async createBooking(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    // Check if tour exists
    const tour = await this.toursRepository.findOne({
      where: { id: createBookingDto.tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour không tồn tại');
    }

    // Check if start date is in the future
    const startDate = new Date(createBookingDto.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Ngày khởi hành phải trong tương lai');
    }

    // Calculate total price
    const totalPrice = tour.priceUsd * createBookingDto.numberOfPeople;

    // Calculate expiry time (30 minutes for pending booking)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Create booking
    const booking = this.bookingsRepository.create({
      userId,
      tourId: createBookingDto.tourId,
      startDate: createBookingDto.startDate,
      numberOfPeople: createBookingDto.numberOfPeople,
      totalPrice,
      paymentMethod: createBookingDto.paymentMethod,
      specialRequests: createBookingDto.specialRequests,
      customerInfo: JSON.stringify(createBookingDto.customerInfo),
      voucherCode: createBookingDto.voucherCode,
      discountAmount: 0, // Sẽ được cập nhật nếu có voucher
      expiresAt,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    return await this.bookingsRepository.save(booking);
  }

  /**
   * Get list of bookings with filter and pagination
   */
  async getBookingsList(
    filterBookingDto: FilterBookingDto,
    userId?: string,
    isAdmin = false,
  ) {
    const {
      status,
      paymentStatus,
      tourId,
      fromDate,
      toDate,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterBookingDto;

    const query = this.bookingsRepository.createQueryBuilder('booking');

    // Join với tour và user
    query.leftJoinAndSelect('booking.tour', 'tour');
    query.leftJoinAndSelect('booking.user', 'user');

    // Filter theo user nếu không phải admin
    if (!isAdmin && userId) {
      query.where('booking.userId = :userId', { userId });
    } else if (filterBookingDto.userId) {
      query.where('booking.userId = :userId', {
        userId: filterBookingDto.userId,
      });
    }

    // Filter theo status
    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    // Filter theo payment status
    if (paymentStatus) {
      query.andWhere('booking.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    // Filter theo tour
    if (tourId) {
      query.andWhere('booking.tourId = :tourId', { tourId });
    }

    // Filter theo date range
    if (fromDate && toDate) {
      query.andWhere('booking.startDate BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    } else if (fromDate) {
      query.andWhere('booking.startDate >= :fromDate', { fromDate });
    } else if (toDate) {
      query.andWhere('booking.startDate <= :toDate', { toDate });
    }

    // Sorting
    query.orderBy(`booking.${sortBy}`, sortOrder);

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    query.skip((pageNum - 1) * limitNum);
    query.take(limitNum);

    const [bookings, total] = await query.getManyAndCount();

    return {
      data: bookings,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get booking detail
   */
  async getBookingDetail(
    id: string,
    userId?: string,
    isAdmin = false,
  ): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['tour', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    // Kiểm tra quyền truy cập
    if (!isAdmin && userId && booking.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem booking này');
    }

    return booking;
  }

  /**
   * Update booking
   */
  async updateBooking(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId?: string,
    isAdmin = false,
  ): Promise<Booking> {
    const booking = await this.getBookingDetail(id, userId, isAdmin);

    // Only admin can update status
    if (
      (updateBookingDto.status || updateBookingDto.paymentStatus) &&
      !isAdmin
    ) {
      throw new ForbiddenException(
        'You do not have permission to update booking status',
      );
    }

    // Cannot update completed or cancelled bookings
    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new BadRequestException('Cannot update this booking');
    }

    Object.assign(booking, updateBookingDto);
    return await this.bookingsRepository.save(booking);
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    id: string,
    userId?: string,
    isAdmin = false,
  ): Promise<Booking> {
    const booking = await this.getBookingDetail(id, userId, isAdmin);

    // Kiểm tra trạng thái
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking đã được hủy trước đó');
    }

    if (booking.status === 'completed') {
      throw new BadRequestException('Không thể hủy booking đã hoàn thành');
    }

    // Kiểm tra thời gian hủy (ví dụ: phải hủy trước 24h)
    const startDate = new Date(booking.startDate);
    const now = new Date();
    const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24 && !isAdmin) {
      throw new BadRequestException(
        'Chỉ có thể hủy booking trước 24 giờ khởi hành',
      );
    }

    booking.status = 'cancelled';

    // TODO: Xử lý refund nếu đã thanh toán

    return await this.bookingsRepository.save(booking);
  }

  /**
   * Confirm booking (Admin only)
   */
  async confirmBooking(id: string): Promise<Booking> {
    const booking = await this.getBookingDetail(id, null, true);

    if (booking.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể xác nhận booking pending');
    }

    booking.status = 'confirmed';

    // TODO: Gửi email xác nhận

    return await this.bookingsRepository.save(booking);
  }

  /**
   * Auto-cancel expired bookings
   */
  async autoCancelExpiredBookings(): Promise<number> {
    const now = new Date();

    const result = await this.bookingsRepository.update(
      {
        status: 'pending',
        paymentStatus: 'unpaid',
        expiresAt: LessThan(now),
      },
      {
        status: 'cancelled',
      },
    );

    return result.affected || 0;
  }

  /**
   * Get current user's bookings
   */
  async getMyBookings(userId: string, filterBookingDto: FilterBookingDto) {
    return this.getBookingsList(filterBookingDto, userId, false);
  }

  /**
   * Generate invoice PDF for booking
   */
  async generateInvoice(
    id: string,
    userId?: string,
    isAdmin = false,
  ): Promise<Buffer> {
    const booking = await this.getBookingDetail(id, userId, isAdmin);
    return this.invoiceService.generateInvoicePDF(booking);
  }
}
