# Hướng Dẫn Deploy Lên Vercel

## Vấn Đề: Lỗi 401 Unauthorized - "Token không được cung cấp"

Khi deploy lên Vercel, bạn có thể gặp lỗi **401 Unauthorized** với message `"Token không được cung cấp"` khi gọi API `/api/admin/check-auth`.

### Dấu Hiệu Nhận Biết:

- Request URL trong Network tab là: `https://giasu-reviews.vercel.app/api/admin/check-auth` (❌ SAI - đang gọi đến Vercel domain)
- Thay vì: `https://your-backend-domain.com/api/admin/check-auth` (✅ ĐÚNG - phải gọi đến backend server)
- Token đã được lưu trong cookie sau khi đăng nhập nhưng vẫn bị lỗi 401

### Nguyên Nhân:

1. **`NEXT_PUBLIC_API_URL` chưa được set** trên Vercel → Frontend gọi API đến chính domain Vercel thay vì backend
2. **Chưa redeploy** sau khi thêm environment variables
3. Cookie không được gửi đi do cấu hình CORS hoặc cookie settings chưa đúng

## Giải Pháp

### 1. Cấu Hình Environment Variables Trên Vercel

⚠️ **QUAN TRỌNG NHẤT**: Đây là nguyên nhân chính gây lỗi "Token không được cung cấp"!

Nếu không set `NEXT_PUBLIC_API_URL`, frontend sẽ cố gọi API trên chính domain Vercel (ví dụ: `https://giasu-reviews.vercel.app/api/admin/check-auth`) thay vì backend server của bạn, dẫn đến lỗi 401.

Vào **Settings > Environment Variables** trong Vercel dashboard và thêm:

#### Front-end (Vercel):

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

**Lưu ý quan trọng:**

- ✅ URL phải bao gồm protocol (`https://`)
- ✅ Không có dấu `/` ở cuối
- ✅ Ví dụ đúng: `https://api.yourdomain.com` hoặc `https://your-backend.herokuapp.com`
- ❌ Ví dụ sai: `api.yourdomain.com` (thiếu protocol) hoặc `https://api.yourdomain.com/` (có dấu / ở cuối)
- 🔄 **Sau khi thêm, PHẢI REDEPLOY** để áp dụng thay đổi (Vercel không tự động redeploy khi thêm env vars)

#### Back-end (nơi bạn deploy backend):

```
NODE_ENV=production
CLIENT_URL=https://your-vercel-app.vercel.app,https://your-vercel-app.vercel.app/*
PORT=5000
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
MONGODB_URI=your-mongodb-uri
```

**Lưu ý quan trọng:**

- `CLIENT_URL` phải bao gồm URL đầy đủ của Vercel app (bao gồm cả preview URLs nếu cần)
- Ví dụ: `https://my-app.vercel.app,https://my-app-git-main.vercel.app`
- Nếu muốn cho phép tất cả preview URLs, có thể dùng pattern: `https://*.vercel.app`

### 2. Kiểm Tra Cookie Settings

Backend đã được cấu hình để:

- Sử dụng `sameSite: "none"` khi production và cross-domain
- Sử dụng `secure: true` khi production (yêu cầu HTTPS)
- Hỗ trợ CORS với `credentials: true`

### 3. Kiểm Tra API URL (QUAN TRỌNG!)

**Cách kiểm tra nhanh:**

1. Mở **DevTools** (F12) > Tab **Network**
2. Thử đăng nhập hoặc refresh trang
3. Tìm request đến `/api/admin/check-auth` hoặc bất kỳ API call nào
4. Xem **Request URL** trong tab Headers:
   - ❌ **SAI**: `https://giasu-reviews.vercel.app/api/admin/check-auth`
     → `NEXT_PUBLIC_API_URL` chưa được set hoặc chưa redeploy
   - ✅ **ĐÚNG**: `https://your-backend-domain.com/api/admin/check-auth`
     → Đã cấu hình đúng, kiểm tra các bước tiếp theo

**Nếu Request URL đang trỏ đến Vercel domain:**

1. Vào **Vercel Dashboard** > Project của bạn > **Settings** > **Environment Variables**
2. Kiểm tra xem có biến `NEXT_PUBLIC_API_URL` không
3. Nếu chưa có, thêm mới với giá trị là URL backend của bạn (ví dụ: `https://api.yourdomain.com`)
4. **QUAN TRỌNG**: Sau khi thêm/sửa, phải **Redeploy** project (Vercel không tự động redeploy khi thêm env vars)
   - Vào tab **Deployments**
   - Click vào deployment mới nhất
   - Click nút **Redeploy** hoặc tạo một commit mới để trigger deployment

### 4. Test Sau Khi Deploy

1. Mở DevTools > Network tab
2. Thử đăng nhập
3. Kiểm tra xem cookies (`accessToken`, `refreshToken`) có được set không
4. Kiểm tra request headers có gửi cookies không

### 5. Troubleshooting

#### Nếu vẫn gặp lỗi "Token không được cung cấp":

**Bước 1: Kiểm tra NEXT_PUBLIC_API_URL (QUAN TRỌNG NHẤT)**

1. Vào Vercel Dashboard > Project > Settings > Environment Variables
2. Kiểm tra xem `NEXT_PUBLIC_API_URL` có được set không
3. Nếu có, kiểm tra giá trị có đúng không (phải là URL backend, không phải Vercel URL)
4. **Redeploy** sau khi thêm/sửa env vars (Vercel không tự động redeploy)

**Bước 2: Kiểm tra Request URL trong Network Tab**

1. Mở DevTools > Network
2. Tìm request `check-auth`
3. Xem Request URL:
   - ❌ Nếu là `https://giasu-reviews.vercel.app/api/...` → `NEXT_PUBLIC_API_URL` chưa được set
   - ✅ Nếu là `https://your-backend.com/api/...` → Đã đúng, kiểm tra bước tiếp theo

**Bước 3: Kiểm tra CORS**

- Xem console log của backend để xem origin nào bị block
- Đảm bảo Vercel URL được thêm vào `CLIENT_URL` trong backend env vars

**Bước 4: Kiểm tra Cookies**

- Cookies chỉ hoạt động với HTTPS trong production
- Đảm bảo cả front-end và back-end đều dùng HTTPS
- Xem Application > Cookies trong DevTools để xem cookies có được set không

**Bước 5: Kiểm tra Network Headers**

- Xem request có gửi `credentials: include` không (trong Request Headers)
- Xem response có set cookies không (trong Response Headers, tìm `Set-Cookie`)

**Bước 6: Test với Postman/Thunder Client**

- Thử gọi API trực tiếp để xem backend có hoạt động không
- Test endpoint: `GET https://your-backend.com/api/admin/check-auth` với cookies

### 6. Cấu Hình Cho Preview Deployments

Nếu bạn muốn preview deployments cũng hoạt động, thêm vào `CLIENT_URL`:

```
https://your-app.vercel.app,https://*.vercel.app
```

Hoặc thêm từng preview URL cụ thể.

## Checklist Trước Khi Deploy

- [ ] Backend đã được deploy và có HTTPS
- [ ] `CLIENT_URL` trong backend bao gồm Vercel URL
- [ ] `NEXT_PUBLIC_API_URL` trong Vercel trỏ đúng backend
- [ ] Tất cả environment variables đã được set
- [ ] Cả front-end và back-end đều dùng HTTPS
- [ ] Đã test đăng nhập và check-auth

## Lưu Ý Bảo Mật

- Không commit `.env` files
- Sử dụng strong JWT secrets
- Đảm bảo MongoDB connection string an toàn
- Sử dụng HTTPS cho tất cả connections
