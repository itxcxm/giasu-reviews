# Front-end - Gia Sư Reviews

Next.js frontend application cho hệ thống đánh giá trung tâm gia sư.

## 📋 Mục Lục

- [Tính Năng](#tính-năng)
- [Công Nghệ](#công-nghệ)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Pages](#pages)
- [Components](#components)
- [API Client](#api-client)

## ✨ Tính Năng

- 🏠 Trang chủ - Danh sách trung tâm gia sư
- 🔍 Tìm kiếm và lọc trung tâm
- 📝 Chi tiết trung tâm và đánh giá
- ⭐ Đánh giá trung tâm với hình ảnh
- ➕ Thêm trung tâm mới
- 🔐 Đăng nhập admin
- 🛡️ Admin dashboard với authentication guard
- 📊 Quản lý trung tâm và đánh giá (admin)

## 🛠️ Công Nghệ

- **Next.js 14** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons
- **React Hooks** - State management

## 🚀 Cài Đặt

### Yêu Cầu

- Node.js >= 18.x
- npm hoặc yarn

### Cài Đặt Dependencies

```bash
npm install
```

## ⚙️ Cấu Hình

### 1. Tạo file `.env.local`

Tạo file `.env.local` trong thư mục `front-end/`:

```bash
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Lưu ý:**

- Nếu gặp lỗi kết nối trong server-side rendering, thử dùng `http://127.0.0.1:5000` thay vì `localhost`
- Bạn có thể copy từ file `.env.local.example` nếu có

### 2. Đảm bảo Back-end đang chạy

Front-end cần kết nối đến back-end API. Đảm bảo back-end đang chạy tại `http://localhost:5000`.

**Kiểm tra back-end:**

```bash
cd back-end
npm run dev
```

Back-end sẽ chạy tại `http://localhost:5000` (hoặc port được cấu hình trong `.env` của back-end).

## ▶️ Chạy Ứng Dụng

### Development Mode

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### Production Build

```bash
# Build
npm run build

# Start production server
npm start
```

### Static Export (nếu cần)

```bash
npm run build
npm run export
```

## 📁 Cấu Trúc Dự Án

```
front-end/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Trang chủ
│   ├── add-center/        # Thêm trung tâm
│   ├── review/            # Chi tiết trung tâm và đánh giá
│   │   └── [id]/          # Dynamic route
│   ├── login/             # Đăng nhập admin
│   └── admin/             # Admin dashboard
│       ├── centers/       # Quản lý trung tâm
│       └── reviews/       # Quản lý đánh giá
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── AdminGuard.tsx     # Authentication guard
│   └── navbar.tsx         # Navigation bar
├── lib/                   # Utilities
│   ├── api.ts             # API client
│   └── utils.ts           # Helper functions
├── hooks/                 # Custom React hooks
│   └── use-toast.ts       # Toast notifications
└── public/                # Static files
```

## 📄 Pages

### Trang Chủ (`/`)

- Hiển thị danh sách trung tâm gia sư
- Tìm kiếm và lọc trung tâm
- Link đến chi tiết trung tâm

### Thêm Trung Tâm (`/add-center`)

- Form thêm trung tâm mới
- Upload hình ảnh
- Validation và error handling

### Chi Tiết Trung Tâm (`/review/[id]`)

- Thông tin chi tiết trung tâm
- Danh sách đánh giá
- Form thêm đánh giá mới
- Lightbox cho hình ảnh

### Đăng Nhập Admin (`/login`)

- Form đăng nhập admin
- Xử lý authentication
- Redirect đến admin dashboard

### Admin Dashboard (`/admin`)

- Trang chủ admin
- Links đến quản lý trung tâm và đánh giá

### Quản Lý Trung Tâm (`/admin/centers`)

- Danh sách trung tâm
- CRUD operations
- Duyệt/Hủy duyệt trung tâm
- Upload hình ảnh

### Quản Lý Đánh Giá (`/admin/reviews`)

- Danh sách tất cả đánh giá
- Xóa đánh giá
- Tìm kiếm và lọc

## 🧩 Components

### AdminGuard

Component bảo vệ các trang admin, tự động redirect về `/login` nếu chưa đăng nhập.

```tsx
<AdminGuard>{/* Protected content */}</AdminGuard>
```

### UI Components

Sử dụng shadcn/ui components:

- Button, Input, Textarea
- Card, Dialog, Alert
- Table, Badge, Toast
- Và nhiều components khác

## 🔌 API Client

API client được định nghĩa trong `lib/api.ts`:

### Centers API

```typescript
import { centersAPI } from "@/lib/api";

// Lấy danh sách trung tâm
const response = await centersAPI.getCenters({
  search: "tên trung tâm",
  isVerified: true,
  page: 1,
  limit: 10,
});

// Tạo trung tâm mới
const response = await centersAPI.createCenter({
  name: "Tên trung tâm",
  address: "Địa chỉ",
  imageFile: file, // File object
});

// Thêm đánh giá
const response = await centersAPI.addReview(centerId, {
  rating: 5,
  comment: "Rất tốt",
  reviewerName: "Tên người đánh giá",
  images: [file1, file2], // File objects
});
```

### Admin API

```typescript
import { adminAPI } from "@/lib/api";

// Đăng nhập
const response = await adminAPI.login(email, password);

// Kiểm tra đăng nhập
const response = await adminAPI.checkAuth();
```

## 🎨 Styling

### Tailwind CSS

Sử dụng Tailwind CSS utility classes cho styling.

### Custom Styles

Global styles trong `app/globals.css`.

## 🔒 Authentication

### Admin Authentication

- Sử dụng cookies để lưu JWT tokens
- `AdminGuard` component bảo vệ routes
- Tự động redirect nếu chưa đăng nhập

### API Requests

Tất cả API requests tự động gửi cookies (credentials: 'include').

## 📱 Responsive Design

Ứng dụng được thiết kế responsive, hỗ trợ:

- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

## 🐛 Troubleshooting

### API Connection Error

Kiểm tra:

1. Back-end đang chạy tại `http://localhost:5000`
2. `NEXT_PUBLIC_API_URL` trong `.env.local` đúng
3. CORS được cấu hình đúng trong back-end

### Build Errors

```bash
# Xóa cache và rebuild
rm -rf .next
npm run build
```

### TypeScript Errors

```bash
# Kiểm tra types
npm run type-check
```

## 📝 Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## 📄 License

ISC
