# Blog API Documentation

## Tổng quan
API Blog được xây dựng theo Clean Architecture với các tính năng:
- Tạo blog post với validation đầy đủ
- Upload ảnh cho nội dung blog
- Tự động tạo slug từ tên blog (hỗ trợ tiếng Việt)
- Tích hợp Cloudinary để lưu trữ ảnh

## Cấu trúc thư mục (Clean Architecture)

```
src/blog/
├── dto/                          # Data Transfer Objects
│   ├── create-blog.dto.ts       # DTO cho việc tạo blog
│   └── upload-image.dto.ts      # DTO response cho upload ảnh
├── entities/                     # Database Entities
│   └── blog-post.entity.ts      # Entity BlogPost
├── blog.controller.ts           # Controller xử lý HTTP requests
├── blog.service.ts              # Business logic
└── blog.module.ts               # Module configuration
```

## API Endpoints

### 1. Create Blog Post
**Endpoint:** `POST /blog`

**Request Body:**
```json
{
    "name": "Digital right managements",
    "lang": "vi",
    "thumbnail": "image-j_muyWVa",
    "shortDescription": "21421412421",
    "content": "<p>22222222222222222222222222222222222222222222222222222222222222222222222222222</p><p> </p><p> </p><figure class=\"image\"><img src=\"image-BIZu3Aad\"></figure><p>21421214</p><p>12</p><p>14</p><p>12</p><p>412</p><p>4</p><p>12</p><p>412412</p>",
    "tags": [
        "2412421"
    ],
    "numWords": 9,
    "status": "waiting"
}
```

**Response:** `201 Created`
```json
{
    "id": "uuid-generated",
    "name": "Digital right managements",
    "slug": "digital-right-managements",
    "lang": "vi",
    "thumbnail": "image-j_muyWVa",
    "shortDescription": "21421412421",
    "content": "...",
    "tags": ["2412421"],
    "numWords": 9,
    "status": "waiting",
    "created_at": "2025-11-25T15:47:19.000Z"
}
```

**Validation:**
- `name`: Required, string
- `lang`: Required, string (e.g., "vi", "en")
- `thumbnail`: Required, string (image ID from upload)
- `shortDescription`: Required, string
- `content`: Required, string (HTML content)
- `tags`: Required, array of strings
- `numWords`: Required, number
- `status`: Required, enum ("waiting", "published", "draft")

**Error Responses:**
- `400 Bad Request`: Dữ liệu không hợp lệ
- `409 Conflict`: Blog với tên này đã tồn tại

### 2. Upload Image
**Endpoint:** `POST /blog/upload-image`

**Content-Type:** `multipart/form-data`

**Request:**
- Field name: `file`
- Allowed types: JPEG, PNG, GIF, WebP
- Max size: Theo cấu hình Cloudinary

**Response:** `201 Created`
```json
{
    "imageId": "image-abc123xyz",
    "url": "http://res.cloudinary.com/your-cloud/image/upload/v1234567890/abc123xyz.jpg",
    "secureUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/abc123xyz.jpg"
}
```

**Error Responses:**
- `400 Bad Request`: Không có file hoặc file không hợp lệ

### 3. Get All Blogs
**Endpoint:** `GET /blog`

**Response:** `200 OK`
```json
[
    {
        "id": "uuid",
        "name": "Blog title",
        "slug": "blog-title",
        "lang": "vi",
        "thumbnail": "image-id",
        "shortDescription": "...",
        "content": "...",
        "tags": ["tag1", "tag2"],
        "numWords": 100,
        "status": "published",
        "created_at": "2025-11-25T15:47:19.000Z"
    }
]
```

### 4. Get Blog by ID
**Endpoint:** `GET /blog/:id`

**Response:** `200 OK`
```json
{
    "id": "uuid",
    "name": "Blog title",
    "slug": "blog-title",
    ...
}
```

**Error Responses:**
- `404 Not Found`: Blog không tồn tại

## Workflow tạo blog với ảnh

1. **Upload ảnh trước khi tạo blog:**
   ```bash
   POST /blog/upload-image
   Content-Type: multipart/form-data
   
   file: [your-image-file]
   ```
   
   Response:
   ```json
   {
       "imageId": "image-abc123",
       "url": "https://...",
       "secureUrl": "https://..."
   }
   ```

2. **Sử dụng imageId trong content khi tạo blog:**
   ```bash
   POST /blog
   Content-Type: application/json
   
   {
       "name": "My Blog",
       "lang": "vi",
       "thumbnail": "image-abc123",  // Từ bước 1
       "content": "<p>Text</p><img src='image-abc123'>",  // Sử dụng imageId
       ...
   }
   ```

## Tính năng đặc biệt

### Auto Slug Generation
- Tự động tạo slug từ tên blog
- Hỗ trợ tiếng Việt (loại bỏ dấu)
- Chuyển đổi: "Quản lý số" → "quan-ly-so"
- Kiểm tra trùng lặp slug

### Validation
- Sử dụng `class-validator` để validate dữ liệu
- Tự động trả về lỗi 400 với thông tin chi tiết nếu dữ liệu không hợp lệ

### Image Upload
- Tích hợp Cloudinary
- Validate loại file (chỉ cho phép ảnh)
- Trả về URL an toàn (HTTPS)
- Tạo imageId theo format "image-{public_id}"

## Testing với Swagger

Truy cập: `http://localhost:3000/api` để test các API qua Swagger UI

## Environment Variables

Đảm bảo có các biến môi trường sau trong `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
