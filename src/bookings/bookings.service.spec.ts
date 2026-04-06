// Feature: api-performance-improvements, Property 3: booking relations explicitly loaded
import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Tour } from '../tours/entities/tour.entity';
import { User } from '../users/entities/user.entity';
import { TourItinerary } from '../tours/entities/tour-itinerary.entity';
import { HotSpot } from '../hot-spots/entities/hot-spot.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Review } from '../reviews/entities/review.entity';
import { Voucher } from './entities/voucher.entity';
import { InvoiceService } from '../notifications/invoice.service';
import { VoucherValidationService } from './voucher-validation.service';
import { RefundService } from './refund.service';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * Property 3: Booking relations are explicitly loaded
 * For any booking id, calling getBookingDetail should return a booking object
 * where both tour and user fields are populated (not null/undefined).
 */

let dataSource: DataSource;

async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [Booking, Payment, Tour, User, TourItinerary, HotSpot, Vehicle, Review, Voucher],
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();
  return dataSource;
}

describe('BookingsService — Property 3: booking relations explicitly loaded', () => {
  let service: BookingsService;
  let bookingRepo: Repository<Booking>;
  let paymentRepo: Repository<Payment>;
  let tourRepo: Repository<Tour>;
  let userRepo: Repository<User>;
  let voucherRepo: Repository<Voucher>;
  let ds: DataSource;

  const mockInvoiceService = { generateInvoicePDF: jest.fn() };
  const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

  const mockAuditLogService1 = { log: jest.fn().mockResolvedValue(undefined) };

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
        { provide: AuditLogService, useValue: mockAuditLogService1 },
        { provide: DataSource, useValue: ds },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  it('getBookingDetail returns booking with tour and user populated (not null)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          numberOfPeople: fc.integer({ min: 1, max: 10 }),
          totalPrice: fc.float({ min: 10, max: 5000, noNaN: true }),
          paymentMethod: fc.constantFrom('cash', 'vnpay'),
        }),
        async ({ numberOfPeople, totalPrice, paymentMethod }) => {
          // Clean slate
          await bookingRepo.query('DELETE FROM bookings');
          await tourRepo.query('DELETE FROM tour');
          await userRepo.query('DELETE FROM user');

          // Seed a Tour
          const tour = tourRepo.create({
            title: 'Test Tour',
            thumbnail: 'thumb.jpg',
            images: ['img1.jpg'],
            description: 'A test tour',
            content: 'Content',
            priceUsd: totalPrice / numberOfPeople,
            discount: 0,
            duration: '3 days',
            durationRange: '2-4 days',
            departFrom: 'Hanoi',
            routes: 'Hanoi - Sapa',
            type: ['adventure'],
            isFeatured: false,
          });
          const savedTour = await tourRepo.save(tour);

          // Seed a User
          const user = userRepo.create({
            userName: 'testuser_' + Math.random().toString(36).slice(2),
            email: `test_${Math.random().toString(36).slice(2)}@example.com`,
            password: 'hashed_password',
            isAdmin: false,
          });
          const savedUser = await userRepo.save(user);

          // Seed a Booking
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 7);

          const booking = bookingRepo.create({
            tourId: savedTour.id,
            userId: savedUser.id,
            startDate,
            numberOfPeople,
            totalPrice,
            paymentMethod,
            status: 'pending',
            paymentStatus: 'unpaid',
            discountAmount: 0,
            depositPaid: 0,
          });
          const savedBooking = await bookingRepo.save(booking);

          // Call getBookingDetail as admin to bypass ownership check
          const result = await service.getBookingDetail(savedBooking.id, undefined, true);

          // Assert tour and user are populated
          expect(result.tour).not.toBeNull();
          expect(result.tour).not.toBeUndefined();
          expect(result.user).not.toBeNull();
          expect(result.user).not.toBeUndefined();

          // Assert correct tour and user are loaded
          expect(result.tour.id).toBe(savedTour.id);
          expect(result.user.id).toBe(savedUser.id);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: advanced-infrastructure, Property 8: Booking bị hủy vẫn tồn tại trong database
/**
 * Validates: Requirements 5.4
 *
 * Property 8: Cancelled booking still exists in database
 * For any Booking with status other than 'cancelled' and 'completed',
 * after calling cancelBooking(), the Booking record still exists in database
 * with status === 'cancelled'.
 */
describe('BookingsService — Property 8: Cancelled booking still exists in database', () => {
  let service: BookingsService;
  let bookingRepo: Repository<Booking>;
  let paymentRepo: Repository<Payment>;
  let tourRepo: Repository<Tour>;
  let userRepo: Repository<User>;
  let voucherRepo: Repository<Voucher>;
  let ds: DataSource;

  const mockInvoiceService = { generateInvoicePDF: jest.fn() };
  const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

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
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  it('after cancelBooking(), booking record still exists with status cancelled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          status: fc.constantFrom('pending', 'confirmed'),
          paymentStatus: fc.constantFrom('unpaid', 'fully_paid'),
        }),
        async ({ status, paymentStatus }) => {
          // Clean slate
          await paymentRepo.query('DELETE FROM payments');
          await bookingRepo.query('DELETE FROM bookings');
          await tourRepo.query('DELETE FROM tour');
          await userRepo.query('DELETE FROM user');

          // Seed a Tour
          const tour = tourRepo.create({
            title: 'Cancel Test Tour',
            thumbnail: 'thumb.jpg',
            images: ['img1.jpg'],
            description: 'A test tour for cancellation',
            content: 'Content',
            priceUsd: 100,
            discount: 0,
            duration: '3 days',
            durationRange: '2-4 days',
            departFrom: 'Hanoi',
            routes: 'Hanoi - Sapa',
            type: ['adventure'],
            isFeatured: false,
          });
          const savedTour = await tourRepo.save(tour);

          // Seed a User
          const user = userRepo.create({
            userName: 'canceluser_' + Math.random().toString(36).slice(2),
            email: `cancel_${Math.random().toString(36).slice(2)}@example.com`,
            password: 'hashed_password',
            isAdmin: false,
          });
          const savedUser = await userRepo.save(user);

          // Seed a Booking with future start date (>24h from now for cancellation)
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 7);

          const depositPaid = paymentStatus === 'fully_paid' ? 100 : 0;

          const booking = bookingRepo.create({
            tourId: savedTour.id,
            userId: savedUser.id,
            startDate,
            numberOfPeople: 2,
            totalPrice: 200,
            paymentMethod: 'cash',
            status,
            paymentStatus,
            discountAmount: 0,
            depositPaid,
          });
          const savedBooking = await bookingRepo.save(booking);

          // Cancel booking as admin (bypasses ownership and time checks)
          await service.cancelBooking(savedBooking.id, undefined, true);

          // Verify booking still exists in database with status 'cancelled'
          const bookingInDb = await bookingRepo.findOne({
            where: { id: savedBooking.id },
          });

          expect(bookingInDb).not.toBeNull();
          expect(bookingInDb!.status).toBe('cancelled');
          expect(bookingInDb!.id).toBe(savedBooking.id);
        },
      ),
      { numRuns: 100 },
    );
  });
});
