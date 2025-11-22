# Back-end API - Gia Sư Reviews

RESTful API server cho hệ thống đánh giá trung tâm gia sư, được xây dựng với Node.js và Express.js.

## 📋 Mục Lục

- [Tính Năng](#tính-năng)
- [Công Nghệ](#công-nghệ)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Cấu Trúc Code](#cấu-trúc-code)

## ✨ Tính Năng

- 🔐 JWT Authentication cho admin
- 📝 CRUD operations cho Centers và Reviews
- 📸 Upload hình ảnh lên upanhnhanh.com
- 🚦 Rate limiting để tránh spam
- ✅ Admin verification system
- 🔒 Middleware bảo vệ routes

## 🛠️ Công Nghệ

- **Express.js 5** - Web framework
- **MongoDB + Mongoose** - Database và ODM
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **express-rate-limit** - Rate limiting
- **bcryptjs** - Password hashing
- **Axios** - HTTP client cho upload service

## 🚀 Cài Đặt

### Yêu Cầu

- Node.js >= 18.x
- MongoDB >= 5.x

### Cài Đặt Dependencies

```bash
npm install
```

## ⚙️ Cấu Hình

### 1. Tạo file `.env`

```bash
cp env.template .env
```

### 2. Điền thông tin vào `.env`

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000,http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/giasu-reviews

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Image Upload API (upanhnhanh.com)
APIURL=https://upanhnhanh.com/api/v1
APIKEY=your-api-key-here
```

### 3. Khởi động MongoDB

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

## ▶️ Chạy Ứng Dụng

### Development Mode

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### Production Mode

```bash
npm start
```

## 📡 API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Centers

#### Lấy danh sách trung tâm

```
GET /api/centers
```

**Query Parameters:**

- `search` (string) - Tìm kiếm theo tên
- `isVerified` (boolean) - Lọc theo trạng thái duyệt
- `sortBy` (string) - Sắp xếp theo field (default: createdAt)
- `sortOrder` (asc|desc) - Thứ tự sắp xếp (default: desc)
- `page` (number) - Số trang (default: 1)
- `limit` (number) - Số lượng mỗi trang (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

#### Lấy chi tiết trung tâm

```
GET /api/centers/:id
```

#### Tạo trung tâm mới

```
POST /api/centers
Content-Type: multipart/form-data
```

**Body (FormData):**

- `name` (string, required) - Tên trung tâm
- `address` (string) - Địa chỉ
- `phone` (string) - Số điện thoại
- `website` (string) - Website
- `image` (File) - Hình ảnh trung tâm

**Rate Limit:** 5 requests / 15 phút (bỏ qua cho admin)

#### Thêm đánh giá

```
POST /api/centers/:id/reviews
Content-Type: multipart/form-data
```

**Body (FormData):**

- `rating` (number, required) - Đánh giá 1-5 sao
- `comment` (string) - Bình luận
- `reviewerName` (string) - Tên người đánh giá
- `images` (File[]) - Hình ảnh (tối đa 5 ảnh, tổng < 10MB)

**Rate Limit:** 1 request / 1 giờ (bỏ qua cho admin)

#### Cập nhật trung tâm (Admin only)

```
PUT /api/centers/:id
```

#### Xóa trung tâm (Admin only)

```
DELETE /api/centers/:id
```

#### Duyệt/Hủy duyệt trung tâm (Admin only)

```
PUT /api/centers/:id/verify
```

**Body:**

```json
{
  "isVerified": true
}
```

#### Xóa đánh giá (Admin only)

```
DELETE /api/centers/:centerId/reviews/:reviewId
```

### Admin

#### Đăng ký admin

```
POST /api/admin/register
```

**Body:**

```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}
```

**Lưu ý:** Tài khoản mới đăng ký sẽ có `isActive = false`, cần được kích hoạt bởi admin khác.

#### Đăng nhập admin

```
POST /api/admin/login
```

**Body:**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**

- Set cookies: `accessToken`, `refreshToken`
- Trả về thông tin admin

#### Lấy thông tin admin hiện tại

```
GET /api/admin/me
```

**Headers:**

- Cookie: `accessToken` hoặc
- Authorization: `Bearer <token>`

#### Kiểm tra đăng nhập

```
GET /api/admin/check-auth
```

## 🔐 Authentication

### JWT Tokens

- **Access Token**: Hết hạn sau 15 phút
- **Refresh Token**: Hết hạn sau 7 ngày
- Tokens được lưu trong HTTP-only cookies

### Admin Middleware

Sử dụng `adminMiddleware` để bảo vệ routes:

```javascript
import { adminMiddleware } from "../middlewares/auth.js";

router.get("/protected", adminMiddleware, controller.handler);
```

### Admin Status

- Admin mới đăng ký: `isActive = false` (chưa thể đăng nhập)
- Admin đã kích hoạt: `isActive = true` (có thể đăng nhập)

## 🚦 Rate Limiting

### Người Dùng Thường

| Endpoint                        | Giới Hạn             |
| ------------------------------- | -------------------- |
| `POST /api/centers`             | 5 requests / 15 phút |
| `POST /api/centers/:id/reviews` | 1 request / 1 giờ    |

### Admin

Admin đã đăng nhập **không bị giới hạn** rate limit.

### Cấu Hình

Rate limit được cấu hình trong `src/middlewares/rateLimit.js`:

```javascript
export const createCenterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 requests
  skip: (req) => req.isAdmin === true, // Bỏ qua cho admin
});
```

## 📁 Cấu Trúc Code

```
src/
├── app.js                 # Entry point, Express app setup
├── config/
│   └── database.js        # MongoDB connection
├── controllers/           # Request handlers
│   ├── adminController.js
│   └── centersController.js
├── middlewares/           # Express middlewares
│   ├── auth.js            # JWT authentication
│   ├── rateLimit.js       # Rate limiting
│   └── upload.js          # File upload (Multer)
├── models/                # Mongoose schemas
│   ├── Admin.js
│   └── Centers.js
├── repositories/          # Database operations
│   ├── adminRepositories.js
│   └── centersRepositories.js
├── routes/                # API routes
│   ├── adminRouter.js
│   └── centersRouter.js
├── services/              # Business logic
│   ├── adminServices.js
│   ├── centersServices.js
│   └── uploadService.js   # Image upload to upanhnhanh.com
└── utils/
    └── constants.js       # Constants và helpers
```

## 🔧 Scripts

```bash
# Development mode với auto-reload
npm run dev

# Production mode
npm start

# Test (chưa có)
npm test
```

## 📝 Error Handling

API trả về format chuẩn:

```json
{
  "success": false,
  "message": "Error message"
}
```

HTTP Status Codes:

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Kiểm tra MongoDB đã chạy chưa
mongod

# Hoặc kiểm tra connection string trong .env
MONGODB_URI=mongodb://localhost:27017/giasu-reviews
```

### Port Already in Use

Thay đổi PORT trong file `.env`:

```env
PORT=5000
```

### CORS Error

Cập nhật `CLIENT_URL` trong `.env`:

```env
CLIENT_URL=http://localhost:3000,http://localhost:5173
```

## 📄 License

ISC
