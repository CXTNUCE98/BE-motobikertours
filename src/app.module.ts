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
        const dbType = configService
          .get<string>('DB_TYPE', 'sqlite')
          .toLowerCase();

        // SQLite configuration (default - no installation needed)
        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: configService.get<string>('DB_DATABASE', 'dev.db'),
            entities: [User, Tour, Service, BlogPost],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            logging: configService.get<string>('NODE_ENV') === 'development',
          };
        }

        // PostgreSQL configuration
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', ''),
            database: configService.get<string>('DB_DATABASE', 'motobiketours'),
            entities: [User, Tour, Service, BlogPost],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            logging: configService.get<string>('NODE_ENV') === 'development',
          };
        }

        // MySQL/MariaDB configuration
        if (dbType === 'mysql' || dbType === 'mariadb') {
          return {
            type: 'mysql',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 3306),
            username: configService.get<string>('DB_USERNAME', 'root'),
            password: configService.get<string>('DB_PASSWORD', ''),
            database: configService.get<string>('DB_DATABASE', 'motobiketours'),
            entities: [User, Tour, Service, BlogPost],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            logging: configService.get<string>('NODE_ENV') === 'development',
          };
        }

        // Default to SQLite if unknown type
        return {
          type: 'sqlite',
          database: 'dev.db',
          entities: [User, Tour, Service, BlogPost],
          synchronize: true,
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
