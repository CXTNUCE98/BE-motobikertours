import * as crypto from 'crypto';
// Polyfill for Node.js < 19
if (!global.crypto) {
  // @ts-ignore
  global.crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter for better error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS
  app.enableCors();

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

  await app.listen(process.env.PORT || 3002);
}
bootstrap();
