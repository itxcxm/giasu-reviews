# Gia Sư Reviews - Hệ Thống Đánh Giá Trung Tâm Gia Sư

Hệ thống web đánh giá và quản lý trung tâm gia sư tại Việt Nam. Cho phép người dùng xem, tìm kiếm, đánh giá các trung tâm gia sư và quản trị viên quản lý nội dung.

## 📋 Mục Lục

- [Tính Năng](#tính-năng)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [API Documentation](#api-documentation)
- [Bảo Mật](#bảo-mật)
- [Rate Limiting](#rate-limiting)
- [Đóng Góp](#đóng-góp)

## ✨ Tính Năng

### Người Dùng

- 🔍 Tìm kiếm trung tâm gia sư
- 📝 Xem chi tiết trung tâm và đánh giá
- ⭐ Đánh giá trung tâm (rating 1-5 sao)
- 💬 Viết bình luận với hình ảnh (tối đa 5 ảnh)
- 📸 Upload hình ảnh trung tâm mới
- 🔒 Rate limiting để tránh spam

### Quản Trị Viên

- 🔐 Đăng nhập/Đăng ký admin
- ✅ Duyệt/Hủy duyệt trung tâm
- 📊 Quản lý trung tâm (CRUD)
- 💬 Quản lý đánh giá
- 🛡️ Bảo vệ routes với authentication middleware
- ⚡ Không bị giới hạn rate limit

## 🛠️ Công Nghệ Sử Dụng

### Front-end

- **Next.js 14** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Axios** - HTTP client
- **Lucide React** - Icons

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
│   ├── components/     # React components
│   ├── lib/            # Utilities and API client
│   └── ...
├── back-end/           # Express.js backend API
│   ├── src/
│   │   ├── config/     # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middlewares/ # Express middlewares
│   │   ├── models/      # Mongoose schemas
│   │   ├── repositories/# Database operations
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
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
cp env.template .env
```

2. Điền thông tin vào file `.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/giasu-reviews
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
APIURL=https://upanhnhanh.com/api/v1
APIKEY=your-api-key-here
```

Xem chi tiết tại [back-end/README.md](./back-end/README.md)

### Front-end

1. Tạo file `.env.local` trong thư mục `front-end/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

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

Sau khi chạy:

- Front-end: http://localhost:3000
- Back-end API: http://localhost:5000

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
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

- **JWT Authentication** - Token-based authentication
- **Password Hashing** - bcrypt với salt rounds
- **CORS** - Cross-origin resource sharing được cấu hình
- **Rate Limiting** - Giới hạn số lượng requests
- **Input Validation** - Validation đầu vào
- **Admin Protection** - Middleware bảo vệ routes admin

## 🚦 Rate Limiting

### Người Dùng Thường

- **Tạo trung tâm**: 5 requests / 15 phút
- **Thêm đánh giá**: 1 request / 1 giờ

### Admin

- Không bị giới hạn rate limit
- Có thể tạo trung tâm và đánh giá không giới hạn

## 📝 License

ISC

## 👥 Đóng Góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📞 Liên Hệ

Nếu có thắc mắc, vui lòng tạo issue trên repository.
