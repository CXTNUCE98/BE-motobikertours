import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, Query, INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');

/**
 * Feature: advanced-infrastructure, Property 5: Compression tôn trọng Accept-Encoding cho response lớn
 *
 * Integration test that verifies compression middleware behavior:
 * - Responses > 1KB with Accept-Encoding: gzip → Content-Encoding: gzip
 * - Responses > 1KB with x-no-compression → no Content-Encoding
 * - Responses < 1KB → no Content-Encoding (below threshold)
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.6**
 */

// Test controller that returns a body of configurable size
@Controller('test-compression')
class TestCompressionController {
  @Get()
  getBody(@Query('size') size: string): string {
    const bodySize = parseInt(size, 10) || 0;
    return 'x'.repeat(bodySize);
  }
}

describe('Compression Middleware (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestCompressionController],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same compression config as main.ts
    app.use(
      compression({
        threshold: 1024,
        filter: (req: any, res: any) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Feature: advanced-infrastructure, Property 5: Compression tôn trọng Accept-Encoding cho response lớn
  // **Validates: Requirements 4.1, 4.2, 4.3, 4.6**
  it('Property 5: Compression respects Accept-Encoding for large responses and x-no-compression header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bodySize: fc.integer({ min: 0, max: 10000 }),
          encoding: fc.constantFrom('gzip', 'br', 'identity'),
          noCompression: fc.boolean(),
        }),
        async ({ bodySize, encoding, noCompression }) => {
          const req = request(app.getHttpServer())
            .get(`/test-compression?size=${bodySize}`)
            .set('Accept-Encoding', encoding);

          if (noCompression) {
            req.set('x-no-compression', 'true');
          }

          const res = await req;

          const contentEncoding = res.headers['content-encoding'];

          if (noCompression) {
            // x-no-compression header → must NOT have Content-Encoding
            expect(contentEncoding).toBeUndefined();
          } else if (bodySize <= 1024) {
            // Response <= 1KB → below threshold, no compression
            expect(contentEncoding).toBeUndefined();
          } else if (encoding === 'gzip') {
            // Response > 1KB with Accept-Encoding: gzip → must compress
            expect(contentEncoding).toBe('gzip');
          } else if (encoding === 'br') {
            // Response > 1KB with Accept-Encoding: br → brotli if supported
            // Node.js 11.7+ supports brotli; if not, no Content-Encoding
            if (contentEncoding) {
              expect(contentEncoding).toBe('br');
            }
          } else if (encoding === 'identity') {
            // identity encoding → no compression
            expect(contentEncoding).toBeUndefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
