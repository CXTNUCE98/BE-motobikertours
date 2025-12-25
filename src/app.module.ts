import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ToursModule } from './tours/tours.module';
import { ServicesModule } from './services/services.module';
import { BlogModule } from './blog/blog.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        ];

        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';
        const dbSyncConfig = configService.get<string>('DB_SYNCHRONIZE');
        const shouldSynchronize =
          dbSyncConfig !== undefined
            ? dbSyncConfig.toLowerCase() === 'true'
            : !isProduction;
        const shouldLog =
          configService.get<string>('DB_LOGGING', '').toLowerCase() ===
            'true' || nodeEnv === 'development';

        const baseConfig = {
          entities,
          synchronize: shouldSynchronize,
          logging: shouldLog,
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
          if (postgresUrl) {
            return {
              type: 'postgres',
              url: postgresUrl,
              ...baseConfig,
              ...sslConfig,
            };
          }

          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
            userName: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', ''),
            database: configService.get<string>('DB_DATABASE', 'motobiketours'),
            ...baseConfig,
            ...sslConfig,
          };
        }

        // MySQL/MariaDB configuration
        if (dbType === 'mysql' || dbType === 'mariadb') {
          return {
            type: 'mysql',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: parseInt(configService.get<string>('DB_PORT', '3306'), 10),
            userName: configService.get<string>('DB_USERNAME', 'root'),
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
    UsersModule,
    CommentsModule,
    HotSpotsModule,
    VehiclesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
