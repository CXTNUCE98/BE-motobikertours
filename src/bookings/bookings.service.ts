import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Voucher } from './entities/voucher.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';
import { Tour } from '../tours/entities/tour.entity';
import { InvoiceService } from '../notifications/invoice.service';
import { VoucherValidationService } from './voucher-validation.service';
import { RefundService } from './refund.service';
import { AuditLogService } from '../audit-log/audit-log.service';

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
    private invoiceService: InvoiceService,
    private readonly dataSource: DataSource,
    private readonly voucherValidationService: VoucherValidationService,
    private readonly refundService: RefundService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Create new booking
   */
  async createBooking(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      // Check if tour exists
      const tour = await manager.findOne(Tour, {
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

      // Apply voucher discount if provided
      let discountAmount = 0;
      let voucher: Voucher | null = null;

      if (createBookingDto.voucherCode) {
        voucher = await this.voucherValidationService.validateVoucher(
          createBookingDto.voucherCode,
        );
        discountAmount = this.voucherValidationService.calculateDiscount(
          voucher,
          totalPrice,
        );
      }

      const finalPrice = totalPrice - discountAmount;

      // Calculate expiry time (30 minutes for pending booking)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      // Create booking
      const booking = this.bookingsRepository.create({
        userId,
        tourId: createBookingDto.tourId,
        startDate: createBookingDto.startDate,
        numberOfPeople: createBookingDto.numberOfPeople,
        totalPrice: finalPrice,
        paymentMethod: createBookingDto.paymentMethod,
        specialRequests: createBookingDto.specialRequests,
        customerInfo: createBookingDto.customerInfo,
        voucherCode: createBookingDto.voucherCode,
        discountAmount,
        expiresAt,
        status: 'pending',
        paymentStatus: 'unpaid',
      });

      const savedBooking = await manager.save(Booking, booking);

      // Increment voucher usedCount after successful booking - atomic with booking
      if (voucher) {
        voucher.usedCount++;
        await manager.save(Voucher, voucher);
      }

      return savedBooking;
    });
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
    ipAddress?: string,
  ): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      // Fetch booking with relations inside the transaction
      const booking = await manager.findOne(Booking, {
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

      // Kiểm tra trạng thái
      if (booking.status === 'cancelled') {
        throw new BadRequestException('Booking đã được hủy trước đó');
      }

      if (booking.status === 'completed') {
        throw new BadRequestException('Không thể hủy booking đã hoàn thành');
      }

      // Kiểm tra thời gian hủy
      const startDate = new Date(booking.startDate);
      const now = new Date();
      const hoursDiff =
        (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      const isPaid = ['fully_paid', 'partially_paid'].includes(
        booking.paymentStatus,
      );

      if (isPaid) {
        const { refundAmount } = this.refundService.calculateRefundAmount(
          Number(booking.depositPaid),
          hoursDiff,
          isAdmin,
        );
        booking.refundAmount = refundAmount;
        booking.paymentStatus = 'refund_pending';
        const refundPayment = this.refundService.createRefundPaymentEntity(
          booking,
          refundAmount,
        );
        await manager.save(
          Payment,
          this.paymentsRepository.create(refundPayment),
        );
      } else {
        // Unpaid booking: enforce 24h rule for non-admin
        if (hoursDiff < 24 && !isAdmin) {
          throw new BadRequestException(
            'Chỉ có thể hủy booking trước 24 giờ khởi hành',
          );
        }
      }

      const beforeStatus = booking.status;
      booking.status = 'cancelled';

      const result = await manager.save(Booking, booking);

      await this.auditLogService.log({
        userId: userId || 'system',
        action: 'CANCEL',
        entityType: 'Booking',
        entityId: id,
        changes: { before: { status: beforeStatus }, after: { status: 'cancelled' } },
        ipAddress,
      });

      return result;
    });
  }

  /**
   * Confirm booking (Admin only)
   */
  async confirmBooking(id: string, userId?: string, ipAddress?: string): Promise<Booking> {
    const booking = await this.getBookingDetail(id, null, true);

    if (booking.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể xác nhận booking pending');
    }

    const before = { status: booking.status };
    booking.status = 'confirmed';

    // TODO: Gửi email xác nhận

    const result = await this.bookingsRepository.save(booking);

    await this.auditLogService.log({
      userId: userId || 'system',
      action: 'UPDATE',
      entityType: 'Booking',
      entityId: id,
      changes: { before, after: { status: 'confirmed' } },
      ipAddress,
    });

    return result;
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
