# Hướng dẫn Debug lỗi Deploy Vercel (500 Internal Server Error)

Bạn đang gặp lỗi `FUNCTION_INVOCATION_FAILED` khi deploy lên Vercel. Lỗi này thường do ứng dụng bị crash ngay khi khởi động.

Tôi đã thêm các log chi tiết vào code để giúp bạn tìm nguyên nhân. Hãy làm theo các bước sau:

## 1. Kiểm tra Biến Môi Trường `POSTGRES_URL`

Đây là nguyên nhân phổ biến nhất. Dù bạn đã set `DB_TYPE=postgres`, nhưng nếu thiếu `POSTGRES_URL`, ứng dụng sẽ không thể kết nối DB.

1.  Vào Dashboard Vercel -> Project của bạn.
2.  Vào tab **Settings** -> **Environment Variables**.
3.  Tìm xem có biến `POSTGRES_URL` không?
    -   **Nếu KHÔNG có**: Bạn chưa connect database.
        -   Vào tab **Storage**.
        -   Chọn Database Postgres của bạn.
        -   Bấm nút **Connect Project**.
        -   Sau khi connect, Vercel sẽ tự động thêm các biến `POSTGRES_URL`, `POSTGRES_USER`, v.v.
    -   **Nếu CÓ**: Hãy chuyển sang bước 2.

## 2. Redeploy để áp dụng Log mới

Tôi đã cập nhật code để log chi tiết quá trình khởi tạo Database. Bạn cần deploy lại để thấy log này.

1.  Vào tab **Deployments**.
2.  Chọn deployment mới nhất (hoặc commit code mới lên).
3.  Đợi build xong.

## 3. Xem Logs chi tiết

1.  Vào tab **Logs** của deployment vừa chạy.
2.  Trên thanh tìm kiếm/filter, chọn **Functions** (để lọc bớt log build).
3.  Tìm các dòng log bắt đầu bằng `[DatabaseConfig]`.
    -   Bạn sẽ thấy nó in ra: `[DatabaseConfig] DB_TYPE: postgres`.
    -   Quan trọng nhất: `[DatabaseConfig] Using PostgreSQL with URL` hay `Using PostgreSQL with individual credentials`.
4.  Nếu bạn thấy `[DatabaseConfig] Using PostgreSQL with individual credentials` và sau đó là lỗi kết nối, nghĩa là `POSTGRES_URL` không được tìm thấy, và code đang cố kết nối vào `localhost` (mặc định), dẫn đến lỗi.

## 4. Kiểm tra lỗi `sqlite3`

Tôi đã chuyển `sqlite3` sang `devDependencies` để tránh việc Vercel cố gắng build nó (gây lỗi native binding).
Nếu log báo lỗi liên quan đến `sqlite3` hoặc `module not found`, hãy đảm bảo bạn không dùng `DB_TYPE=sqlite` trên Vercel.

## 5. Tăng thời gian Timeout (Nếu cần)

Nếu log cho thấy ứng dụng khởi động nhưng bị ngắt giữa chừng (Timeout), bạn có thể cần tăng timeout trong `vercel.json` (tuy nhiên mặc định 10s thường là đủ cho NestJS nhỏ).

---

**Tóm lại:**
Khả năng cao nhất là bạn **chưa Connect Database** trong tab Storage của Vercel, nên thiếu biến `POSTGRES_URL`. Hãy kiểm tra kỹ bước 1.
