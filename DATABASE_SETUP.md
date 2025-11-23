# Hướng Dẫn Cấu Hình Database

Project này hỗ trợ 3 loại database: **SQLite**, **PostgreSQL**, và **MySQL/MariaDB**.

## 🎯 Phương Án Đề Xuất

### 1. SQLite (Khuyến nghị cho Development) ✅

**Ưu điểm:**
- ✅ Không cần cài đặt gì, hoạt động ngay
- ✅ File database đơn giản (`dev.db`)
- ✅ Phù hợp cho development và testing
- ✅ Đã được cấu hình sẵn trong project

**Cách sử dụng:**
1. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

2. Đảm bảo trong `.env` có:
```env
DB_TYPE=sqlite
DB_DATABASE=dev.db
```

3. Chạy project:
```bash
npm run start:dev
```

**Lưu ý:** SQLite không hỗ trợ array type, project đã được cấu hình để dùng `simple-array` (lưu dưới dạng chuỗi phân cách bằng dấu phẩy).

---

### 2. MySQL/MariaDB (Khuyến nghị cho Production trên Windows)

**Ưu điểm:**
- ✅ Dễ cài đặt trên Windows hơn PostgreSQL
- ✅ Hiệu năng tốt
- ✅ Hỗ trợ đầy đủ tính năng của TypeORM

**Cách cài đặt:**

#### Option A: Sử dụng XAMPP (Dễ nhất)
1. Tải và cài đặt [XAMPP](https://www.apachefriends.org/)
2. Khởi động MySQL từ XAMPP Control Panel
3. Tạo database:
   - Mở phpMyAdmin (http://localhost/phpmyadmin)
   - Tạo database mới tên `motobiketours`

#### Option B: Cài đặt MySQL riêng
1. Tải [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
2. Cài đặt và ghi nhớ password root
3. Tạo database:
```sql
CREATE DATABASE motobiketours;
```

**Cấu hình trong `.env`:**
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=motobiketours
```

**Cài đặt driver:**
```bash
npm install mysql2
```

---

### 3. PostgreSQL

**Ưu điểm:**
- ✅ Database mạnh mẽ, phù hợp production
- ✅ Hỗ trợ đầy đủ tính năng

**Nhược điểm:**
- ⚠️ Cài đặt phức tạp hơn trên Windows
- ⚠️ Cần cấu hình kỹ hơn

**Cách cài đặt:**

#### Option A: Sử dụng Docker (Khuyến nghị)
1. Cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Chạy PostgreSQL container:
```bash
docker run --name postgres-motobiketours -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=motobiketours -p 5432:5432 -d postgres
```

#### Option B: Cài đặt trực tiếp
1. Tải [PostgreSQL](https://www.postgresql.org/download/windows/)
2. Cài đặt và ghi nhớ password
3. Tạo database:
```sql
CREATE DATABASE motobiketours;
```

**Cấu hình trong `.env`:**
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=motobiketours
```

**Lưu ý:** Package `pg` đã được cài đặt sẵn trong `package.json`.

---

## 🔄 Chuyển Đổi Database

### Từ SQLite sang MySQL/PostgreSQL

1. **Export dữ liệu từ SQLite** (nếu có):
   - Sử dụng công cụ như [DB Browser for SQLite](https://sqlitebrowser.org/)
   - Export sang SQL script

2. **Cập nhật `.env`** với cấu hình database mới

3. **Chạy lại project:**
   ```bash
   npm run start:dev
   ```
   TypeORM sẽ tự động tạo tables mới (vì `synchronize: true` trong development)

4. **Import dữ liệu** (nếu cần) vào database mới

---

## ⚠️ Lưu Ý Quan Trọng

1. **Production:** Đặt `NODE_ENV=production` và `synchronize: false` để tránh mất dữ liệu
2. **Backup:** Luôn backup database trước khi thay đổi
3. **UUID:** Project sử dụng UUID cho primary keys, đảm bảo database hỗ trợ
4. **Array Fields:** SQLite không hỗ trợ array, project đã dùng `simple-array` để tương thích

---

## 🐛 Xử Lý Lỗi Kết Nối

### Lỗi kết nối PostgreSQL/MySQL

1. **Kiểm tra service đã chạy chưa:**
   - Windows: Services → tìm MySQL/PostgreSQL → Start
   - XAMPP: Mở Control Panel → Start MySQL

2. **Kiểm tra thông tin đăng nhập:**
   - Username, password, database name trong `.env`

3. **Kiểm tra port:**
   - MySQL: 3306
   - PostgreSQL: 5432
   - Đảm bảo không bị firewall chặn

4. **Test kết nối:**
   ```bash
   # MySQL
   mysql -u root -p -h localhost
   
   # PostgreSQL
   psql -U postgres -h localhost
   ```

---

## 📝 Tóm Tắt

| Database | Độ khó cài đặt | Phù hợp cho | Cần cài thêm |
|----------|----------------|-------------|--------------|
| **SQLite** | ⭐ Rất dễ | Development, Testing | Không |
| **MySQL** | ⭐⭐ Dễ | Production, Development | `mysql2` |
| **PostgreSQL** | ⭐⭐⭐ Trung bình | Production | Đã có `pg` |

**Khuyến nghị:** Dùng **SQLite** cho development, **MySQL** cho production trên Windows.

