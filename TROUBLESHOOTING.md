# 🔧 Hướng Dẫn Khắc Phục Lỗi API Login

## ✅ Đã Sửa Các Vấn Đề

### 1. **JWT Module Configuration**
- **Vấn đề:** Sử dụng `process.env` trực tiếp thay vì `ConfigService`
- **Đã sửa:** Cập nhật `auth.module.ts` để sử dụng `JwtModule.registerAsync()` với `ConfigService`
- **Lợi ích:** Đảm bảo biến môi trường được load đúng cách

### 2. **Error Handling**
- **Vấn đề:** Thiếu xử lý lỗi rõ ràng trong controller
- **Đã sửa:** 
  - Thêm `UnauthorizedException` cho lỗi đăng nhập
  - Thêm try-catch trong `validateUser`
  - Cải thiện validation pipe

### 3. **Validation Pipe**
- **Vấn đề:** Validation pipe cơ bản
- **Đã sửa:** Thêm các options:
  - `whitelist: true` - Loại bỏ properties không được định nghĩa
  - `forbidNonWhitelisted: true` - Từ chối request có properties không hợp lệ
  - `transform: true` - Tự động transform types

## 🧪 Cách Test API

### 1. Kiểm tra Server Đang Chạy
```bash
curl http://localhost:3001
```

### 2. Đăng Ký User Mới (Nếu chưa có)
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "taok37c1@gmail.com",
    "password": "Tao27031998",
    "name": "Test User"
  }'
```

### 3. Đăng Nhập
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "taok37c1@gmail.com",
    "password": "Tao27031998"
  }'
```

### 4. Kiểm Tra Swagger Documentation
Mở trình duyệt: `http://localhost:3001/api`

## 🐛 Các Lỗi Thường Gặp

### Lỗi 500 Internal Server Error

**Nguyên nhân có thể:**
1. **JWT_SECRET chưa được cấu hình**
   - Kiểm tra file `.env` có `JWT_SECRET`
   - Đảm bảo giá trị không rỗng

2. **Database chưa được tạo**
   - Kiểm tra file `dev.db` có tồn tại
   - Server sẽ tự động tạo tables khi khởi động (nếu `synchronize: true`)

3. **User chưa tồn tại trong database**
   - Đăng ký user mới trước khi đăng nhập
   - Hoặc kiểm tra user đã được tạo chưa

4. **Password không khớp**
   - Đảm bảo password đúng với password đã hash khi đăng ký
   - Password được hash bằng bcrypt

### Lỗi 401 Unauthorized

**Nguyên nhân:**
- Email hoặc password không đúng
- User không tồn tại trong database

**Cách khắc phục:**
1. Đăng ký user mới
2. Kiểm tra email và password chính xác

### Lỗi 400 Bad Request

**Nguyên nhân:**
- Dữ liệu đầu vào không hợp lệ
- Thiếu trường bắt buộc
- Email không đúng format
- Password quá ngắn (< 6 ký tự)

**Cách khắc phục:**
- Kiểm tra format JSON
- Đảm bảo email đúng format
- Password tối thiểu 6 ký tự

## 📋 Checklist Khắc Phục

- [ ] Server đang chạy trên port 3001
- [ ] File `.env` có đầy đủ biến môi trường:
  - [ ] `DB_TYPE=sqlite`
  - [ ] `DB_DATABASE=dev.db`
  - [ ] `JWT_SECRET` (có giá trị)
  - [ ] `JWT_EXPIRATION=1d`
- [ ] File `dev.db` tồn tại
- [ ] User đã được đăng ký trong database
- [ ] Email và password đúng khi đăng nhập

## 🔍 Debug Steps

1. **Kiểm tra logs server:**
   ```bash
   npm run start:dev
   ```
   Xem console output để tìm lỗi cụ thể

2. **Kiểm tra database:**
   - Sử dụng DB Browser for SQLite
   - Hoặc SQLite CLI: `sqlite3 dev.db`
   - Kiểm tra bảng `user` có dữ liệu không

3. **Test với Swagger:**
   - Mở `http://localhost:3001/api`
   - Test trực tiếp từ Swagger UI

4. **Kiểm tra Network:**
   - Mở DevTools → Network tab
   - Xem response chi tiết từ server

## 📝 Ghi Chú

- Password được hash bằng bcrypt với salt rounds = 10
- JWT token có thời hạn theo `JWT_EXPIRATION` (mặc định 1 ngày)
- Database SQLite tự động tạo file `dev.db` nếu chưa tồn tại
- Tables tự động được tạo khi `synchronize: true` (chỉ trong development)

