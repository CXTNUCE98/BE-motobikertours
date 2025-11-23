import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
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
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'dev.db',
      entities: [User, Tour, Service, BlogPost],
      synchronize: true,
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
export class AppModule { }
