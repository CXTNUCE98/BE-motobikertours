# Hướng Dẫn Tích Hợp Tours API (Frontend Integration Guide)

Tài liệu này hướng dẫn Frontend (FE) cách tích hợp API Tours, đặc biệt là các chức năng **Filter (Bộ lọc)**, **Search (Tìm kiếm)** và **Pagination (Phân trang)** dựa trên UI thiết kế.

## 1. Base URL

- Local: `http://localhost:3000`
- Production: `(Domain của bạn)`

## 2. API Endpoints

### 2.1. Lấy danh sách Tours (Filter & Search)

API này hỗ trợ đầy đủ các bộ lọc theo UI: Khoảng giá, Thời gian tour, Loại tour, và Tìm kiếm tên.

- **Method**: `GET`
- **Endpoint**: `/tours`

#### Query Parameters (Tham số URL)

| Tham số          | Kiểu dữ liệu    | Mô tả                                                            | Ví dụ               |
| :--------------- | :-------------- | :--------------------------------------------------------------- | :------------------ |
| `q`              | `string`        | Tìm kiếm theo tên tour hoặc mô tả.                               | `Hoi An`            |
| `price_min`      | `number`        | Giá thấp nhất (từ thanh trượt giá).                              | `0`                 |
| `price_max`      | `number`        | Giá cao nhất (từ thanh trượt giá).                               | `2000`              |
| `duration_range` | `string`        | Khoảng thời gian (enum). Các giá trị hợp lệ: `1-3`, `4-7`, `8+`. | `1-3`               |
| `type`           | `array[string]` | Loại tour. Có thể truyền nhiều loại cách nhau bởi dấu phẩy.      | `Adventure,Culture` |
| `p`              | `number`        | Trang hiện tại (mặc định: 1).                                    | `1`                 |
| `r`              | `number`        | Số lượng tour mỗi trang (mặc định: 10).                          | `9`                 |

#### Ví dụ Request URL

1. **Lấy tất cả (Mặc định)**

   ```
   GET /tours
   ```

2. **Filter theo UI (Ví dụ phức tạp)**
   - Tìm kiếm: "Da Nang"
   - Giá: $100 - $500
   - Thời gian: 1-3 ngày
   - Loại tour: Adventure và Culture
   - Trang 1, 9 tour/trang (lưới 3x3)

   ```
   GET /tours?q=Da%20Nang&price_min=100&price_max=500&duration_range=1-3&type=Adventure,Culture&p=1&r=9
   ```

#### Cấu trúc Response

```json
{
  "data": [
    {
      "id": "uuid-string",
      "title": "TOUR DN3: HERITAGE ROAD DA NANG - HUE - HOI AN",
      "slug": "tour-dn3-heritage-road",
      "thumbnail": "https://res.cloudinary.com/.../image.jpg",
      "images": ["url1", "url2"],
      "description": "Short description...",
      "price_usd": 320,
      "duration": "3 days and 2 nights",
      "duration_days": 3,
      "depart_from": "Da Nang",
      "routes": "Da Nang - Hai Van Pass - Hue - Hoi An",
      "type": "Heritage",
      "is_featured": false,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
    // ... more items
  ],
  "total": 20, // Tổng số tour tìm thấy
  "page": 1, // Trang hiện tại
  "perPage": 9, // Số item mỗi trang
  "totalPages": 3 // Tổng số trang
}
```

---

### 2.2. Chi tiết Tour

- **Method**: `GET`
- **Endpoint**: `/tours/:id`
- **Mô tả**: Lấy thông tin chi tiết của một tour cụ thể.

---

### 2.3. Các API Admin (CRUD)

Dành cho trang quản trị (CMS).

- **Tạo mới**: `POST /tours` (Body: `CreateTourDto` - multipart/form-data nếu upload ảnh)
- **Cập nhật**: `PATCH /tours/:id` (Body: `UpdateTourDto` - multipart/form-data)
- **Xóa**: `DELETE /tours/:id`

## 3. Hướng dẫn ghép Code Frontend (Ví dụ với Axios)

Dưới đây là ví dụ hàm gọi API để xử lý bộ lọc:

```javascript
import axios from 'axios';

// Hàm lấy danh sách tours với bộ lọc
export const fetchTours = async (filters) => {
  try {
    // filters là object chứa các giá trị từ UI
    // {
    //   search: 'Hoi An',
    //   priceRange: [0, 2000],
    //   duration: '1-3', // hoặc null
    //   selectedTypes: ['Adventure', 'Culture'],
    //   page: 1
    // }

    const params = {
      p: filters.page || 1,
      r: 9, // Số lượng hiển thị trên UI
    };

    // Chỉ thêm params nếu có giá trị
    if (filters.search) params.q = filters.search;

    if (filters.priceRange) {
      params.price_min = filters.priceRange[0];
      params.price_max = filters.priceRange[1];
    }

    if (filters.duration) {
      params.duration_range = filters.duration; // '1-3', '4-7', '8+'
    }

    if (filters.selectedTypes && filters.selectedTypes.length > 0) {
      params.type = filters.selectedTypes.join(',');
    }

    const response = await axios.get('/tours', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching tours:', error);
    throw error;
  }
};
```

## 4. Lưu ý quan trọng cho FE

1. **Duration Range**: Giá trị gửi lên server phải chính xác là `1-3`, `4-7`, hoặc `8+`.
2. **Type**: Nếu chọn nhiều loại, hãy nối chúng bằng dấu phẩy (ví dụ: `type=Bien,Nui`).
3. **Hình ảnh**: API trả về `thumbnail` (ảnh đại diện) và `images` (mảng ảnh chi tiết). Hãy dùng `thumbnail` cho card ở trang danh sách.
