# Hướng dẫn Debug Cookies trên Vercel

## Vấn đề: Cookies không được set sau khi đăng nhập

### Nguyên nhân có thể:

1. **CLIENT_URL chưa được cấu hình đúng trên Vercel**
2. **Cookies bị browser reject do sameSite/secure settings**
3. **Vercel serverless functions xử lý cookies khác với Express thông thường**

## Các bước kiểm tra:

### 1. Kiểm tra Environment Variables trên Vercel Backend

Đảm bảo các biến sau được set trong Vercel Dashboard > Settings > Environment Variables:

```
CLIENT_URL=https://giasu-mu.vercel.app
NODE_ENV=production
```

**QUAN TRỌNG**: `CLIENT_URL` phải là domain của frontend (không có trailing slash)

### 2. Kiểm tra CORS Configuration

Trong `back-end/src/app.js`, CORS đã được cấu hình với:

- `credentials: true` ✅
- `exposedHeaders: ["Set-Cookie"]` ✅

### 3. Kiểm tra Cookie Options

Cookies sẽ được set với:

- `sameSite: "none"` (trong production với cross-domain)
- `secure: true` (bắt buộc khi sameSite: "none")
- `httpOnly: true`

### 4. Enable Debug Logging

Thêm biến môi trường trên Vercel để xem logs:

```
DEBUG_COOKIES=true
```

Sau đó kiểm tra Vercel logs để xem:

- Cookie options được sử dụng
- CLIENT_URL value
- Set-Cookie headers

### 5. Kiểm tra Browser Console

Mở Browser DevTools > Network tab:

1. Xem request đến `/api/admin/login`
2. Kiểm tra Response Headers có `Set-Cookie` không
3. Nếu không có, cookies không được set bởi server
4. Nếu có nhưng bị reject, kiểm tra cookie attributes

### 6. Kiểm tra Browser Cookie Settings

Trong DevTools > Application > Cookies:

- Kiểm tra xem cookies có được lưu không
- Kiểm tra domain của cookies (phải là domain của backend)
- Kiểm tra attributes (SameSite, Secure, HttpOnly)

## Giải pháp thay thế nếu cookies vẫn không hoạt động:

### Option 1: Sử dụng localStorage + Authorization header

Thay vì cookies, lưu token trong localStorage và gửi qua Authorization header.

### Option 2: Sử dụng cùng domain

Deploy frontend và backend trên cùng domain (subdomain) để tránh cross-domain issues.

### Option 3: Sử dụng Vercel Proxy

Cấu hình Vercel rewrites để proxy API requests, giúp cookies hoạt động như same-origin.

## Test sau khi fix:

1. Đăng nhập thành công
2. Kiểm tra cookies trong DevTools
3. Reload trang - cookies vẫn còn
4. Chuyển trang - cookies vẫn còn
5. Truy cập `/admin` - không bị redirect về login
