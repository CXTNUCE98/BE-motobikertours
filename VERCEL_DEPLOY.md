# Hướng dẫn Deploy lên Vercel với Vercel Postgres

Hiện tại project đang gặp lỗi "Serverless Function has crashed" có thể do database chưa được kết nối đúng hoặc bảng chưa được tạo.

Hãy làm theo các bước sau để khắc phục:

## 1. Cấu hình Database trên Vercel

1.  Truy cập Dashboard của project trên Vercel.
2.  Vào tab **Storage**.
3.  Tạo mới database **Postgres** (nếu chưa có).
4.  Sau khi tạo xong, đảm bảo project đã được **Connect** với database này (nút Connect).
    - Việc này sẽ tự động thêm các biến môi trường như `POSTGRES_URL`, `POSTGRES_USER`,... vào project.

## 2. Cấu hình Biến Môi Trường (Environment Variables)

Vào tab **Settings** -> **Environment Variables** và thêm các biến sau:

| Key              | Value      | Giải thích                                                           |
| :--------------- | :--------- | :------------------------------------------------------------------- |
| `DB_TYPE`        | `postgres` | **BẮT BUỘC**. Để code biết dùng Postgres thay vì SQLite.             |
| `DB_SYNCHRONIZE` | `true`     | **QUAN TRỌNG**. Để TypeORM tự động tạo bảng trong lần chạy đầu tiên. |
| `DB_SSL`         | `true`     | Bắt buộc với Vercel Postgres.                                        |
| `JWT_SECRET`     | (tự chọn)  | Key bảo mật cho token.                                               |
| `CLOUDINARY_...` | (nếu dùng) | Cấu hình upload ảnh.                                                 |

**Lưu ý:**

- Nếu bạn không set `DB_SYNCHRONIZE=true`, code sẽ chạy nhưng không tìm thấy bảng dữ liệu -> Crash.
- Sau khi deploy thành công và app chạy ổn định, bạn nên đổi `DB_SYNCHRONIZE` thành `false` để an toàn dữ liệu.

## 3. Redeploy

1.  Vào tab **Deployments**.
2.  Chọn deployment gần nhất (hoặc commit mới nhất).
3.  Bấm **Redeploy** (để Vercel cập nhật biến môi trường mới).

## 4. Kiểm tra Logs (Nếu vẫn lỗi)

1.  Nếu vẫn bị lỗi "Function has crashed", vào tab **Logs** của deployment.
2.  Chọn filter **Functions**.
3.  Đọc log lỗi chi tiết (thường sẽ báo lỗi kết nối DB hoặc thiếu bảng).

---

## Tóm tắt thay đổi trong Code

1.  **Thay thế `bcrypt` bằng `bcryptjs`**:
    - `bcrypt` là thư viện native (C++), rất hay gây lỗi khi deploy lên Vercel (Serverless) do khác biệt hệ điều hành (Windows vs Linux).
    - Tôi đã chuyển sang dùng `bcryptjs` (thuần Javascript) để đảm bảo chạy ổn định trên mọi môi trường.

2.  **Cập nhật `src/app.module.ts`**:
    - Cho phép biến `DB_SYNCHRONIZE` hoạt động ngay cả trong môi trường Production (trước đây nó bị chặn).

3.  **Cập nhật `.env.example`**:
    - Thêm hướng dẫn chi tiết về các biến môi trường cần thiết cho Vercel Postgres.
