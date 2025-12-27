# 🎓 Gia Sư Reviews - Hệ Thống Đánh Giá Trung Tâm Gia Sư

> Nền tảng web toàn diện để tìm kiếm, đánh giá và quản lý trung tâm gia sư tại Việt Nam

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

---

## 📋 Mục Lục

- [Giới Thiệu](#giới-thiệu)
- [Tính Năng](#tính-năng)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt Nhanh](#cài-đặt-nhanh)
- [Cấu Hình Chi Tiết](#cấu-hình-chi-tiết)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [API Documentation](#api-documentation)
- [Hệ Thống Authentication](#hệ-thống-authentication)
- [Hệ Thống Đánh Giá & Reviews](#hệ-thống-đánh-giá--reviews)
- [Upload Hình Ảnh](#upload-hình-ảnh)
- [Rate Limiting](#rate-limiting)
- [Deploy Lên Vercel](#deploy-lên-vercel)
- [Troubleshooting](#troubleshooting)
- [Đóng Góp](#đóng-góp)
- [Liên Hệ](#liên-hệ)

---

## 🌟 Giới Thiệu

**Gia Sư Reviews** là một hệ thống web hiện đại được xây dựng với công nghệ stack MERN (MongoDB, Express, React/Next.js, Node.js). Ứng dụng cho phép:

- **Học sinh/Phụ huynh**: Tìm kiếm, xem chi tiết, đánh giá các trung tâm gia sư
- **Quản Trị Viên**: Quản lý danh sách trung tâm, duyệt nội dung người dùng
- **Cộng Đồng**: Chia sẻ kinh nghiệm qua hệ thống đánh giá và bình luận

---

## ✨ Tính Năng Chi Tiết

### 👥 Cho Người Dùng Thường

| Tính Năng                  | Mô Tả                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| 🔍 **Tìm Kiếm Trung Tâm**  | Tìm kiếm theo tên, địa chỉ hoặc từ khóa                              |
| 📱 **Danh Sách Trung Tâm** | Xem danh sách các trung tâm đã được xác thực                         |
| 📄 **Chi Tiết Trung Tâm**  | Xem thông tin đầy đủ: địa chỉ, số điện thoại, website, giờ hoạt động |
| ⭐ **Hệ Thống Đánh Giá**   | Đánh giá trung tâm từ 1-5 sao (chỉ người có account)                 |
| 💬 **Viết Bình Luận**      | Chia sẻ kinh nghiệm về trung tâm với hình ảnh đi kèm (tối đa 5 ảnh)  |
| 📸 **Upload Hình Ảnh**     | Tải lên hình ảnh trung tâm để giúp người khác hiểu rõ hơn            |
| 📊 **Xem Thống Kê**        | Xem trung bình điểm và số lượng đánh giá của trung tâm               |

### 🔐 Cho Quản Trị Viên (Admin)

| Tính Năng                  | Mô Tả                                                |
| -------------------------- | ---------------------------------------------------- |
| 🔑 **Đăng Nhập/Đăng Ký**   | Tài khoản admin được kích hoạt bởi super admin       |
| ✅ **Duyệt Nội Dung**      | Xét duyệt trung tâm mới trước khi hiển thị công khai |
| 📝 **Quản Lý Trung Tâm**   | Thêm, sửa, xóa thông tin trung tâm                   |
| 💬 **Quản Lý Đánh Giá**    | Xem tất cả đánh giá từ tất cả trung tâm, xóa nếu cần |
| 🛡️ **Bảo Vệ Nội Dung**     | Xóa bình luận không phù hợp                          |
| 🚀 **Không Bị Rate Limit** | Admin không bị hạn chế số lượng request              |

---

## 🛠️ Công Nghệ Sử Dụng

### 📌 Stack Công Nghệ Tổng Quan

```
┌─────────────────────────────────────────┐
│         MERN STACK ARCHITECTURE         │
├─────────────────────────────────────────┤
│  Frontend: Next.js 14 + TypeScript      │
│  Backend: Node.js + Express 5           │
│  Database: MongoDB + Mongoose           │
│  Hosting: Vercel (Frontend)             │
└─────────────────────────────────────────┘
```

### 🎨 Frontend

| Công Nghệ           | Phiên Bản | Mục Đích                       |
| ------------------- | --------- | ------------------------------ |
| **Next.js**         | 14.x      | React framework với App Router |
| **TypeScript**      | 5.x       | Type safety và code quality    |
| **Tailwind CSS**    | 3.x       | Styling utility-first          |
| **shadcn/ui**       | Latest    | High-quality UI components     |
| **React Hook Form** | 7.x       | Form state management          |
| **Axios**           | 1.13.x    | HTTP client                    |
| **Lucide React**    | Latest    | Beautiful icons                |
| **Radix UI**        | Latest    | Headless UI primitives         |

### 🖥️ Backend

| Công Nghệ              | Phiên Bản | Mục Đích                      |
| ---------------------- | --------- | ----------------------------- |
| **Express.js**         | 5.1.x     | Web framework                 |
| **Node.js**            | 18.x+     | JavaScript runtime            |
| **MongoDB**            | 5.x+      | NoSQL database                |
| **Mongoose**           | 8.x       | ODM (Object Data Modeling)    |
| **JWT (jsonwebtoken)** | 9.x       | Authentication tokens         |
| **bcryptjs**           | 2.4.x     | Password hashing              |
| **Multer**             | 2.x       | File upload handling          |
| **express-rate-limit** | 8.x       | Rate limiting middleware      |
| **CORS**               | 2.8.x     | Cross-origin resource sharing |
| **Axios**              | 1.13.x    | HTTP requests (image upload)  |
| **dotenv**             | 17.x      | Environment variables         |

---

## 📂 Cấu Trúc Dự Án

```
giasu-reviews/
├── 📁 back-end/                  # API Backend
│   ├── src/
│   │   ├── 📁 config/            # Cấu hình ứng dụng
│   │   │   └── database.js       # MongoDB connection
│   │   ├── 📁 controllers/       # Request handlers
│   │   │   ├── adminController.js
│   │   │   └── centersController.js
│   │   ├── 📁 middlewares/       # Custom middlewares
│   │   │   ├── auth.js           # JWT authentication
│   │   │   ├── rateLimit.js      # Rate limiting
│   │   │   └── upload.js         # File upload
│   │   ├── 📁 models/            # Mongoose schemas
│   │   │   ├── Admin.js          # Admin user model
│   │   │   └── Centers.js        # Center & Review model
│   │   ├── 📁 repositories/      # Database queries
│   │   ├── 📁 routes/            # API routes
│   │   │   ├── adminRouter.js
│   │   │   └── centersRouter.js
│   │   ├── 📁 services/          # Business logic
│   │   │   ├── adminServices.js
│   │   │   ├── centersServices.js
│   │   │   └── uploadService.js
│   │   ├── 📁 utils/             # Utilities
│   │   └── app.js                # Express app setup
│   ├── check-db.js               # Database checker script
│   ├── package.json
│   ├── env.template              # Environment template
│   └── README.md
│
├── 📁 front-end/                 # Next.js Frontend
│   ├── app/                      # App Router pages
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── 📁 admin/             # Admin dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── 📁 centers/       # Manage centers
│   │   │   └── 📁 reviews/       # Manage reviews
│   │   ├── 📁 login/             # Login page
│   │   ├── 📁 add-center/        # Add center page
│   │   └── 📁 review/            # Review page
│   ├── components/               # Reusable components
│   │   ├── navbar.tsx
│   │   ├── AdminGuard.tsx        # Admin protection
│   │   └── 📁 ui/                # UI components (shadcn/ui)
│   ├── 📁 hooks/                 # Custom React hooks
│   │   └── use-toast.ts
│   ├── 📁 lib/                   # Utility functions
│   │   ├── api.ts                # API client setup
│   │   └── utils.ts
│   ├── 📁 styles/                # Global styles
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── package.json
│   └── README.md
│
└── README.md                      # Project documentation
```

---

## 🔧 Yêu Cầu Hệ Thống

### Bắt Buộc

- **Node.js**: >= 18.x LTS
- **npm**: >= 9.x
- **MongoDB**: >= 5.x (cục bộ hoặc MongoDB Atlas)
- **Git**: Để clone repository

### Tùy Chọn

- **Postman**: Để test API
- **Visual Studio Code**: Editor được khuyến nghị
- **Vercel Account**: Để deploy frontend

### Kiểm Tra Cài Đặt

```bash
# Kiểm tra Node.js version
node --version

# Kiểm tra npm version
npm --version

# Kiểm tra MongoDB (nếu cài đặt cục bộ)
mongod --version
```

---

## 🚀 Cài Đặt Nhanh

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/giasu-reviews.git
cd giasu-reviews
```

### 2️⃣ Cài Đặt Backend

```bash
cd back-end
cp env.template .env

# Cài đặt dependencies
npm install
```

**Cấu hình `.env` backend:**

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/giasu-reviews

JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

APIKEY=your-upanhnhanh-api-key
APIURL=https://upanhnhanh.com/api/v1
```

### 3️⃣ Cài Đặt Frontend

```bash
cd ../front-end
cp env.example .env.local

# Cài đặt dependencies
npm install
```

**Cấu hình `.env.local` frontend:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4️⃣ Khởi Động MongoDB

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### 5️⃣ Chạy Ứng Dụng

**Terminal 1 - Backend:**

```bash
cd back-end
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd front-end
npm run dev
```

Truy cập: [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Cấu Hình Chi Tiết

### Backend Configuration

#### `.env` File

```env
# 🖥️ Server Settings
NODE_ENV=development|production|test
PORT=5000

# 🌐 CORS & Client URLs
CLIENT_URL=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# 🗄️ Database Connection
MONGODB_URI=mongodb://localhost:27017/giasu-reviews
# OR
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/giasu-reviews

# 🔐 JWT Authentication
JWT_SECRET=change-this-to-a-very-long-random-string-in-production
JWT_REFRESH_SECRET=another-long-random-string-for-refresh-tokens
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 📸 Image Upload API (upanhnhanh.com)
APIKEY=your-api-key-from-upanhnhanh
APIURL=https://upanhnhanh.com/api/v1
```

#### MongoDB Setup

**Cục bộ:**

```bash
# Windows - Khởi động MongoDB
mongod

# Kết nối local
MONGODB_URI=mongodb://localhost:27017/giasu-reviews
```

**MongoDB Atlas (Cloud):**

```bash
# Tạo cluster trên https://www.mongodb.com/cloud/atlas
# Copy connection string
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/giasu-reviews?retryWrites=true&w=majority
```

### Frontend Configuration

#### `.env.local` File

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Development
# NEXT_PUBLIC_API_URL=http://127.0.0.1:5000

# Production
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 🏃 Chạy Ứng Dụng

### Development Mode

**Backend (Node.js + Express):**

```bash
cd back-end
npm run dev
# Server chạy tại: http://localhost:5000
```

**Frontend (Next.js):**

```bash
cd front-end
npm run dev
# App chạy tại: http://localhost:3000
```

### Production Mode

**Backend:**

```bash
cd back-end
npm start
```

**Frontend:**

```bash
cd front-end
npm run build
npm start
```

### Test Database Connection

```bash
cd back-end
node check-db.js
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Đăng Ký Admin

```http
POST /admin/register
Content-Type: application/json

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Admin đã đăng ký thành công",
  "data": {
    "id": "user_id",
    "email": "admin@example.com",
    "name": "Admin Name"
  }
}
```

#### Đăng Nhập Admin

```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "admin": { "id": "...", "email": "...", "name": "..." }
  }
}
```

### Center Endpoints

#### Lấy Danh Sách Trung Tâm

```http
GET /centers?isVerified=true&limit=20&page=1
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `isVerified` | boolean | Filter by verification status |
| `search` | string | Search by name |
| `limit` | number | Items per page (default: 20) |
| `page` | number | Page number (default: 1) |
| `sortBy` | string | Sort field (createdAt, rating, name) |
| `sortOrder` | string | Sort order (asc, desc) |

#### Lấy Chi Tiết Trung Tâm

```http
GET /centers/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "center_id",
    "name": "Trung Tâm Gia Sư ABC",
    "address": "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    "phone": "0123456789",
    "website": "https://example.com",
    "hours": "8:00 AM - 6:00 PM",
    "image": "https://...",
    "description": "...",
    "averageRating": 4.5,
    "totalReviews": 15,
    "reviews": [
      {
        "_id": "review_id",
        "rating": 5,
        "comment": "Chất lượng tuyệt vời!",
        "reviewerName": "Học sinh A",
        "images": ["https://..."],
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### Tạo Trung Tâm Mới

```http
POST /centers
Content-Type: multipart/form-data

{
  "name": "Trung Tâm Gia Sư XYZ",
  "address": "456 Trần Quốc Toản",
  "phone": "0987654321",
  "website": "https://example.com",
  "hours": "7:00 AM - 9:00 PM",
  "description": "...",
  "image": <file>
}
```

#### Thêm Đánh Giá

```http
POST /centers/:id/reviews
Content-Type: multipart/form-data

{
  "rating": 5,
  "comment": "Dạy rất tốt, giáo viên thân thiện",
  "reviewerName": "Phụ Huynh B",
  "images": [<file1>, <file2>, ...]  // Tối đa 5 ảnh
}
```

### Admin Endpoints (Yêu cầu Authorization)

```bash
# Header yêu cầu
Authorization: Bearer <token>
```

#### Cập Nhật Trung Tâm

```http
PUT /centers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tên mới",
  "isVerified": true,
  "description": "Mô tả mới"
}
```

#### Xóa Trung Tâm

```http
DELETE /centers/:id
Authorization: Bearer <token>
```

#### Lấy Tất Cả Đánh Giá (Admin)

```http
GET /centers/reviews/all
Authorization: Bearer <token>
```

---

## 🔐 Hệ Thống Authentication

### JWT (JSON Web Tokens)

Ứng dụng sử dụng JWT để xác thực admin:

1. **Access Token** (15 phút)

   - Dùng để xác thực mỗi request
   - Lưu trong cookie HTTP-only

2. **Refresh Token** (7 ngày)
   - Dùng để lấy access token mới
   - Lưu an toàn trên server

```javascript
// Cấu trúc JWT Payload
{
  "id": "admin_id",
  "email": "admin@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Middleware Authentication

```javascript
// adminMiddleware kiểm tra:
- Header Authorization có JWT token?
- Token hợp lệ?
- Token chưa hết hạn?
- User có role = "admin"?
```

### Lưu Trữ Token

- **Access Token**: HTTP-only Cookie (tự động gửi mỗi request)
- **Refresh Token**: HTTP-only Cookie (an toàn hơn)

---

## ⭐ Hệ Thống Đánh Giá & Reviews

### Cấu Trúc Review

```javascript
{
  "_id": "review_id",
  "rating": 1-5,                    // Bắt buộc
  "comment": "Bình luận của user",  // Tùy chọn
  "reviewerName": "Tên người viết", // Tùy chọn
  "images": ["url1", "url2", ...],  // Tối đa 5 ảnh
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Quy Tắc Đánh Giá

| Quy Tắc            | Chi Tiết                           |
| ------------------ | ---------------------------------- |
| **Rating**         | 1 sao (Rất tệ) - 5 sao (Tuyệt vời) |
| **Comment**        | Tối đa 1000 ký tự                  |
| **Images**         | Tối đa 5 ảnh per review            |
| **Kích Thước Ảnh** | Max 10MB per file                  |
| **Định Dạng Ảnh**  | JPEG, PNG, GIF, WebP               |

### Tính Toán Average Rating

```javascript
// Backend tự động tính:
averageRating = sum(ratings) / count(reviews);

// Ví dụ:
// 3 reviews: 5, 4, 5 sao
// Average: (5 + 4 + 5) / 3 = 4.67 sao
```

---

## 📸 Upload Hình Ảnh

### Dịch Vụ Upload

Ứng dụng tích hợp **upanhnhanh.com** API cho upload hình ảnh:

```javascript
// Upload Service Flow
User submits image
    ↓
Multer validates file (type, size)
    ↓
Send to upanhnhanh API
    ↓
Get CDN URL back
    ↓
Save URL to MongoDB
    ↓
Return URL to frontend
```

### Hạn Chế Upload

| Giới Hạn       | Giá Trị              |
| -------------- | -------------------- |
| File size      | Max 10MB             |
| Ảnh per review | Max 5                |
| Ảnh per center | 1                    |
| Định dạng      | JPEG, PNG, GIF, WebP |

### Cấu Hình Upload

```env
# File: back-end/.env
APIKEY=your-upanhnhanh-api-key
APIURL=https://upanhnhanh.com/api/v1
```

**Upload Service (back-end/src/services/uploadService.js):**

```javascript
// Gửi file đến upanhnhanh
const uploadedUrl = await uploadService.uploadImage(file);
```

---

## 🚦 Rate Limiting

### Mục Đích

Ngăn chặn spam, brute-force attacks, và lạm dụng API.

### Giới Hạn

| Endpoint             | Limit      | Window  | Bỏ Qua |
| -------------------- | ---------- | ------- | ------ |
| POST /centers        | 5 requests | 1 giờ   | Admin  |
| POST /reviews        | 1 request  | 1 giờ   | Admin  |
| POST /admin/login    | 5 attempts | 15 phút | -      |
| POST /admin/register | 3 attempts | 1 giờ   | -      |

### Xác Định Bằng IP

```javascript
// Rate limiter dùng client IP address:
- Nếu là proxy: lấy từ X-Forwarded-For header
- Không thì: lấy socket.remoteAddress

app.set("trust proxy", 1); // Thêm ở app.js
```

### Response Khi Bị Limit

```json
{
  "status": 429,
  "message": "Quá nhiều request, vui lòng thử lại sau 1 giờ",
  "retryAfter": 3600
}
```

---

## 🌐 Deploy Lên Vercel (Frontend)

### Yêu Cầu

- Vercel account (free)
- GitHub repository
- Backend API đã deployed

### Bước 1: Push lên GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Bước 2: Connect với Vercel

1. Truy cập [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import GitHub repository
4. Select folder: `./front-end`

### Bước 3: Thiết Lập Environment Variables

Trong Vercel Dashboard → Project Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### Bước 4: Deploy

Click "Deploy" và chờ hoàn tất (~2-3 phút)

### Kiểm Tra Deployment

```bash
https://your-project-name.vercel.app
```

### File Cấu Hình

- **vercel.json** - Vercel configuration
- **next.config.js** - Next.js optimization
- **middleware.ts** - Custom middleware

---

## 🔧 Troubleshooting

### 🗄️ Database Issues

**Lỗi: "MongoServerSelectionError"**

```
❌ MongoDB connection failed

✅ Giải pháp:
1. Kiểm tra MongoDB đã chạy?
   - Windows: mongod
   - Linux: systemctl start mongod

2. Kiểm tra MONGODB_URI trong .env
   - Local: mongodb://localhost:27017/giasu-reviews
   - Atlas: mongodb+srv://user:pass@cluster...

3. Kiểm tra firewall/network
```

**Lỗi: "Authentication failed"**

```
❌ MongoDB Atlas connection failed

✅ Giải pháp:
1. Kiểm tra MongoDB Atlas username/password
2. Thêm IP address vào Atlas IP Whitelist
3. Copy connection string chính xác từ Atlas
```

### 🔌 API Connection Issues

**Lỗi: CORS blocked**

```
❌ Access to XMLHttpRequest from 'http://localhost:3000'
   has been blocked by CORS policy

✅ Giải pháp:
1. Kiểm tra CLIENT_URL trong back-end/.env
   CLIENT_URL=http://localhost:3000

2. Kiểm tra CORS middleware đã bật trong app.js

3. Restart backend server
```

**Lỗi: "Cannot connect to API"**

```
❌ API URL không truy cập được

✅ Giải pháp:
1. Backend có chạy?
   npm run dev trong back-end/

2. Kiểm tra NEXT_PUBLIC_API_URL trong front-end/.env.local

3. Thử: http://localhost:5000 trong browser
   - Nếu thấy "Server is running" → Backend OK
```

### 🔐 Authentication Issues

**Lỗi: "Invalid token"**

```
❌ JWT token không hợp lệ

✅ Giải pháp:
1. Logout rồi login lại
2. Xóa cookies: DevTools → Application → Cookies
3. Kiểm tra JWT_SECRET trong .env
```

**Lỗi: "401 Unauthorized"**

```
❌ Yêu cầu không có authorization

✅ Giải pháp:
1. Đang đăng nhập rồi chưa?
2. Token hết hạn? Logout → Login lại
3. Kiểm tra Authorization header trong request
```

### 📸 Upload Issues

**Lỗi: "File too large"**

```
❌ File vượt quá 10MB

✅ Giải pháp:
1. Giảm kích thước file
2. Nén ảnh: online tools hoặc Photoshop
3. Chỉ chọn file JPEG/PNG
```

**Lỗi: "Upload failed"**

```
❌ Upload service không hoạt động

✅ Giải pháp:
1. Kiểm tra APIKEY, APIURL trong back-end/.env
2. API key có hợp lệ không?
3. Kiểm tra network connection
```

### 🚀 Vercel Deployment Issues

**Lỗi: "Build failed"**

```
❌ Deployment bị lỗi

✅ Giải pháp:
1. Kiểm tra logs trong Vercel Dashboard
2. Chạy npm run build locally để test
3. Kiểm tra Node.js version
4. Chạy npm run typecheck
```

**Lỗi: "API request failed on Vercel"**

```
❌ Frontend không kết nối được backend

✅ Giải pháp:
1. Kiểm tra NEXT_PUBLIC_API_URL trỏ đến backend công khai
2. Backend có CORS cho phép domain Vercel không?
3. Backend server có chạy không?
```

### 🐛 Other Common Issues

**Lỗi: "Port already in use"**

```bash
❌ Port 5000 hoặc 3000 đang sử dụng

# Tìm process sử dụng port (Windows PowerShell):
netstat -ano | findstr :5000

# Kill process (thay <PID> bằng Process ID):
taskkill /PID <PID> /F

# Hoặc chỉ định port khác:
PORT=5001 npm run dev
```

**Lỗi: "node_modules issues"**

```bash
# Xóa cache npm
npm cache clean --force

# Xóa node_modules
rm -r node_modules
# Windows: rmdir /s node_modules

# Reinstall
npm install
```

---

## 👥 Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng!

### Quy Trình Đóng Góp

1. **Fork** repository
2. **Clone** fork của bạn
   ```bash
   git clone https://github.com/yourusername/giasu-reviews.git
   ```
3. **Tạo branch** cho feature
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Commit** changes
   ```bash
   git commit -m "Add your feature description"
   ```
5. **Push** đến branch
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Tạo Pull Request** với mô tả chi tiết

### Hướng Dẫn Code

- ✅ TypeScript cho frontend
- ✅ JSDoc comments
- ✅ Consistent code style
- ✅ Kiểm tra lỗi: `npm run lint`

### Issue Report

Nếu tìm thấy bug:

1. Kiểm tra issue đã tồn tại chưa
2. Tạo issue mới với:
   - Mô tả rõ ràng
   - Bước tái hiện
   - Expected vs Actual behavior
   - Environment (OS, Node version, etc.)

---

## 📞 Liên Hệ

| Kêu Gọi           | Thông Tin                                                                  |
| ----------------- | -------------------------------------------------------------------------- |
| **Email**         | support@giasu-reviews.com                                                  |
| **GitHub Issues** | [Report bugs](https://github.com/yourusername/giasu-reviews/issues)        |
| **Discussions**   | [Ask questions](https://github.com/yourusername/giasu-reviews/discussions) |

---

## 📄 License

Dự án này được cấp phép dưới **ISC License** - xem file [LICENSE](LICENSE) để chi tiết.

---

## 🙏 Cảm Ơn

Cảm ơn tất cả những người đã đóng góp, báo cáo bug, và hỗ trợ dự án!

```
┌────────────────────────────────────────┐
│  Được xây dựng với ❤️ cho cộng đồng    │
│  Gia Sư Reviews © 2024                │
└────────────────────────────────────────┘
```

---

## 📚 Tài Liệu Tham Khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [JWT.io](https://jwt.io/)

---

**Happy Coding! 🚀**

### Back-end

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Multer** - File upload handling
- **express-rate-limit** - Rate limiting
- **bcryptjs** - Password hashing

## 📁 Cấu Trúc Dự Án

```
giasu-reviews/
├── front-end/          # Next.js frontend application
│   ├── app/            # Next.js App Router pages
│   │   ├── page.tsx    # Trang chủ
│   │   ├── login/      # Đăng nhập admin
│   │   └── admin/      # Admin dashboard
│   ├── components/     # React components
│   │   ├── AdminGuard.tsx  # Authentication guard
│   │   └── ui/         # shadcn/ui components
│   ├── lib/           # Utilities
│   │   └── api.ts      # API client
│   ├── middleware.ts  # Next.js middleware (auth check)
│   └── ...
├── back-end/           # Express.js backend API
│   ├── src/
│   │   ├── config/     # Configuration files
│   │   ├── controllers/# Request handlers
│   │   ├── middlewares/# Express middlewares
│   │   ├── models/     # Mongoose schemas
│   │   ├── repositories/# Database operations
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── utils/      # Utility functions
│   └── ...
└── README.md           # This file
```

## 🚀 Cài Đặt

### Yêu Cầu Hệ Thống

- Node.js >= 18.x
- MongoDB >= 5.x
- npm hoặc yarn

### Cài Đặt Dependencies

```bash
# Cài đặt dependencies cho back-end
cd back-end
npm install

# Cài đặt dependencies cho front-end
cd ../front-end
npm install
```

## ⚙️ Cấu Hình

### Back-end

1. Tạo file `.env` trong thư mục `back-end/`:

```bash
cd back-end
cp env.template .env
```

2. Điền thông tin vào file `.env`:

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

Xem chi tiết tại [back-end/README.md](./back-end/README.md)

### Front-end

1. Tạo file `.env.local` trong thư mục `front-end/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Lưu ý:**

- Nếu gặp lỗi kết nối trong server-side rendering, thử dùng `http://127.0.0.1:5000` thay vì `localhost`
- Bạn có thể copy từ file `.env.local.example` nếu có

Xem chi tiết tại [front-end/README.md](./front-end/README.md)

## ▶️ Chạy Ứng Dụng

### Development Mode

**Terminal 1 - Back-end:**

```bash
cd back-end
npm run dev
```

**Terminal 2 - Front-end:**

```bash
cd front-end
npm run dev
```

Sau khi chạy:

- Front-end: http://localhost:3000
- Back-end API: http://localhost:5000

### Production Mode

**Back-end:**

```bash
cd back-end
npm start
```

**Front-end:**

```bash
cd front-end
npm run build
npm start
```

## 🚀 Deploy Lên Vercel

### Yêu Cầu Trước Khi Deploy

1. **GitHub Repository**: Push code lên GitHub
2. **Vercel Account**: Đăng ký tài khoản Vercel
3. **MongoDB Atlas**: Setup MongoDB cloud database (hoặc dùng MongoDB local)

### Deploy Back-end

1. **Tạo Vercel Project cho Back-end:**

   - Vào Vercel Dashboard
   - Click "Add New Project"
   - Import repository
   - Chọn root directory: `back-end`

2. **Cấu Hình Environment Variables:**

Vào **Settings > Environment Variables** và thêm:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend.vercel.app
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
APIURL=https://upanhnhanh.com/api/v1
APIKEY=your-api-key-here
```

**QUAN TRỌNG:**

- `CLIENT_URL` phải là URL đầy đủ của frontend (không có trailing slash `/`)
- Ví dụ: `https://giasu-mu.vercel.app` (KHÔNG phải `https://giasu-mu.vercel.app/`)
- `JWT_SECRET` và `JWT_REFRESH_SECRET` phải giống nhau giữa frontend và backend (nếu frontend cần verify)

3. **Deploy:**
   - Vercel sẽ tự động detect Express.js
   - Deploy và lấy URL backend (ví dụ: `https://giasu-api.vercel.app`)

### Deploy Front-end

1. **Tạo Vercel Project cho Front-end:**

   - Vào Vercel Dashboard
   - Click "Add New Project"
   - Import repository
   - Chọn root directory: `front-end`

2. **Cấu Hình Environment Variables:**

Vào **Settings > Environment Variables** và thêm:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
NODE_ENV=production
```

**QUAN TRỌNG:**

- `NEXT_PUBLIC_API_URL` phải là URL đầy đủ của backend (có `https://`)
- Ví dụ: `https://giasu-api.vercel.app` (KHÔNG phải `https://giasu-api.vercel.app/`)

3. **Deploy:**

   - Vercel sẽ tự động detect Next.js
   - Deploy và lấy URL frontend (ví dụ: `https://giasu-mu.vercel.app`)

4. **Cập Nhật Backend CLIENT_URL:**
   - Quay lại backend project trên Vercel
   - Cập nhật `CLIENT_URL` với URL frontend mới
   - Redeploy backend

### Sau Khi Deploy

1. **Kiểm Tra:**

   - Truy cập frontend URL
   - Kiểm tra login có hoạt động không
   - Kiểm tra API calls có thành công không

2. **Nếu Gặp Lỗi:**
   - Xem [Troubleshooting](#troubleshooting) section
   - Kiểm tra Vercel Logs
   - Kiểm tra Environment Variables

Xem chi tiết tại:

- [front-end/VERCEL_DEPLOY.md](./front-end/VERCEL_DEPLOY.md)
- [front-end/VERCEL_LOGIN_DEBUG.md](./front-end/VERCEL_LOGIN_DEBUG.md)

## 🔐 Hệ Thống Authentication

### Cách Hoạt Động

Hệ thống sử dụng **JWT tokens** được lưu trong **HTTP-only cookies** để bảo mật.

#### 1. Đăng Nhập

1. User gửi email/password đến `/api/admin/login`
2. Backend verify credentials và tạo JWT tokens:
   - `accessToken` (hết hạn sau 15 phút)
   - `refreshToken` (hết hạn sau 7 ngày)
3. Backend set cookies trên **backend domain** với:
   - `httpOnly: true` - Không thể truy cập từ JavaScript
   - `secure: true` - Chỉ gửi qua HTTPS
   - `sameSite: "none"` - Cho phép cross-domain (production)
4. Frontend set cookie flag `isAuthenticated=true` trên **frontend domain** để middleware có thể kiểm tra

#### 2. Cross-Domain Cookie Solution

**Vấn Đề:**

- Cookies được set trên backend domain (ví dụ: `api.vercel.app`)
- Next.js middleware chạy trên frontend domain (ví dụ: `app.vercel.app`)
- Middleware không thể đọc cookies từ domain khác

**Giải Pháp:**

- Sau khi login thành công, frontend set cookie `isAuthenticated=true` trên frontend domain
- Middleware kiểm tra cookie này để xác định authentication status
- Backend cookies vẫn được dùng cho API calls (tự động gửi bởi browser)

**Flow:**

```
1. User login → Backend sets cookies (backend domain)
2. Frontend sets isAuthenticated=true (frontend domain)
3. User navigate to /admin
4. Middleware checks isAuthenticated cookie → Allow access
5. API calls automatically include backend cookies
6. Backend verifies tokens from cookies
```

#### 3. Middleware Protection

Next.js middleware (`front-end/middleware.ts`) bảo vệ routes:

- `/login` - Redirect to `/admin` nếu đã authenticated
- `/admin/*` - Redirect to `/login` nếu chưa authenticated

#### 4. Client-Side Protection

`AdminGuard` component (`front-end/components/AdminGuard.tsx`) bảo vệ admin pages:

- Gọi `/api/admin/check-auth` để verify authentication
- Redirect to `/login` nếu không authenticated
- Clear `isAuthenticated` cookie nếu auth fails

### Cookie Configuration

#### Backend Cookies (Set by Backend)

```javascript
{
  httpOnly: true,      // Không thể truy cập từ JavaScript
  secure: true,        // Chỉ gửi qua HTTPS
  sameSite: "none",    // Cho phép cross-domain
  path: "/",
  maxAge: 15 * 60 * 1000  // 15 phút (accessToken)
}
```

#### Frontend Cookie (Set by Frontend)

```javascript
{
  path: "/",
  maxAge: 7 * 24 * 60 * 60,  // 7 ngày
  sameSite: "Lax",
  secure: true  // Trong production
}
```

### Token Refresh

- Khi `accessToken` hết hạn, backend tự động refresh bằng `refreshToken`
- New tokens được set trong cookies
- Frontend không cần xử lý refresh logic

## 📚 API Documentation

### Base URL

**Development:**

```
http://localhost:5000/api
```

**Production:**

```
https://your-backend.vercel.app/api
```

### Endpoints

#### Centers

- `GET /api/centers` - Lấy danh sách trung tâm
- `GET /api/centers/:id` - Lấy chi tiết trung tâm
- `POST /api/centers` - Tạo trung tâm mới (rate limit: 5/15 phút)
- `POST /api/centers/:id/reviews` - Thêm đánh giá (rate limit: 1/giờ)
- `PUT /api/centers/:id` - Cập nhật trung tâm (admin only)
- `DELETE /api/centers/:id` - Xóa trung tâm (admin only)
- `PUT /api/centers/:id/verify` - Duyệt trung tâm (admin only)

#### Admin

- `POST /api/admin/register` - Đăng ký admin
- `POST /api/admin/login` - Đăng nhập admin
- `GET /api/admin/me` - Lấy thông tin admin hiện tại
- `GET /api/admin/check-auth` - Kiểm tra đăng nhập

Xem chi tiết tại [back-end/README.md](./back-end/README.md)

## 🔒 Bảo Mật

- **JWT Authentication** - Token-based authentication với refresh tokens
- **Password Hashing** - bcrypt với salt rounds
- **CORS** - Cross-origin resource sharing được cấu hình
- **Rate Limiting** - Giới hạn số lượng requests
- **Input Validation** - Validation đầu vào
- **Admin Protection** - Middleware bảo vệ routes admin
- **HTTP-only Cookies** - Tokens không thể truy cập từ JavaScript
- **Secure Cookies** - Chỉ gửi qua HTTPS trong production
- **SameSite Cookies** - Bảo vệ chống CSRF attacks

## 🚦 Rate Limiting

### Người Dùng Thường

- **Tạo trung tâm**: 5 requests / 15 phút
- **Thêm đánh giá**: 1 request / 1 giờ

### Admin

- Không bị giới hạn rate limit
- Có thể tạo trung tâm và đánh giá không giới hạn

## 🐛 Troubleshooting

### Lỗi Đăng Nhập Trên Vercel

**Triệu Chứng:**

- Login thành công nhưng redirect về `/login`
- Middleware không nhận diện được authentication

**Nguyên Nhân:**

- Cookies được set trên backend domain nhưng middleware không thể đọc
- Frontend cookie flag chưa được set

**Giải Pháp:**

1. Kiểm tra `isAuthenticated` cookie có được set sau login không (DevTools > Application > Cookies)
2. Kiểm tra `NEXT_PUBLIC_API_URL` đã được set đúng chưa
3. Kiểm tra `CLIENT_URL` trong backend environment variables
4. Xem [front-end/VERCEL_LOGIN_DEBUG.md](./front-end/VERCEL_LOGIN_DEBUG.md)

### API Connection Error

**Kiểm tra:**

1. Back-end đang chạy tại URL đúng
2. `NEXT_PUBLIC_API_URL` trong `.env.local` đúng
3. CORS được cấu hình đúng trong back-end
4. Network tab trong DevTools để xem lỗi chi tiết

### Cookies Không Hoạt Động

**Nguyên Nhân:**

- `CLIENT_URL` chưa được set hoặc sai
- `sameSite` không phải `"none"` trong production
- `secure` không phải `true`

**Giải Pháp:**

1. Kiểm tra `CLIENT_URL` trên Vercel backend
2. Đảm bảo `getCookieOptions()` trả về `sameSite: "none"` và `secure: true` trong production
3. Xem [back-end/COOKIE_DEBUG.md](./back-end/COOKIE_DEBUG.md)

### CORS Error

**Nguyên Nhân:**

- Frontend origin không được phép trong CORS
- `credentials: true` chưa được set

**Giải Pháp:**

1. Kiểm tra `CLIENT_URL` trên Vercel backend
2. Đảm bảo CORS có `credentials: true`
3. Kiểm tra backend logs để xem origin nào bị block

### MongoDB Connection Error

```bash
# Kiểm tra MongoDB đã chạy chưa
mongod

# Hoặc kiểm tra connection string trong .env
MONGODB_URI=mongodb://localhost:27017/giasu-reviews
```

### Build Errors

**Frontend:**

```bash
# Xóa cache và rebuild
cd front-end
rm -rf .next
npm run build
```

**Backend:**

```bash
# Kiểm tra dependencies
cd back-end
npm install
```

### TypeScript Errors

```bash
# Kiểm tra types
cd front-end
npm run type-check
```

## 📝 Scripts

### Front-end

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint

# Type check
npm run type-check
```

### Back-end

```bash
# Development mode với auto-reload
npm run dev

# Production mode
npm start
```

## 📄 License

ISC

## 👥 Đóng Góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📞 Liên Hệ

Nếu có thắc mắc, vui lòng tạo issue trên repository.

---

**Lưu Ý Quan Trọng:**

- Sau khi thay đổi Environment Variables trên Vercel, cần **redeploy** cả frontend và backend
- Cookies với `sameSite: "none"` chỉ hoạt động trên HTTPS
- Vercel tự động dùng HTTPS, nên không cần lo về secure
- Đảm bảo `JWT_SECRET` và `JWT_REFRESH_SECRET` giống nhau giữa các deployments nếu cần
