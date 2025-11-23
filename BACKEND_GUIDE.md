# Hướng Dẫn Xây Dựng Backend (NestJS + Cloudinary) Cho Project Motobike Tours

Tài liệu này hướng dẫn chi tiết cách xây dựng Backend (BE) sử dụng **NestJS** và **Cloudinary** để phục vụ cho Frontend (FE) Motobike Tours hiện tại.

## 1. Công Nghệ & Kiến Trúc Đề Xuất

*   **Framework**: NestJS (Node.js) - Mạnh mẽ, dễ bảo trì, kiến trúc module.
*   **Database**: PostgreSQL - Cơ sở dữ liệu quan hệ, phù hợp với dữ liệu có cấu trúc như Tours, Users, Bookings.
*   **ORM**: TypeORM hoặc Prisma (Khuyên dùng **TypeORM** vì tích hợp tốt với NestJS hoặc **Prisma** vì dễ sử dụng). Trong hướng dẫn này sẽ dùng **TypeORM**.
*   **File Storage**: Cloudinary - Lưu trữ và tối ưu hóa hình ảnh/video.
*   **Authentication**: JWT (JSON Web Token) - Bảo mật API.
*   **API Documentation**: Swagger (OpenAPI).

## 2. Chuẩn Bị Môi Trường

*   Node.js (v18+)
*   PostgreSQL (Có thể cài đặt trực tiếp hoặc dùng Docker)
*   Tài khoản Cloudinary (Lấy Cloud Name, API Key, API Secret)

## 3. Khởi Tạo Project

```bash
# Cài đặt NestJS CLI
npm i -g @nestjs/cli

# Tạo project mới
nest new backend
cd backend

# Cài đặt các thư viện cần thiết
npm install --save @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer cloudinary buffer-to-stream @nestjs/passport passport passport-jwt @nestjs/swagger swagger-ui-express bcrypt
npm install --save-dev @types/passport-jwt @types/bcrypt @types/multer
```

## 4. Cấu Hình (Configuration)

Tạo file `.env` ở thư mục gốc:

```env
PORT=3001
# Database Config
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=motobiketours

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Config
JWT_SECRET=your_super_secret_key
JWT_EXPIRATION=1d
```

## 5. Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

Dựa trên FE hiện tại, chúng ta cần các thực thể (Entities) sau:

### 5.1. User (Người dùng/Admin)
*   `id`: UUID
*   `email`: String (Unique)
*   `password`: String (Hashed)
*   `name`: String
*   `role`: Enum ('ADMIN', 'USER')
*   `provider`: String (local, google, facebook) - *Cho tương lai*
*   `created_at`: Timestamp

### 5.2. Tour (Tour du lịch)
*   `id`: UUID
*   `title`: String
*   `slug`: String (Unique) - *Để làm URL thân thiện*
*   `thumbnail`: String (URL ảnh)
*   `images`: String[] (Mảng URL ảnh gallery)
*   `description`: Text
*   `content`: Text (HTML content)
*   `price_usd`: Decimal
*   `duration`: String (VD: "3 days")
*   `depart_from`: String
*   `routes`: String
*   `type`: String (VD: "Adventure", "Cultural")
*   `is_featured`: Boolean
*   `created_at`: Timestamp

### 5.3. Service (Dịch vụ)
*   `id`: UUID
*   `title`: String
*   `short_title`: String
*   `description`: Text
*   `thumbnail`: String
*   `icon`: String (Class icon, VD: 'bx-shield-check')
*   `price_range`: String
*   `features`: String[] (Mảng các đặc điểm nổi bật)
*   `created_at`: Timestamp

### 5.4. BlogPost (Bài viết)
*   `id`: UUID
*   `title`: String
*   `slug`: String
*   `excerpt`: Text
*   `content`: Text (HTML)
*   `thumbnail`: String
*   `category`: String
*   `author_name`: String
*   `tags`: String[]
*   `created_at`: Timestamp

## 6. Triển Khai Các Module Chính

### 6.1. Cloudinary Module (Upload ảnh)

Tạo `src/cloudinary/cloudinary.provider.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  },
};
```

Tạo `src/cloudinary/cloudinary.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream = require('buffer-to-stream');

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream((error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      toStream(file.buffer).pipe(upload);
    });
  }
}
```

### 6.2. Tours Module (Ví dụ Controller)

```typescript
// src/tours/tours.controller.ts
import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Get()
  findAll() {
    return this.toursService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(@Body() createTourDto: CreateTourDto, @UploadedFile() file: Express.Multer.File) {
    return this.toursService.create(createTourDto, file);
  }
}
```

## 7. Kết Nối Frontend (Nuxt 3) với Backend

Trong project Nuxt 3 hiện tại:

1.  Cấu hình `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001'
    }
  }
})
```

2.  Sử dụng `useFetch` để gọi API thay vì mock data:

Ví dụ trong `src/pages/tour/index.vue`:

```javascript
// Thay vì import { tours } from '../../composables/mockup';
const config = useRuntimeConfig();
const { data: tours, pending, error } = await useFetch(`${config.public.apiBase}/tours`);
```

## 8. Các Bước Tiếp Theo

1.  **Xây dựng Auth Module**: Implement Login/Register trả về JWT Token.
2.  **CRUD cho Tours/Services/Blogs**: Xây dựng đầy đủ API Thêm/Sửa/Xóa.
3.  **Admin Dashboard**: Xây dựng trang Admin trên FE (hoặc một app riêng) để quản lý dữ liệu, gọi các API `POST/PUT/DELETE` (cần bảo vệ bằng Guard Admin).
4.  **Booking API**: Tạo API để nhận thông tin đặt tour từ form liên hệ và lưu vào DB, đồng thời gửi email thông báo (dùng `nodemailer`).

## 9. Gợi ý thêm

*   **Validation**: Sử dụng `class-validator` trong các DTO để kiểm tra dữ liệu đầu vào chặt chẽ.
*   **Security**: Sử dụng `helmet` để tăng cường bảo mật HTTP headers.
*   **Rate Limiting**: Sử dụng `@nestjs/throttler` để chống spam API.
