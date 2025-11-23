# 🗄️ Giải Pháp Database Thay Thế PostgreSQL

## 📋 Tình Trạng Hiện Tại

Project hiện đang sử dụng **SQLite** (file `dev.db`) - **KHÔNG phải PostgreSQL**.

## ✅ Giải Pháp Đề Xuất

### **Option 1: Tiếp Tục Dùng SQLite (Khuyến Nghị)** ⭐

**Ưu điểm:**
- ✅ Đã hoạt động sẵn, không cần cài đặt
- ✅ File database đơn giản (`dev.db`)
- ✅ Phù hợp cho development

**Cách dùng:**
1. Tạo file `.env`:
```env
DB_TYPE=sqlite
DB_DATABASE=dev.db
```

2. Chạy project:
```bash
npm run start:dev
```

---

### **Option 2: Chuyển Sang MySQL/MariaDB** 

**Ưu điểm:**
- ✅ Dễ cài đặt trên Windows (dùng XAMPP)
- ✅ Hiệu năng tốt cho production

**Cách cài đặt:**

1. **Cài XAMPP** (https://www.apachefriends.org/)
   - Khởi động MySQL từ XAMPP Control Panel
   - Mở phpMyAdmin → Tạo database `motobiketours`

2. **Cài driver MySQL:**
```bash
npm install mysql2
```

3. **Cấu hình `.env`:**
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=motobiketours
```

---

### **Option 3: Sửa Lỗi Kết Nối PostgreSQL**

Nếu bạn muốn dùng PostgreSQL, kiểm tra:

1. **PostgreSQL đã chạy chưa?**
   - Windows Services → tìm PostgreSQL → Start

2. **Thông tin kết nối trong `.env`:**
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=motobiketours
```

3. **Test kết nối:**
```bash
psql -U postgres -h localhost
```

---

## 🔧 Đã Cập Nhật

✅ **Entities:** Sửa `Service` và `BlogPost` để tương thích SQLite  
✅ **App Module:** Cấu hình linh hoạt, hỗ trợ SQLite/PostgreSQL/MySQL  
✅ **Documentation:** File `DATABASE_SETUP.md` với hướng dẫn chi tiết

---

## 📝 So Sánh Nhanh

| Database | Cài đặt | Phù hợp | Ghi chú |
|----------|---------|---------|---------|
| **SQLite** | ⭐ Không cần | Development | ✅ Đang dùng |
| **MySQL** | ⭐⭐ Dễ (XAMPP) | Production | Cần `npm install mysql2` |
| **PostgreSQL** | ⭐⭐⭐ Khó | Production | Đã có package `pg` |

---

## 🚀 Bắt Đầu Ngay

**Nếu muốn tiếp tục dùng SQLite (khuyến nghị):**
```bash
# Tạo file .env
echo "DB_TYPE=sqlite" > .env
echo "DB_DATABASE=dev.db" >> .env

# Chạy project
npm run start:dev
```

**Xem hướng dẫn chi tiết:** `DATABASE_SETUP.md`

