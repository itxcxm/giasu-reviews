# 🚀 Hướng Dẫn Deploy Lên Vercel

## 📋 Yêu Cầu Trước Khi Deploy

### 1. Environment Variables (BẮT BUỘC)

Trong Vercel Dashboard, bạn **PHẢI** set các environment variables sau:

#### **NEXT_PUBLIC_API_URL** (BẮT BUỘC)

- **Giá trị**: URL của backend API (ví dụ: `https://api.yourdomain.com`)
- **Lưu ý**:
  - Phải có protocol (`http://` hoặc `https://`)
  - KHÔNG có dấu `/` ở cuối
  - Phải là HTTPS trong production

**Cách set:**

1. Vào Vercel Dashboard > Project Settings > Environment Variables
2. Thêm biến:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-api.com`
   - **Environment**: Chọn tất cả (Production, Preview, Development)
3. Click "Save"
4. **Redeploy** project để áp dụng

### 2. Các Environment Variables Khác (Tùy chọn)

- `NEXT_PUBLIC_SITE_URL`: URL của website (dùng cho metadata)
- `API_URL`: Fallback cho server-side rendering (thường không cần)

## 🔧 Các Tối Ưu Đã Áp Dụng

### ✅ API Client

- Timeout tăng lên 30 giây (phù hợp với Vercel)
- Error handling tốt hơn cho production
- Tự động validate API URL
- Logging chỉ trong development

### ✅ Next.js Config

- Image optimization (Vercel tự động optimize)
- Security headers
- Compression enabled
- Console logs được remove trong production (trừ error/warn)
- TypeScript và ESLint checks enabled

### ✅ Middleware

- Chạy trên Edge Runtime (nhanh hơn)
- Chỉ chạy cho routes cần thiết (tối ưu performance)
- Cookie-based authentication

### ✅ Build Optimizations

- SWC minification
- React Strict Mode
- AVIF và WebP image formats

## 📝 Checklist Trước Khi Deploy

- [ ] Set `NEXT_PUBLIC_API_URL` trong Vercel Environment Variables
- [ ] Đảm bảo backend API đã deploy và accessible
- [ ] Kiểm tra CORS settings trên backend (phải cho phép Vercel domain)
- [ ] Test build local: `npm run build`
- [ ] Kiểm tra không có lỗi TypeScript: `npm run typecheck`

## 🚀 Deploy Steps

### Option 1: Deploy qua Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd front-end
vercel

# Deploy production
vercel --prod
```

### Option 2: Deploy qua GitHub Integration

1. Push code lên GitHub
2. Connect repository với Vercel
3. Vercel sẽ tự động detect Next.js
4. Set environment variables trong Vercel Dashboard
5. Deploy!

## 🔍 Troubleshooting

### Lỗi: "API URL chưa được cấu hình"

**Nguyên nhân**: `NEXT_PUBLIC_API_URL` chưa được set trong Vercel
**Giải pháp**:

1. Vào Vercel Dashboard > Settings > Environment Variables
2. Thêm `NEXT_PUBLIC_API_URL` với giá trị đúng
3. Redeploy project

### Lỗi: "Không thể kết nối đến server"

**Nguyên nhân**:

- Backend chưa deploy hoặc không accessible
- CORS chưa được cấu hình đúng
- API URL sai

**Giải pháp**:

1. Kiểm tra backend đã chạy chưa
2. Kiểm tra CORS settings trên backend (phải cho phép Vercel domain)
3. Kiểm tra `NEXT_PUBLIC_API_URL` đúng chưa

### Lỗi: Cookies không hoạt động

**Nguyên nhân**:

- Backend và frontend ở domain khác nhau
- Cookie settings chưa đúng

**Giải pháp**:

1. Đảm bảo backend set cookies với `sameSite: 'none'` và `secure: true`
2. Kiểm tra backend CORS settings có `credentials: true`

### Build fails

**Nguyên nhân**: TypeScript hoặc ESLint errors
**Giải pháp**:

1. Chạy `npm run typecheck` để kiểm tra TypeScript errors
2. Chạy `npm run lint` để kiểm tra ESLint errors
3. Fix các errors trước khi deploy

## 📊 Performance Tips

1. **Image Optimization**: Vercel tự động optimize images, không cần config thêm
2. **Edge Functions**: Middleware chạy trên Edge để tối ưu latency
3. **Caching**: Vercel tự động cache static assets
4. **CDN**: Tất cả assets được serve qua Vercel CDN

## 🔒 Security

- Security headers đã được config trong `next.config.js`
- Cookies được bảo vệ với `httpOnly`, `secure`, `sameSite`
- XSS protection enabled
- Content-Type sniffing disabled

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. Vercel Build Logs
2. Browser Console (F12)
3. Network tab để xem API requests
4. Backend logs
