# Hướng Dẫn Debug Cookie Issues

## Vấn Đề: Cookie được set nhưng không được gửi lại

Khi cookie đã được set nhưng không được gửi lại trong các request tiếp theo, có thể do các nguyên nhân sau:

## Các Nguyên Nhân Phổ Biến

### 1. SameSite và Secure Settings

**Vấn đề:** Khi `sameSite: "none"`, browser **BẮT BUỘC** phải có `secure: true` (HTTPS).

**Giải pháp:** Đảm bảo:
- Backend đang chạy trên HTTPS
- Cookie options có `secure: true` khi `sameSite: "none"`

### 2. Domain Mismatch

**Vấn đề:** Cookie được set từ domain A nhưng request được gửi từ domain B.

**Kiểm tra:**
1. Mở DevTools > Application > Cookies
2. Xem domain của cookie `accessToken` và `refreshToken`
3. So sánh với domain của request trong Network tab

**Giải pháp:** 
- Không set `domain` trong cookie options (để browser tự động set)
- Đảm bảo frontend và backend có thể giao tiếp cross-domain

### 3. Path Mismatch

**Vấn đề:** Cookie được set với path `/api` nhưng request đến `/admin`.

**Giải pháp:** Set `path: "/"` trong cookie options (đã được thêm vào code)

### 4. Browser Blocking Third-Party Cookies

**Vấn đề:** Một số browser (Safari, Chrome với strict settings) block third-party cookies.

**Kiểm tra:**
1. Chrome: Settings > Privacy and security > Cookies and other site data
2. Safari: Preferences > Privacy > Cookies and website data

**Giải pháp:** 
- Sử dụng `sameSite: "none"` và `secure: true`
- Đảm bảo cả frontend và backend đều dùng HTTPS

## Cách Debug

### Bước 1: Kiểm Tra Cookie Được Set

1. Mở DevTools > Application > Cookies
2. Tìm domain của backend
3. Kiểm tra xem có cookies `accessToken` và `refreshToken` không
4. Xem các attributes:
   - **HttpOnly**: ✅ (phải có)
   - **Secure**: ✅ (phải có nếu sameSite: "none")
   - **SameSite**: `None` hoặc `Lax`
   - **Path**: `/`
   - **Domain**: (không có hoặc domain của backend)

### Bước 2: Kiểm Tra Request Headers

1. Mở DevTools > Network
2. Tìm request `check-auth`
3. Xem **Request Headers**:
   - Tìm `Cookie:` header
   - Kiểm tra xem có `accessToken=...` và `refreshToken=...` không

**Nếu không có Cookie header:**
- Cookie không được gửi từ browser
- Có thể do SameSite/Secure settings
- Có thể do browser blocking third-party cookies

### Bước 3: Kiểm Tra Response Headers

1. Trong Network tab, xem request login
2. Xem **Response Headers**:
   - Tìm `Set-Cookie:` headers
   - Kiểm tra attributes của cookies

**Ví dụ Set-Cookie header đúng:**
```
Set-Cookie: accessToken=xxx; Path=/; HttpOnly; Secure; SameSite=None
Set-Cookie: refreshToken=xxx; Path=/; HttpOnly; Secure; SameSite=None
```

### Bước 4: Kiểm Tra Backend Logs

Nếu đã set `DEBUG=true` trong backend env vars, bạn sẽ thấy logs:
```
Auth Middleware - Request cookies: { accessToken: '...', refreshToken: '...' }
Auth Middleware - Request origin: https://your-vercel-app.vercel.app
```

**Nếu cookies là `{}`:**
- Cookies không được gửi từ frontend
- Kiểm tra lại CORS và cookie settings

### Bước 5: Test Với Postman/Thunder Client

1. Đăng nhập qua Postman
2. Copy cookies từ response
3. Gửi request `check-auth` với cookies đó
4. Nếu hoạt động → Vấn đề ở frontend/browser
5. Nếu không hoạt động → Vấn đề ở backend

## Giải Pháp Đã Được Áp Dụng

### 1. Cải Thiện Cookie Options

```javascript
{
  httpOnly: true,
  secure: true, // Bắt buộc khi sameSite: "none"
  sameSite: "none", // Cho phép cross-domain
  path: "/", // Hoạt động trên tất cả paths
  // Không set domain để browser tự động set
}
```

### 2. Thêm Logging

- Log cookies khi nhận request
- Log origin để debug CORS
- Log khi không tìm thấy token

### 3. Cải Thiện CORS

- Expose `Set-Cookie` header
- Đảm bảo `credentials: true`

## Checklist Debug

- [ ] Backend đang chạy trên HTTPS
- [ ] Frontend đang chạy trên HTTPS
- [ ] Cookie có `Secure: true` khi `SameSite: None`
- [ ] Cookie có `Path: /`
- [ ] Cookie không có `Domain` attribute (hoặc domain đúng)
- [ ] CORS có `credentials: true`
- [ ] `CLIENT_URL` trong backend bao gồm frontend URL
- [ ] Browser không block third-party cookies
- [ ] Request có gửi `Cookie` header trong Request Headers
- [ ] Response có `Set-Cookie` header trong Response Headers

## Test Nhanh

1. **Đăng nhập:**
   - Mở DevTools > Network
   - Đăng nhập
   - Xem response của `/api/admin/login`
   - Kiểm tra `Set-Cookie` headers

2. **Kiểm tra Cookie:**
   - DevTools > Application > Cookies
   - Tìm domain backend
   - Xem cookies có được set không

3. **Test Request:**
   - Gọi `/api/admin/check-auth`
   - Xem Request Headers có `Cookie:` không
   - Xem Response có lỗi không

## Nếu Vẫn Không Hoạt Động

1. **Thử với Postman:**
   - Đăng nhập qua Postman
   - Copy cookies
   - Test `check-auth` với cookies đó

2. **Kiểm Tra Browser Console:**
   - Xem có warnings về cookies không
   - Xem có CORS errors không

3. **Kiểm Tra Backend Logs:**
   - Set `DEBUG=true` trong backend env
   - Xem logs khi nhận request
   - Kiểm tra cookies có được nhận không

4. **Thử Browser Khác:**
   - Chrome
   - Firefox
   - Safari (có thể có vấn đề với third-party cookies)

5. **Kiểm Tra Network:**
   - Xem request có `credentials: include` không
   - Xem response có `Access-Control-Allow-Credentials: true` không

