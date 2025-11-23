# Gia Sư Reviews - Hệ Thống Đánh Giá Trung Tâm Gia Sư

Hệ thống web đánh giá và quản lý trung tâm gia sư tại Việt Nam. Cho phép người dùng xem, tìm kiếm, đánh giá các trung tâm gia sư và quản trị viên quản lý nội dung.

## 📋 Mục Lục

- [Tính Năng](#tính-năng)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Deploy Lên Vercel](#deploy-lên-vercel)
- [Hệ Thống Authentication](#hệ-thống-authentication)
- [API Documentation](#api-documentation)
- [Bảo Mật](#bảo-mật)
- [Rate Limiting](#rate-limiting)
- [Troubleshooting](#troubleshooting)
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
