import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as crypto from 'crypto';

// Polyfill for Node.js < 19
if (!global.crypto) {
  // @ts-ignore
  global.crypto = crypto;
}

const expressApp = express();

let app: any;

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
      SwaggerModule.setup('api', app, document);

      await app.init();
      console.log('NestJS App Initialized successfully');
    } catch (error) {
      console.error('NestJS App Initialization Failed:', error);
      throw error;
    }
  }
  return app;
};

export default async (req: any, res: any) => {
  try {
    await bootstrap();
    expressApp(req, res);
  } catch (error) {
    console.error('Serverless Handler Error:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
};
