# Tóm tắt thay đổi - API Đăng ký User

## ✅ Các file đã được cập nhật

### 1. User Entity (`src/users/entities/user.entity.ts`)

- ❌ Xóa: `name`, `role`, `UserRole` enum
- ✅ Thêm: `username`, `isAdmin`, `timezone`, `lastPasswordChange`, `avatar`

### 2. Create User DTO (`src/users/dto/create-user.dto.ts`)

- ❌ Xóa: `name`
- ✅ Thêm: `username` (required), `isAdmin` (optional), `timezone` (optional), `avatar` (optional)

### 3. Auth Service (`src/auth/auth.service.ts`)

- Cập nhật JWT payload: `username` (từ user.username), `isAdmin` (thay vì role)
- Xóa unused imports

### 4. JWT Strategy (`src/auth/jwt.strategy.ts`)

- Cập nhật validate method để trả về `username` và `isAdmin`

## 📝 API Endpoint mới

### POST `/auth/register`

**Request Body:**

```json
{
  "username": "admin", // Required
  "email": "admin@gmail.com", // Required
  "password": "P@ssw0rd", // Required (min 6 chars)
  "isAdmin": false, // Optional (default: false)
  "timezone": "Asia/Ho_Chi_Minh", // Optional (default: Asia/Ho_Chi_Minh)
  "avatar": "" // Optional (default: '')
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Payload:**

```json
{
  "username": "admin",
  "email": "admin@gmail.com",
  "sub": "uuid-here",
  "isAdmin": false,
  "avatar": ""
}
```

## 🔄 Breaking Changes

1. **Database Schema**: Cần migrate database (xem `MIGRATION_GUIDE.md`)
2. **JWT Tokens**: Tokens cũ sẽ không còn valid
3. **Frontend**: Cần update để:
   - Gửi `username` thay vì `name` khi đăng ký
   - Sử dụng `isAdmin` thay vì `role`
   - Xử lý các trường mới: `timezone`, `avatar`

## 🚀 Next Steps

1. **Backup database** (quan trọng!)
2. Chạy migration (xem `MIGRATION_GUIDE.md`)
3. Test API với Swagger: `http://localhost:3000/api`
4. Update frontend code
5. Test end-to-end flow

## 📚 Documentation

- Chi tiết migration: `MIGRATION_GUIDE.md`
- API docs: `http://localhost:3000/api` (Swagger UI)

## 📝 Blog API Changes

### 1. Blog Post Entity (`src/blog/entities/blog-post.entity.ts`)

- ❌ Xóa: `author_name` (string)
- ✅ Thêm: `author` (json object)

### 2. Create Blog DTO (`src/blog/dto/create-blog.dto.ts`)

- ✅ Thêm trường `author` object:

```json
{
  "category": "Technology",
  "author": {
    "authId": "uuid",
    "avatar": "url",
    "username": "string"
  }
}
```
