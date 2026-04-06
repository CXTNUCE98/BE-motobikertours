import { Module, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ToursModule } from './tours/tours.module';
import { ServicesModule } from './services/services.module';
import { BlogModule } from './blog/blog.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { CommentsModule } from './comments/comments.module';
import { User } from './users/entities/user.entity';
import { Tour } from './tours/entities/tour.entity';
import { Service } from './services/entities/service.entity';
import { BlogPost } from './blog/entities/blog-post.entity';
import { Comment, CommentLike } from './comments/entities/comment.entity';
import { HotSpot } from './hot-spots/entities/hot-spot.entity';
import { HotSpotsModule } from './hot-spots/hot-spots.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { Vehicle } from './vehicles/entities/vehicle.entity';
import { TourItinerary } from './tours/entities/tour-itinerary.entity';
import { Review } from './reviews/entities/review.entity';
import { ReviewsModule } from './reviews/reviews.module';
import { Wishlist } from './wishlist/entities/wishlist.entity';
import { WishlistModule } from './wishlist/wishlist.module';
import { BookingsModule } from './bookings/bookings.module';
import { Booking } from './bookings/entities/booking.entity';
import { Payment } from './bookings/entities/payment.entity';
import { Voucher } from './bookings/entities/voucher.entity';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuditLog } from './audit-log/entities/audit-log.entity';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          try {
            const store = await redisStore({ url: redisUrl });
            logger.log('Redis cache store connected successfully');
            return { store, ttl: 60000 };
          } catch (error) {
            logger.warn(
              `Failed to connect to Redis at ${redisUrl}, falling back to in-memory cache: ${error.message}`,
            );
          }
        }

        return { ttl: 60000 };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const entities = [
          User,
          Tour,
          Service,
          BlogPost,
          Comment,
          CommentLike,
          HotSpot,
          Vehicle,
          TourItinerary,
          Review,
          Wishlist,
          Booking,
          Payment,
          Voucher,
          AuditLog,
        ];

        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';
        const dbSyncConfig = configService.get<string>('DB_SYNCHRONIZE');
        // Production: always false regardless of DB_SYNCHRONIZE
        // Development: true unless DB_SYNCHRONIZE is explicitly set to 'false'
        const shouldSynchronize = isProduction
          ? false
          : dbSyncConfig !== undefined
            ? dbSyncConfig.toLowerCase() === 'true'
            : true;
        const shouldLog =
          configService.get<string>('DB_LOGGING', '').toLowerCase() ===
            'true' || nodeEnv === 'development';

        const baseConfig = {
          entities,
          synchronize: shouldSynchronize,
          logging: shouldLog,
          migrations: ['dist/migrations/*.js'],
        };
        const dbType = configService
          .get<string>('DB_TYPE', 'sqlite')
          .toLowerCase();
        const postgresUrl =
          configService.get<string>('DATABASE_URL') ||
          configService.get<string>('DB_URL') ||
          configService.get<string>('POSTGRES_URL');
        const sslEnabled =
          configService.get<string>(
            'DB_SSL',
            isProduction ? 'true' : 'false',
          ) === 'true';
        const sslConfig = sslEnabled
          ? {
              ssl: { rejectUnauthorized: false },
              extra: { ssl: { rejectUnauthorized: false } },
            }
          : {};

        // SQLite configuration (default - no installation needed)
        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: configService.get<string>('DB_DATABASE', 'dev.db'),
            ...baseConfig,
          };
        }

        // PostgreSQL configuration
        if (dbType === 'postgres') {
          const poolSize = parseInt(
            configService.get<string>('DB_POOL_SIZE', '10'),
            10,
          );
          const poolConfig = {
            extra: {
              ...((sslConfig as any).extra || {}),
              max: poolSize,
              idleTimeoutMillis: 30000,
            },
          };

          if (postgresUrl) {
            return {
              type: 'postgres',
              url: postgresUrl,
              ...baseConfig,
              ...sslConfig,
              ...poolConfig,
            };
          }

          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', ''),
            database: configService.get<string>('DB_DATABASE', 'motobiketours'),
            ...baseConfig,
            ...sslConfig,
            ...poolConfig,
          };
        }

        // MySQL/MariaDB configuration
        if (dbType === 'mysql' || dbType === 'mariadb') {
          return {
            type: 'mysql',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: parseInt(configService.get<string>('DB_PORT', '3306'), 10),
            username: configService.get<string>('DB_USERNAME', 'root'),
            password: configService.get<string>('DB_PASSWORD', ''),
            database: configService.get<string>('DB_DATABASE', 'motobiketours'),
            ...baseConfig,
          };
        }

        // Default to SQLite if unknown type
        return {
          type: 'sqlite',
          database: 'dev.db',
          ...baseConfig,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    CloudinaryModule,
    ToursModule,
    ServicesModule,
    BlogModule,
    UploadModule,
    UsersModule,
    CommentsModule,
    HotSpotsModule,
    VehiclesModule,
    ReviewsModule,
    WishlistModule,
    BookingsModule,
    PaymentsModule,
    HealthModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
