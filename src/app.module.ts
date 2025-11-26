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
import { User } from './users/entities/user.entity';
import { Tour } from './tours/entities/tour.entity';
import { Service } from './services/entities/service.entity';
import { BlogPost } from './blog/entities/blog-post.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const entities = [User, Tour, Service, BlogPost];
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
        const postgresUrl =
          configService.get<string>('DATABASE_URL') ||
          configService.get<string>('DB_URL') ||
          configService.get<string>('POSTGRES_URL');

        let dbType = configService.get<string>('DB_TYPE', '').toLowerCase();

        // Auto-detect postgres if URL is present and dbType is not explicitly set
        if (!dbType && postgresUrl) {
          dbType = 'postgres';
        }

        // Default to sqlite if still not set
        if (!dbType) {
          dbType = 'sqlite';
        }
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
            username: configService.get<string>('DB_USERNAME', 'postgres'),
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
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
