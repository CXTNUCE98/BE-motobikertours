# Migration Guide - User Schema Update

## Thay đổi Schema

Đã cập nhật User entity với các thay đổi sau:

### Trường bị xóa:

- `name` (string) - Tên đầy đủ của user
- `role` (enum: ADMIN | USER) - Vai trò của user

### Trường mới được thêm:

- `username` (string, unique) - Tên đăng nhập
- `isAdmin` (boolean, default: false) - Cờ đánh dấu admin
- `timezone` (string, default: 'Asia/Ho_Chi_Minh') - Múi giờ
- `lastPasswordChange` (Date, nullable) - Lần đổi mật khẩu cuối
- `avatar` (string, default: '') - URL avatar

## Form đăng ký mới

```json
{
  "username": "admin",
  "email": "admin@gmail.com",
  "password": "P@ssw0rd",
  "isAdmin": false,
  "timezone": "Asia/Ho_Chi_Minh",
  "avatar": ""
}
```

## Các trường optional:

- `isAdmin` - Mặc định: false
- `timezone` - Mặc định: 'Asia/Ho_Chi_Minh'
- `avatar` - Mặc định: ''

## JWT Payload thay đổi

### Trước:

```json
{
  "username": "user@email.com",
  "sub": "user-id",
  "role": "USER"
}
```

### Sau:

```json
{
  "username": "admin",
  "sub": "user-id",
  "isAdmin": false
}
```

## Migration dữ liệu

Nếu bạn đang sử dụng **SQLite** (development):

1. Xóa file `dev.db` (hoặc database file của bạn)
2. Restart server - TypeORM sẽ tự động tạo lại schema mới

Nếu bạn đang sử dụng **PostgreSQL** (production):

### Option 1: Tự động (nếu synchronize: true)

- TypeORM sẽ tự động cập nhật schema khi restart

### Option 2: Manual Migration (khuyến nghị cho production)

```sql
-- Thêm các cột mới
ALTER TABLE "user" ADD COLUMN "username" VARCHAR;
ALTER TABLE "user" ADD COLUMN "isAdmin" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN "timezone" VARCHAR DEFAULT 'Asia/Ho_Chi_Minh';
ALTER TABLE "user" ADD COLUMN "lastPasswordChange" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN "avatar" VARCHAR DEFAULT '';

-- Migrate dữ liệu cũ (tạo username từ email)
UPDATE "user" SET "username" = SPLIT_PART("email", '@', 1);

-- Thêm unique constraint
ALTER TABLE "user" ADD CONSTRAINT "UQ_username" UNIQUE ("username");

-- Xóa các cột cũ (cẩn thận!)
ALTER TABLE "user" DROP COLUMN "name";
ALTER TABLE "user" DROP COLUMN "role";
```

## Testing

Sau khi migration, test các endpoint:

1. **Register**: POST `/auth/register`

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123!"
}
```

2. **Login**: POST `/auth/login`

```json
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

## Lưu ý quan trọng

⚠️ **Backup database trước khi migration!**

- Các user cũ sẽ cần được migrate username từ email
- JWT tokens cũ sẽ không còn valid sau khi thay đổi
- Cần update frontend để sử dụng `isAdmin` thay vì `role`
