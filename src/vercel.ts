import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import * as crypto from 'crypto';

// Polyfill for Node.js < 19
if (!global.crypto) {
  // @ts-expect-error - Polyfill for older Node versions
  global.crypto = crypto;
}

const expressApp = express();

let app: any;

// Global variable to store bootstrap error
declare global {
  // eslint-disable-next-line no-var
  var bootstrapError: any;
}

const bootstrap = async () => {
  if (!app) {
    try {
      app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

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

      // Swagger
      const config = new DocumentBuilder()
        .setTitle('Motobike Tours API')
        .setDescription('The Motobike Tours API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document, {
        customSiteTitle: 'Motobike Tours API',
        customJs: [
          'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
          'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
        ],
        customCssUrl: [
          'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css',
        ],
      });

      await app.init();
      console.log('NestJS App Initialized successfully');
    } catch (error) {
      console.error('NestJS App Initialization Failed:', error);
      // Store the error to return it in the response
      global.bootstrapError = error;
      return null;
    }
  }
  return app;
};

export default async (req: any, res: any) => {
  // Check for previous bootstrap errors
  if (global.bootstrapError) {
    console.error('Returning cached bootstrap error');
    return res.status(500).json({
      statusCode: 500,
      message: 'Application failed to start',
      error: global.bootstrapError.message,
      stack: global.bootstrapError.stack,
    });
  }

  try {
    const appInstance = await bootstrap();
    if (!appInstance) {
      // If bootstrap failed just now
      return res.status(500).json({
        statusCode: 500,
        message: 'Application failed to start',
        error: global.bootstrapError
          ? global.bootstrapError.message
          : 'Unknown initialization error',
      });
    }
    expressApp(req, res);
  } catch (error) {
    console.error('Serverless Handler Error:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
