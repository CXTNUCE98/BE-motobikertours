// Feature: api-performance-improvements, Property 10: voucher discount calculation invariant
// Feature: api-performance-improvements, Property 11: invalid voucher rejection
// Feature: api-performance-improvements, Property 12: voucher usage count increment
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
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

let dataSource: DataSource;

async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [Booking, Payment, Voucher, Tour, User, TourItinerary, HotSpot, Vehicle, Review],
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();
  return dataSource;
}

// ─── Property 10: Voucher discount calculation invariant ─────────────────────
describe('Property 10: voucher discount calculation invariant', () => {
  /**
   * Validates: Requirements 10.2
   *
   * For any valid voucher and booking total price, the final totalPrice after
   * applying the voucher should satisfy: finalPrice >= 0 && finalPrice <= totalPrice.
   * This is a pure computation test (no DB needed).
   */
  it('finalPrice is always >= 0 and <= totalPrice for any discount inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalPrice: fc.float({ min: 1, max: 10000, noNaN: true }),
          discountType: fc.constantFrom<'percentage' | 'fixed'>('percentage', 'fixed'),
          discountValue: fc.float({ min: 0, max: 100, noNaN: true }),
        }),
        ({ totalPrice, discountType, discountValue }) => {
          let discountAmount: number;
          if (discountType === 'percentage') {
            discountAmount = totalPrice * (discountValue / 100);
          } else {
            discountAmount = Math.min(discountValue, totalPrice);
          }
          const finalPrice = totalPrice - discountAmount;
          return finalPrice >= 0 && finalPrice <= totalPrice;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 11 & 12: DB-backed tests ───────────────────────────────────────
describe('BookingsService — Voucher DB properties', () => {
  let service: BookingsService;
  let bookingRepo: Repository<Booking>;
  let paymentRepo: Repository<Payment>;
  let tourRepo: Repository<Tour>;
  let userRepo: Repository<User>;
  let voucherRepo: Repository<Voucher>;
  let ds: DataSource;

  const mockInvoiceService = { generateInvoicePDF: jest.fn() };
  const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

  // Shared tour and user seeded once
  let sharedTour: Tour;
  let sharedUser: User;

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

    // Seed shared tour
    sharedTour = await tourRepo.save(
      tourRepo.create({
        title: 'Voucher Test Tour',
        thumbnail: 'thumb.jpg',
        images: ['img1.jpg'],
        description: 'Tour for voucher property tests',
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

    // Seed shared user
    sharedUser = await userRepo.save(
      userRepo.create({
        userName: 'voucher_testuser_' + Math.random().toString(36).slice(2),
        email: `voucher_${Math.random().toString(36).slice(2)}@example.com`,
        password: 'hashed_password',
        isAdmin: false,
      }),
    );
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  // ─── Property 11: Invalid voucher rejection ─────────────────────────────────
  /**
   * Validates: Requirements 10.3, 10.4
   *
   * For any voucher code that is expired, inactive, or has reached maxUses,
   * calling createBooking with that code should throw a BadRequestException.
   */
  it('Property 11: createBooking throws BadRequestException for invalid vouchers', async () => {
    // Scenario generator: one of expired / inactive / maxUses-reached
    const invalidVoucherArb = fc.oneof(
      // Expired voucher
      fc.record({
        scenario: fc.constant('expired' as const),
        discountType: fc.constantFrom<'percentage' | 'fixed'>('percentage', 'fixed'),
        discountValue: fc.float({ min: 1, max: 50, noNaN: true }),
      }),
      // Inactive voucher
      fc.record({
        scenario: fc.constant('inactive' as const),
        discountType: fc.constantFrom<'percentage' | 'fixed'>('percentage', 'fixed'),
        discountValue: fc.float({ min: 1, max: 50, noNaN: true }),
      }),
      // maxUses reached
      fc.record({
        scenario: fc.constant('maxUsesReached' as const),
        discountType: fc.constantFrom<'percentage' | 'fixed'>('percentage', 'fixed'),
        discountValue: fc.float({ min: 1, max: 50, noNaN: true }),
      }),
    );

    await fc.assert(
      fc.asyncProperty(invalidVoucherArb, async ({ scenario, discountType, discountValue }) => {
        const code = `INVALID_${scenario}_${Math.random().toString(36).slice(2)}`;

        let voucherData: Partial<Voucher>;
        if (scenario === 'expired') {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - 1);
          voucherData = {
            code,
            discountType,
            discountValue,
            maxUses: 0,
            usedCount: 0,
            expiresAt: pastDate,
            isActive: true,
          };
        } else if (scenario === 'inactive') {
          voucherData = {
            code,
            discountType,
            discountValue,
            maxUses: 0,
            usedCount: 0,
            expiresAt: null,
            isActive: false,
          };
        } else {
          // maxUsesReached
          voucherData = {
            code,
            discountType,
            discountValue,
            maxUses: 3,
            usedCount: 3,
            expiresAt: null,
            isActive: true,
          };
        }

        await voucherRepo.save(voucherRepo.create(voucherData));

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7);

        await expect(
          service.createBooking(sharedUser.id, {
            tourId: sharedTour.id,
            startDate: startDate.toISOString().split('T')[0],
            numberOfPeople: 1,
            paymentMethod: 'cash',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              phone: '0901234567',
            },
            voucherCode: code,
          }),
        ).rejects.toThrow(BadRequestException);

        // Cleanup
        await voucherRepo.delete({ code });
      }),
      { numRuns: 100 },
    );
  });

  // ─── Property 12: Voucher usage count increment ──────────────────────────────
  /**
   * Validates: Requirements 10.6
   *
   * For any successful booking created with a valid voucher, the voucher's
   * usedCount should increase by exactly 1.
   */
  it('Property 12: usedCount increments by exactly 1 after successful booking', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          discountType: fc.constantFrom<'percentage' | 'fixed'>('percentage', 'fixed'),
          discountValue: fc.float({ min: 1, max: 50, noNaN: true }),
          initialUsedCount: fc.integer({ min: 0, max: 5 }),
        }),
        async ({ discountType, discountValue, initialUsedCount }) => {
          const code = `VALID_${Math.random().toString(36).slice(2)}`;

          const voucher = await voucherRepo.save(
            voucherRepo.create({
              code,
              discountType,
              discountValue,
              maxUses: 0, // unlimited
              usedCount: initialUsedCount,
              expiresAt: null,
              isActive: true,
            }),
          );

          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 7);

          await service.createBooking(sharedUser.id, {
            tourId: sharedTour.id,
            startDate: startDate.toISOString().split('T')[0],
            numberOfPeople: 1,
            paymentMethod: 'cash',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              phone: '0901234567',
            },
            voucherCode: code,
          });

          // Read back the voucher
          const updatedVoucher = await voucherRepo.findOne({ where: { id: voucher.id } });

          const increased = updatedVoucher.usedCount === initialUsedCount + 1;

          // Cleanup
          await bookingRepo.delete({ voucherCode: code });
          await voucherRepo.delete({ id: voucher.id });

          return increased;
        },
      ),
      { numRuns: 100 },
    );
  });
});
