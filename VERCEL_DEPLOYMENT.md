# Hướng Dẫn Deploy Lên Vercel

## Vấn Đề: Lỗi "Token không được cung cấp"

Khi deploy lên Vercel, bạn có thể gặp lỗi `{success: false, message: "Token không được cung cấp"}` khi gọi API `check-auth`. Đây là vấn đề về cookie và CORS configuration.

## Giải Pháp

### 1. Cấu Hình Environment Variables Trên Vercel

Vào **Settings > Environment Variables** trong Vercel dashboard và thêm:

#### Front-end (Vercel):

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

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

### 3. Kiểm Tra API URL

Đảm bảo `NEXT_PUBLIC_API_URL` trong Vercel trỏ đúng đến backend server của bạn.

### 4. Test Sau Khi Deploy

1. Mở DevTools > Network tab
2. Thử đăng nhập
3. Kiểm tra xem cookies (`accessToken`, `refreshToken`) có được set không
4. Kiểm tra request headers có gửi cookies không

### 5. Troubleshooting

#### Nếu vẫn gặp lỗi "Token không được cung cấp":

1. **Kiểm tra CORS:**

   - Xem console log của backend để xem origin nào bị block
   - Đảm bảo Vercel URL được thêm vào `CLIENT_URL`

2. **Kiểm tra Cookies:**

   - Cookies chỉ hoạt động với HTTPS trong production
   - Đảm bảo cả front-end và back-end đều dùng HTTPS

3. **Kiểm tra Network:**

   - Xem request có gửi `credentials: include` không
   - Xem response có set cookies không

4. **Test với Postman/Thunder Client:**
   - Thử gọi API trực tiếp để xem backend có hoạt động không

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
