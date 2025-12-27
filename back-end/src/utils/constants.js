// Tập hợp các mã trạng thái HTTP thường dùng để mã nguồn rõ ràng và dễ bảo trì.
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// Cấu hình cho JSON Web Token (JWT), lấy từ biến môi trường hoặc dùng giá trị mặc định.
export const JWT_CONFIG = {
  // Khóa bí mật để ký và xác thực Access Token.
  ACCESS_TOKEN_SECRET: process.env.JWT_SECRET || "your-secret-key",
  // Khóa bí mật riêng cho Refresh Token để tăng cường bảo mật.
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
  // Thời gian hết hạn của Access Token (mặc định 15 phút).
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  // Thời gian hết hạn của Refresh Token (mặc định 7 ngày).
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

// Hàm này tạo ra các tùy chọn (options) cho việc thiết lập cookie một cách linh động
// tùy thuộc vào môi trường hoạt động (production/development) và cấu hình cross-domain.
export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Kiểm tra xem biến môi trường CLIENT_URL có được thiết lập hay không.
  // Điều này thường chỉ ra rằng frontend và backend đang ở hai domain khác nhau.
  const hasClientUrl = process.env.CLIENT_URL && process.env.CLIENT_URL.trim() !== "";

  // Giả định là cross-domain nếu đang ở môi trường production VÀ có CLIENT_URL.
  // Ở đây, `|| true` được thêm vào để mặc định coi môi trường production là cross-domain
  // cho an toàn, vì các nền tảng như Vercel thường triển khai frontend và backend trên các subdomain khác nhau.
  const isCrossDomain = isProduction && (hasClientUrl || true); 

  // Xác định giá trị cho thuộc tính `sameSite` của cookie.
  // - "none": Cần thiết cho các kịch bản cross-domain để trình duyệt gửi cookie kèm theo request.
  // - "lax": Một giá trị cân bằng, an toàn cho môi trường production same-site và development.
  const sameSiteValue = isCrossDomain ? "none" : "lax";

  // Xác định giá trị cho thuộc tính `secure`.
  // Thuộc tính này yêu cầu trình duyệt chỉ gửi cookie qua kết nối HTTPS.
  // BẮT BUỘC phải là `true` khi `sameSite` là "none".
  const secureValue = isProduction || sameSiteValue === "none";

  const options = {
    httpOnly: true, // Ngăn không cho JavaScript phía client truy cập vào cookie, giúp chống lại tấn công XSS.
    secure: secureValue,
    sameSite: sameSiteValue,
    path: "/", // Cookie sẽ được áp dụng cho tất cả các đường dẫn trên domain.
  };

  // Log các tùy chọn cookie ra console nếu đang ở môi trường development hoặc khi biến DEBUG_COOKIES được bật.
  // Rất hữu ích cho việc gỡ lỗi các vấn đề liên quan đến cookie.
  if (process.env.NODE_ENV === "development" || process.env.DEBUG_COOKIES === "true") {
    console.log("Thông tin cấu hình Cookie:", {
      isProduction,
      hasClientUrl,
      isCrossDomain,
      sameSiteValue,
      secureValue,
      options,
    });
  }

  return options;
};
