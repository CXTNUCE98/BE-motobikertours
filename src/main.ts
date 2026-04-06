import * as crypto from 'crypto';
// Polyfill for Node.js < 19
if (!global.crypto) {
  // @ts-expect-error polyfill for Node < 19
  global.crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Compression middleware — registered before all other middleware
  app.use(
    compression({
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // Global exception filter for better error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProduction
    ? (process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : true;

  if (
    isProduction &&
    Array.isArray(allowedOrigins) &&
    allowedOrigins.length === 0
  ) {
    logger.warn(
      'ALLOWED_ORIGINS not set in production — using safe default []',
    );
  }

  app.enableCors({
    origin:
      Array.isArray(allowedOrigins) && allowedOrigins.length > 0
        ? allowedOrigins
        : isProduction
          ? false
          : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Motobike Tours API')
    .setDescription('The Motobike Tours API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:3001', 'Local Development')
    .addServer('https://motobikertours-api.vercel.app', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI at /api
  SwaggerModule.setup('api', app, document);

  // Add JSON endpoint for API documentation
  app.use('/api-docs-json', (req, res) => {
    res.json(document);
  });

  await app.listen(process.env.PORT || 3001);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT || 3001}`,
  );
  console.log(
    `📚 Swagger API docs: http://localhost:${process.env.PORT || 3001}/api`,
  );
}
bootstrap();
