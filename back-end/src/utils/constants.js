// HTTP Status Codes
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

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "your-secret-key",
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

// Cookie Options
export const getCookieOptions = () => {
  // Trong production, nếu front-end và back-end ở domain khác nhau, cần sameSite: "none" và secure: true
  const isProduction = process.env.NODE_ENV === "production";
  const isCrossDomain =
    process.env.CLIENT_URL && process.env.CLIENT_URL.includes("https://");

  // Khi sameSite: "none", BẮT BUỘC phải có secure: true
  const sameSiteValue = isProduction && isCrossDomain ? "none" : "lax";
  const secureValue = isProduction || sameSiteValue === "none"; // Secure bắt buộc khi sameSite: "none"

  return {
    httpOnly: true,
    secure: secureValue, // Secure bắt buộc khi sameSite: "none" hoặc production
    sameSite: sameSiteValue, // "none" cho cross-domain, "lax" cho same-site
    path: "/", // Cookie hoạt động trên tất cả paths
    // Không set domain để cookie hoạt động với domain hiện tại
    // Domain sẽ tự động được set bởi browser dựa trên domain của response
  };
};
