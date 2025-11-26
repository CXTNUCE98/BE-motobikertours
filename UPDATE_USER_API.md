# Update User API Documentation

## Endpoint

`PATCH /users/:id`

## Description

Cập nhật thông tin của một user. Tất cả các trường đều là **optional**, bạn chỉ cần gửi những trường muốn cập nhật.

## Request Parameters

### Path Parameters

- `id` (string, required) - UUID của user cần cập nhật

### Request Body

Tất cả các trường đều là optional:

| Field      | Type    | Required | Description                | Example                            |
| ---------- | ------- | -------- | -------------------------- | ---------------------------------- |
| `username` | string  | No       | Tên đăng nhập mới          | `"john_doe"`                       |
| `email`    | string  | No       | Email mới                  | `"john.doe@example.com"`           |
| `password` | string  | No       | Mật khẩu mới (min 6 ký tự) | `"NewP@ssw0rd123"`                 |
| `isAdmin`  | boolean | No       | Trạng thái admin           | `true`                             |
| `timezone` | string  | No       | Múi giờ                    | `"America/New_York"`               |
| `avatar`   | string  | No       | URL avatar                 | `"https://res.cloudinary.com/..."` |

## Example Requests

### 1. Cập nhật username và email

```json
{
  "username": "john_doe",
  "email": "john.doe@example.com"
}
```

### 2. Chỉ cập nhật password

```json
{
  "password": "NewP@ssw0rd123"
}
```

### 3. Cập nhật quyền admin

```json
{
  "isAdmin": true
}
```

### 4. Cập nhật profile (timezone và avatar)

```json
{
  "username": "john_doe",
  "timezone": "America/New_York",
  "avatar": "https://res.cloudinary.com/demo/image/upload/avatar.jpg"
}
```

### 5. Cập nhật đầy đủ (tất cả các trường)

```json
{
  "username": "john_doe",
  "email": "john.doe@example.com",
  "password": "NewP@ssw0rd123",
  "isAdmin": true,
  "timezone": "America/New_York",
  "avatar": "https://res.cloudinary.com/demo/image/upload/avatar.jpg"
}
```

## Response

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john.doe@example.com",
  "isAdmin": true,
  "timezone": "America/New_York",
  "avatar": "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
  "lastPasswordChange": "2025-11-26T13:56:00.000Z",
  "provider": null,
  "created_at": "2025-11-20T10:00:00.000Z"
}
```

**Note:** Trường `password` sẽ **không** được trả về trong response vì lý do bảo mật.

### Error Responses

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Validation Rules

- **username**: Phải là string
- **email**: Phải là email hợp lệ
- **password**: Tối thiểu 6 ký tự
- **isAdmin**: Phải là boolean (true/false)
- **timezone**: Phải là string (ví dụ: "Asia/Ho_Chi_Minh", "America/New_York")
- **avatar**: Phải là string (thường là URL)

## cURL Examples

### Cập nhật email

```bash
curl -X PATCH http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

### Cập nhật password

```bash
curl -X PATCH http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePassword123!"
  }'
```

### Cập nhật avatar

```bash
curl -X PATCH http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "avatar": "https://res.cloudinary.com/demo/image/upload/v1234567890/avatar.jpg"
  }'
```

## Notes

1. **Partial Update**: Bạn có thể cập nhật một hoặc nhiều trường cùng lúc
2. **Password Hashing**: Nếu cập nhật password, nó sẽ tự động được hash trước khi lưu vào database
3. **Unique Constraints**: `username` và `email` phải là duy nhất trong hệ thống
4. **Authentication**: Trong production, endpoint này nên được bảo vệ bằng JWT authentication
5. **Authorization**: Chỉ admin hoặc chính user đó mới có thể cập nhật thông tin

## Swagger UI

Bạn có thể test API này trực tiếp tại Swagger UI:

- URL: `http://localhost:3000/api`
- Tìm section **users**
- Chọn endpoint `PATCH /users/{id}`
- Click "Try it out"
- Chọn một trong các example values hoặc tự tạo request body
