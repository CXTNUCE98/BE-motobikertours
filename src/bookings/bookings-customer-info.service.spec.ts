// Feature: api-performance-improvements, Property 7: customerInfo round trip
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
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 *
 * Property 7: CustomerInfo round trip
 * For any customerInfo object { name, email, phone, address? } saved in a booking,
 * reading that booking back should return customerInfo as an equivalent object
 * (not a JSON string).
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

describe('BookingsService — Property 7: customerInfo round trip', () => {
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

  it('customerInfo is stored and retrieved as an object (not a string)', async () => {
    // Seed a stable Tour and User once for all iterations
    const tour = await tourRepo.save(
      tourRepo.create({
        title: 'CustomerInfo Test Tour',
        thumbnail: 'thumb.jpg',
        images: ['img1.jpg'],
        description: 'Test tour for customerInfo round trip',
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

    const user = await userRepo.save(
      userRepo.create({
        userName: 'ci_testuser_' + Math.random().toString(36).slice(2),
        email: `ci_test_${Math.random().toString(36).slice(2)}@example.com`,
        password: 'hashed_password',
        isAdmin: false,
      }),
    );

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          phone: fc.string({ minLength: 1, maxLength: 20 }),
          address: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (customerInfo) => {
          // Create booking directly via repository (bypasses DTO validation)
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 7);

          const booking = bookingRepo.create({
            tourId: tour.id,
            userId: user.id,
            startDate,
            numberOfPeople: 2,
            totalPrice: 200,
            paymentMethod: 'cash',
            status: 'pending',
            paymentStatus: 'unpaid',
            discountAmount: 0,
            depositPaid: 0,
            customerInfo,
          });
          const saved = await bookingRepo.save(booking);

          // Read back via getBookingDetail (admin bypass)
          const result = await service.getBookingDetail(saved.id, undefined, true);

          // Assert customerInfo is an object, not a string
          expect(typeof result.customerInfo).toBe('object');
          expect(result.customerInfo).not.toBeNull();

          // Assert deep equality
          expect(result.customerInfo.name).toBe(customerInfo.name);
          expect(result.customerInfo.email).toBe(customerInfo.email);
          expect(result.customerInfo.phone).toBe(customerInfo.phone);
          expect(result.customerInfo.address).toBe(customerInfo.address);

          // Clean up
          await bookingRepo.delete(saved.id);
        },
      ),
      { numRuns: 100 },
    );
  });
});
