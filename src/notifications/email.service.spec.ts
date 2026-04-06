// Feature: advanced-infrastructure, Property 12: Template variable replacement đầy đủ
// Feature: advanced-infrastructure, Property 13: Template caching — đọc file chỉ một lần
import * as fc from 'fast-check';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

// Mock nodemailer to avoid real SMTP connections
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

/**
 * Validates: Requirements 7.3
 *
 * Property 12: Template variable replacement đầy đủ
 * For any template string containing placeholders {{variableName}} and an object
 * containing all corresponding keys, after rendering the output must not contain
 * any {{...}} pattern and each value from the object must appear in the output.
 */
describe('EmailService — Property 12: Template variable replacement đầy đủ', () => {
  let service: EmailService;

  beforeEach(() => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-value'),
    } as unknown as ConfigService;
    service = new EmailService(mockConfigService);
  });

  it('after rendering, output contains no {{...}} and all values appear', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^\w+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 50 }),
          { minKeys: 0, maxKeys: 10 },
        ),
        (vars) => {
          // Build a template string with {{key}} placeholders for every key
          const keys = Object.keys(vars);
          const templateParts = keys.map((k) => `prefix_{{${k}}}_suffix`);
          const template = templateParts.join(' ');

          const result = service.renderTemplate(template, vars);

          // No {{...}} pattern should remain
          expect(result).not.toMatch(/\{\{\w+\}\}/);

          // Each value must appear in the output
          for (const value of Object.values(vars)) {
            expect(result).toContain(String(value));
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});


/**
 * Validates: Requirements 7.8
 *
 * Property 13: Template caching — đọc file chỉ một lần
 * For any template name, calling loadTemplate() N times (N >= 2) must perform
 * exactly 1 file read from filesystem; subsequent calls return from cache.
 */

// Mock fs module at the top level so readFileSync is mockable
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    readFileSync: jest.fn(),
  };
});

describe('EmailService — Property 13: Template caching — đọc file chỉ một lần', () => {
  const mockedReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

  beforeEach(() => {
    mockedReadFileSync.mockReset();
  });

  it('loadTemplate() reads file exactly once for N >= 2 calls with same name', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10 }),
        (extraCalls) => {
          // N >= 2 total calls
          const totalCalls = extraCalls + 2;
          const templateName = 'test-template.html';
          const templateContent = '<h1>Hello {{name}}</h1>';

          mockedReadFileSync.mockReset();
          mockedReadFileSync.mockReturnValue(templateContent);

          // Fresh service instance to get a clean cache
          const mockConfigService = {
            get: jest.fn().mockReturnValue('test-value'),
          } as unknown as ConfigService;
          const freshService = new EmailService(mockConfigService);

          // Call loadTemplate N times
          for (let i = 0; i < totalCalls; i++) {
            const result = freshService.loadTemplate(templateName);
            expect(result).toBe(templateContent);
          }

          // fs.readFileSync must have been called exactly once
          expect(mockedReadFileSync).toHaveBeenCalledTimes(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
