# Hướng Dẫn Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` trong thư mục `back-end/` với nội dung sau:

```env
# ============================================
# MÔI TRƯỜNG ỨNG DỤNG
# ============================================
# Môi trường chạy: development, production, test
NODE_ENV=development

# ============================================
# CẤU HÌNH SERVER
# ============================================
# Cổng chạy server (mặc định: 3000)
PORT=3000

# URL của client (front-end) - có thể nhiều URL, phân cách bằng dấu phẩy
# Ví dụ: CLIENT_URL=http://localhost:3000,http://localhost:5173
CLIENT_URL=http://localhost:3000,http://localhost:5173

# ============================================
# CẤU HÌNH DATABASE
# ============================================
# MongoDB Connection String
# Format: mongodb://[username:password@]host[:port][/database][?options]
# Ví dụ local: mongodb://localhost:27017/giasu-reviews
# Ví dụ MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/giasu-reviews
MONGODB_URI=mongodb://localhost:27017/giasu-reviews

# ============================================
# CẤU HÌNH JWT (JSON Web Token)
# ============================================
# Secret key để ký JWT token (NÊN THAY ĐỔI trong production)
# Sử dụng lệnh sau để tạo secret key ngẫu nhiên:
# openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Secret key để ký Refresh Token (NÊN THAY ĐỔI trong production)
# Sử dụng lệnh sau để tạo secret key ngẫu nhiên:
# openssl rand -base64 32
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Thời gian hết hạn của Access Token (mặc định: 15m = 15 phút)
# Format: số + đơn vị (s = giây, m = phút, h = giờ, d = ngày)
# Ví dụ: 15m, 1h, 30d
JWT_EXPIRES_IN=15m

# Thời gian hết hạn của Refresh Token (mặc định: 7d = 7 ngày)
# Format: số + đơn vị (s = giây, m = phút, h = giờ, d = ngày)
# Ví dụ: 7d, 30d, 90d
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# CẤU HÌNH UPLOAD ẢNH (UPANHNHANH.COM)
# ============================================
# Base URL của API (mặc định: https://upanhnhanh.com/api/v1)
# Lưu ý: Không thêm dấu / ở cuối URL
# Nếu không cấu hình, sẽ dùng giá trị mặc định
APIURL=https://upanhnhanh.com/api/v1

# API Key để xác thực khi upload ảnh
# Lấy từ tài khoản của bạn trên upanhnhanh.com
# Xem hướng dẫn tại: https://upanhnhanh.com/api-docs
# Lưu ý: Giữ bí mật API key, không commit lên Git
APIKEY=your-api-key-here
```

## Giải Thích Các Biến Môi Trường

### NODE_ENV

- **Mô tả**: Môi trường chạy ứng dụng
- **Giá trị**: `development`, `production`, hoặc `test`
- **Mặc định**: `development`

### PORT

- **Mô tả**: Cổng mà server sẽ lắng nghe
- **Mặc định**: `3000`

### CLIENT_URL

- **Mô tả**: URL của front-end được phép truy cập API (CORS)
- **Format**: Nhiều URL phân cách bằng dấu phẩy
- **Ví dụ**: `http://localhost:3000,http://localhost:5173`

### MONGODB_URI

- **Mô tả**: Connection string để kết nối MongoDB
- **Format**: `mongodb://[username:password@]host[:port][/database][?options]`
- **Ví dụ local**: `mongodb://localhost:27017/giasu-reviews`
- **Ví dụ MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/giasu-reviews`

### JWT_SECRET

- **Mô tả**: Secret key để ký và xác thực JWT Access Token
- **Bảo mật**: ⚠️ **QUAN TRỌNG** - Phải thay đổi trong production!
- **Tạo secret key**: `openssl rand -base64 32`

### JWT_REFRESH_SECRET

- **Mô tả**: Secret key để ký và xác thực JWT Refresh Token
- **Bảo mật**: ⚠️ **QUAN TRỌNG** - Phải thay đổi trong production!
- **Tạo secret key**: `openssl rand -base64 32`

### JWT_EXPIRES_IN

- **Mô tả**: Thời gian hết hạn của Access Token
- **Format**: Số + đơn vị (s = giây, m = phút, h = giờ, d = ngày)
- **Mặc định**: `15m` (15 phút)
- **Ví dụ**: `15m`, `1h`, `30d`

### JWT_REFRESH_EXPIRES_IN

- **Mô tả**: Thời gian hết hạn của Refresh Token
- **Format**: Số + đơn vị (s = giây, m = phút, h = giờ, d = ngày)
- **Mặc định**: `7d` (7 ngày)
- **Ví dụ**: `7d`, `30d`, `90d`

### APIURL

- **Mô tả**: Base URL của API upload ảnh từ upanhnhanh.com
- **Format**: URL đầy đủ của API base (không có dấu / ở cuối)
- **Mặc định**: `https://upanhnhanh.com/api/v1` (nếu không cấu hình)
- **Ví dụ**: `https://upanhnhanh.com/api/v1`
- **Lưu ý**:
  - API sẽ tự động thêm `/upload` vào endpoint
  - Xem tài liệu API tại https://upanhnhanh.com/api-docs

### APIKEY

- **Mô tả**: API Key để xác thực khi upload ảnh lên upanhnhanh.com
- **Lấy API Key**: Đăng nhập vào tài khoản trên upanhnhanh.com và lấy từ phần API Settings
- **Bảo mật**: ⚠️ **QUAN TRỌNG** - Không chia sẻ API Key với bất kỳ ai, không commit lên Git
- **Sử dụng**: API key sẽ được gửi qua HTTP Header `X-API-Key`

## Cách Tạo Secret Key Bảo Mật

### Trên Windows (PowerShell):

```powershell
# Tạo JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Hoặc sử dụng OpenSSL nếu đã cài đặt
openssl rand -base64 32
```

### Trên Linux/Mac:

```bash
# Tạo JWT_SECRET
openssl rand -base64 32

# Tạo JWT_REFRESH_SECRET
openssl rand -base64 32
```

## Lưu Ý Bảo Mật

1. ⚠️ **KHÔNG** commit file `.env` lên Git (đã được thêm vào `.gitignore`)
2. ⚠️ Sử dụng secret key **khác nhau** cho `JWT_SECRET` và `JWT_REFRESH_SECRET`
3. ⚠️ Trong production, sử dụng secret key **mạnh và ngẫu nhiên**
4. ⚠️ Không chia sẻ file `.env` hoặc secret key với bất kỳ ai
5. ⚠️ Sử dụng biến môi trường của hosting service (Heroku, Vercel, AWS, etc.) trong production

## Kiểm Tra Cấu Hình

Sau khi tạo file `.env`, khởi động lại server để áp dụng các thay đổi:

```bash
npm run dev
```

Server sẽ tự động load các biến môi trường từ file `.env`.
