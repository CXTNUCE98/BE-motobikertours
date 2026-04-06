// Feature: api-performance-improvements, Property 13: refund policy by cancellation timing
// Feature: api-performance-improvements, Property 14: refund record creation on cancellation
import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Voucher } from './entities/voucher.entity';
import { Tour } from '../tours/entities/tour.entity';
import { User } from '../users/entities/user.entity';
import { TourItinerary } from '../tours/entities/tour-itinerary.entity';
import { HotSpot } from '../hot-spots/entities/hot-spot.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Review } from '../reviews/entities/review.entity';
import { InvoiceService } from '../notifications/invoice.service';
import { BadRequestException } from '@nestjs/common';
import { VoucherValidationService } from './voucher-validation.service';
import { RefundService } from './refund.service';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */

let dataSource: DataSource;

async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [
      Booking,
      Payment,
      Voucher,
      Tour,
      User,
      TourItinerary,
      HotSpot,
      Vehicle,
      Review,
    ],
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();
  return dataSource;
}

describe('BookingsService — Refund properties', () => {
  let service: BookingsService;
  let bookingRepo: Repository<Booking>;
  let paymentRepo: Repository<Payment>;
  let tourRepo: Repository<Tour>;
  let userRepo: Repository<User>;
  let voucherRepo: Repository<Voucher>;
  let ds: DataSource;

  const mockInvoiceService = { generateInvoicePDF: jest.fn() };
  const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

  let sharedTour: Tour;
  let sharedUser: User;
  let sharedAdminUser: User;

  beforeAll(async () => {
    ds = await getDataSource();
    bookingRepo = ds.getRepository(Booking);
    paymentRepo = ds.getRepository(Payment);
    tourRepo = ds.getRepository(Tour);
    userRepo = ds.getRepository(User);
    voucherRepo = ds.getRepository(Voucher);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        VoucherValidationService,
        RefundService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(Voucher), useValue: voucherRepo },
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: DataSource, useValue: ds },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);

    sharedTour = await tourRepo.save(
      tourRepo.create({
        title: 'Refund Test Tour',
        thumbnail: 'thumb.jpg',
        images: ['img1.jpg'],
        description: 'Tour for refund property tests',
        content: 'Content',
        priceUsd: 100,
        discount: 0,
        duration: '3 days',
        durationRange: '2-4 days',
        departFrom: 'Hanoi',
        routes: 'Hanoi - Sapa',
        type: ['adventure'],
        isFeatured: false,
      }),
    );

    sharedUser = await userRepo.save(
      userRepo.create({
        userName: 'refund_user_' + Math.random().toString(36).slice(2),
        email: `refund_${Math.random().toString(36).slice(2)}@example.com`,
        password: 'hashed_password',
        isAdmin: false,
      }),
    );

    sharedAdminUser = await userRepo.save(
      userRepo.create({
        userName: 'refund_admin_' + Math.random().toString(36).slice(2),
        email: `refund_admin_${Math.random().toString(36).slice(2)}@example.com`,
        password: 'hashed_password',
        isAdmin: true,
      }),
    );
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  /**
   * Helper: create a paid booking with a given depositPaid and startDate offset.
   */
  async function createPaidBooking(
    depositPaid: number,
    hoursBeforeStart: number,
  ): Promise<Booking> {
    const startDate = new Date();
    startDate.setTime(startDate.getTime() + hoursBeforeStart * 60 * 60 * 1000);

    const booking = bookingRepo.create({
      userId: sharedUser.id,
      tourId: sharedTour.id,
      startDate: startDate,
      numberOfPeople: 1,
      totalPrice: depositPaid,
      depositPaid: depositPaid,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'fully_paid',
      status: 'confirmed',
    });
    return bookingRepo.save(booking);
  }

  // ─── Property 13: Refund policy by cancellation timing ──────────────────────
  /**
   * Validates: Requirements 11.3, 11.4, 11.5, 11.6
   *
   * For any paid booking:
   * - admin OR hoursBeforeStart >= 48 → refundAmount = depositPaid (100%)
   * - !admin AND 24 <= hoursBeforeStart < 48 → refundAmount = depositPaid * 0.5 (50%)
   * - !admin AND hoursBeforeStart < 24 → throws BadRequestException
   */
  it('Property 13: refund policy by cancellation timing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          depositPaid: fc.float({ min: 1, max: 10000, noNaN: true }),
          hoursBeforeStart: fc.float({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true }),
          isAdmin: fc.boolean(),
        }),
        async ({ depositPaid, hoursBeforeStart, isAdmin }) => {
          const booking = await createPaidBooking(depositPaid, hoursBeforeStart);
          const userId = isAdmin ? sharedAdminUser.id : sharedUser.id;

          // Use a small buffer (0.1h) to avoid boundary race conditions
          // between test setup time and service execution time
          if (isAdmin || hoursBeforeStart >= 48.1) {
            // Expect 100% refund
            const cancelled = await service.cancelBooking(booking.id, userId, isAdmin);
            const expected = (depositPaid * 100) / 100;
            const actual = Number(cancelled.refundAmount);
            // Cleanup
            await paymentRepo.delete({ bookingId: booking.id });
            await bookingRepo.delete({ id: booking.id });
            return Math.abs(actual - expected) < 0.01;
          } else if (hoursBeforeStart >= 24.1) {
            // Expect 50% refund
            const cancelled = await service.cancelBooking(booking.id, userId, false);
            const expected = depositPaid * 0.5;
            const actual = Number(cancelled.refundAmount);
            // Cleanup
            await paymentRepo.delete({ bookingId: booking.id });
            await bookingRepo.delete({ id: booking.id });
            return Math.abs(actual - expected) < 0.01;
          } else {
            // Expect BadRequestException (< 24 hours)
            let threw = false;
            try {
              await service.cancelBooking(booking.id, userId, false);
            } catch (e) {
              threw = e instanceof BadRequestException;
            }
            // Cleanup
            await paymentRepo.delete({ bookingId: booking.id });
            await bookingRepo.delete({ id: booking.id });
            return threw;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ─── Property 14: Refund record creation on cancellation ────────────────────
  /**
   * Validates: Requirements 11.1, 11.2, 11.8
   *
   * For any paid booking cancelled with hoursBeforeStart >= 49 (guarantees 100% refund),
   * a Payment record with status='refund_pending' and amount=refundAmount must exist,
   * and booking.paymentStatus must be 'refund_pending'.
   */
  it('Property 14: refund record creation on cancellation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          depositPaid: fc.float({ min: 1, max: 10000, noNaN: true }),
          hoursBeforeStart: fc.float({ min: 49, max: 200, noNaN: true }),
        }),
        async ({ depositPaid, hoursBeforeStart }) => {
          const booking = await createPaidBooking(depositPaid, hoursBeforeStart);

          const cancelled = await service.cancelBooking(booking.id, sharedUser.id, false);

          // Assert booking paymentStatus is 'refund_pending'
          const paymentStatusOk = cancelled.paymentStatus === 'refund_pending';

          // Assert a Payment record exists with correct status and amount
          const paymentRecord = await paymentRepo.findOne({
            where: { bookingId: booking.id, status: 'refund_pending' },
          });

          const refundAmount = Number(cancelled.refundAmount);
          const paymentRecordOk =
            paymentRecord !== null &&
            paymentRecord.status === 'refund_pending' &&
            Math.abs(Number(paymentRecord.amount) - refundAmount) < 0.01;

          // Cleanup
          await paymentRepo.delete({ bookingId: booking.id });
          await bookingRepo.delete({ id: booking.id });

          return paymentStatusOk && paymentRecordOk;
        },
      ),
      { numRuns: 100 },
    );
  });
});
