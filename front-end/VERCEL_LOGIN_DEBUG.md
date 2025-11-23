# Hướng dẫn Debug Lỗi Đăng Nhập trên Vercel

## 🔍 Checklist Kiểm Tra

### 1. Environment Variables trên Vercel Frontend

Vào **Vercel Dashboard > Frontend Project > Settings > Environment Variables**, đảm bảo có:

```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
JWT_SECRET=<giá trị giống với backend>
NODE_ENV=production
```

**QUAN TRỌNG**: 
- `NEXT_PUBLIC_API_URL` phải là URL đầy đủ của backend (có `https://`)
- `JWT_SECRET` phải giống với backend

### 2. Environment Variables trên Vercel Backend

Vào **Vercel Dashboard > Backend Project > Settings > Environment Variables**, đảm bảo có:

```
CLIENT_URL=https://your-frontend.vercel.app
JWT_SECRET=<giá trị giống với frontend>
JWT_REFRESH_SECRET=<giá trị refresh secret>
NODE_ENV=production
MONGODB_URI=<your-mongodb-uri>
```

**QUAN TRỌNG**:
- `CLIENT_URL` phải là URL đầy đủ của frontend (không có trailing slash `/`)
- Ví dụ: `https://giasu-mu.vercel.app` (KHÔNG phải `https://giasu-mu.vercel.app/`)

### 3. Kiểm Tra trong Browser DevTools

#### A. Network Tab - Request Login

1. Mở DevTools > Network tab
2. Đăng nhập
3. Tìm request `login` (POST request đến `/api/admin/login`)
4. Kiểm tra:

**Request Headers:**
- ✅ Có `Cookie` header (nếu có cookies cũ)
- ✅ `Origin: https://your-frontend.vercel.app`
- ✅ `Referer: https://your-frontend.vercel.app/login`

**Response Headers:**
- ✅ Có `Set-Cookie` header với `accessToken` và `refreshToken`
- ✅ `Access-Control-Allow-Origin: https://your-frontend.vercel.app`
- ✅ `Access-Control-Allow-Credentials: true`
- ✅ `Access-Control-Expose-Headers: Set-Cookie`

**Response Body:**
- ✅ `success: true`
- ✅ `message: "Đăng nhập thành công"`

#### B. Application Tab - Cookies

1. Mở DevTools > Application tab > Cookies
2. Kiểm tra domain của frontend (ví dụ: `giasu-mu.vercel.app`)
3. Sau khi đăng nhập, phải có:
   - ✅ `accessToken` (HttpOnly, Secure, SameSite=None)
   - ✅ `refreshToken` (HttpOnly, Secure, SameSite=None)

**Nếu không thấy cookies:**
- Cookies có thể bị reject do `SameSite` hoặc `Secure` settings
- Kiểm tra Console tab xem có warning về cookies không

#### C. Console Tab

Kiểm tra xem có lỗi nào không:
- ❌ CORS errors
- ❌ Cookie warnings
- ❌ Network errors
- ❌ API connection errors

### 4. Kiểm Tra Vercel Logs

#### Frontend Logs:
1. Vào Vercel Dashboard > Frontend Project > Logs
2. Tìm các lỗi liên quan đến:
   - API connection
   - Environment variables
   - Build errors

#### Backend Logs:
1. Vào Vercel Dashboard > Backend Project > Logs
2. Khi đăng nhập, kiểm tra:
   - Request có đến được backend không
   - Cookies có được nhận không
   - Response có set cookies không

### 5. Test API Trực Tiếp

Sử dụng curl hoặc Postman để test:

```bash
# Test login endpoint
curl -X POST https://your-backend.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-frontend.vercel.app" \
  -d '{"email":"your-email","password":"your-password"}' \
  -v

# Kiểm tra response headers, đặc biệt là Set-Cookie
```

### 6. Kiểm Tra Cookie Settings

Trong `back-end/src/utils/constants.js`, hàm `getCookieOptions()` phải trả về:

```javascript
{
  httpOnly: true,
  secure: true,        // Bắt buộc trong production
  sameSite: "none",    // Cho cross-domain
  path: "/"
}
```

**Lưu ý**: 
- `sameSite: "none"` BẮT BUỘC phải có `secure: true`
- Trong production với cross-domain, luôn dùng `sameSite: "none"`

### 7. Kiểm Tra CORS Configuration

Trong `back-end/src/app.js`, CORS phải có:

```javascript
cors({
  origin: function (origin, callback) {
    // Cho phép origin của frontend
    callback(null, true);
  },
  credentials: true,  // QUAN TRỌNG: Cho phép cookies
  exposedHeaders: ["Set-Cookie"]  // Expose Set-Cookie header
})
```

## 🐛 Các Lỗi Thường Gặp

### Lỗi 1: Cookies không được set

**Nguyên nhân:**
- `CLIENT_URL` chưa được set hoặc sai
- `sameSite` không phải `"none"` trong production
- `secure` không phải `true`

**Giải pháp:**
1. Kiểm tra `CLIENT_URL` trên Vercel backend
2. Đảm bảo `getCookieOptions()` trả về `sameSite: "none"` và `secure: true` trong production

### Lỗi 2: CORS Error

**Nguyên nhân:**
- Frontend origin không được phép trong CORS
- `credentials: true` chưa được set

**Giải pháp:**
1. Kiểm tra `CLIENT_URL` trên Vercel backend
2. Đảm bảo CORS có `credentials: true`

### Lỗi 3: Token không được verify

**Nguyên nhân:**
- `JWT_SECRET` khác nhau giữa frontend và backend
- Token không được gửi trong cookies

**Giải pháp:**
1. Đảm bảo `JWT_SECRET` giống nhau trên cả frontend và backend
2. Kiểm tra cookies có được gửi trong request không

### Lỗi 4: API không kết nối được

**Nguyên nhân:**
- `NEXT_PUBLIC_API_URL` chưa được set
- URL sai format

**Giải pháp:**
1. Kiểm tra `NEXT_PUBLIC_API_URL` trên Vercel frontend
2. Đảm bảo URL có `https://` và đúng format

## 🔧 Debug Steps

1. **Kiểm tra Environment Variables** trên cả frontend và backend
2. **Test API trực tiếp** bằng curl/Postman
3. **Kiểm tra Network tab** trong DevTools khi đăng nhập
4. **Kiểm tra Cookies** trong Application tab
5. **Xem Vercel Logs** để tìm lỗi
6. **Test lại** sau mỗi lần sửa

## 📝 Notes

- Sau khi thay đổi Environment Variables, cần **redeploy** cả frontend và backend
- Cookies với `sameSite: "none"` chỉ hoạt động trên HTTPS
- Vercel tự động dùng HTTPS, nên không cần lo về secure

