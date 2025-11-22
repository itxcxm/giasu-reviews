import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { HTTP_STATUS, JWT_CONFIG } from "../utils/constants.js";

/**
 * Middleware để kiểm tra xem request có phải từ admin không
 * Set req.isAdmin = true nếu là admin, false nếu không (không throw error)
 * Middleware này nên được đặt trước rate limiter
 */
export const checkAdminForRateLimit = async (req, res, next) => {
  try {
    // Lấy token từ cookie hoặc header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // Nếu không có token, không phải admin
    if (!token) {
      req.isAdmin = false;
      return next();
    }

    try {
      // Xác thực token
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);

      // Tìm admin trong DB
      const admin = await Admin.findById(decoded.id).select("-password");

      // Kiểm tra admin tồn tại và có role là admin và isActive
      if (admin && admin.role === "admin" && admin.isActive === true) {
        req.isAdmin = true;
      } else {
        req.isAdmin = false;
      }

      return next();
    } catch (tokenError) {
      // Nếu token hết hạn, thử refresh token
      if (tokenError.name === "TokenExpiredError") {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
          req.isAdmin = false;
          return next();
        }

        try {
          const decodedRefresh = jwt.verify(
            refreshToken,
            JWT_CONFIG.REFRESH_SECRET
          );
          const admin = await Admin.findById(decodedRefresh.id).select(
            "-password"
          );

          if (admin && admin.role === "admin" && admin.isActive === true) {
            req.isAdmin = true;
          } else {
            req.isAdmin = false;
          }

          return next();
        } catch (refreshError) {
          req.isAdmin = false;
          return next();
        }
      }

      req.isAdmin = false;
      return next();
    }
  } catch (error) {
    // Bất kỳ lỗi nào cũng set isAdmin = false
    req.isAdmin = false;
    return next();
  }
};

/**
 * Rate limiter cho việc tạo center mới
 * Giới hạn: 5 requests mỗi 15 phút từ mỗi IP
 */
export const createCenterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 requests trong 15 phút
  message: {
    success: false,
    message: "Quá nhiều yêu cầu tạo trung tâm. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true, // Trả về rate limit info trong headers `RateLimit-*`
  legacyHeaders: false, // Tắt `X-RateLimit-*` headers
  // Lấy IP từ request (hỗ trợ proxy/load balancer)
  keyGenerator: (req) => {
    // Ưu tiên lấy IP từ header nếu có (khi đứng sau proxy)
    return (
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.headers["x-real-ip"] ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown"
    );
  },
  // Custom handler khi vượt quá giới hạn
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Quá nhiều yêu cầu tạo trung tâm. Vui lòng thử lại sau 15 phút.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000), // Thời gian còn lại (giây)
    });
  },
  // Bỏ qua rate limit nếu là admin hoặc trong môi trường test
  skip: (req) => {
    // Bỏ qua trong môi trường test
    if (process.env.NODE_ENV === "test") {
      return true;
    }

    // Bỏ qua nếu là admin đã đăng nhập (đã được set bởi checkAdminForRateLimit middleware)
    return req.isAdmin === true;
  },
});

/**
 * Rate limiter cho việc thêm review
 * Giới hạn: 1 request mỗi 1 giờ từ mỗi IP
 */
export const addReviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 1, // Tối đa 1 review trong 1 giờ
  message: {
    success: false,
    message: "Bạn chỉ có thể thêm 1 đánh giá mỗi giờ. Vui lòng thử lại sau.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.headers["x-real-ip"] ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown"
    );
  },
  handler: (req, res) => {
    // Tính thời gian còn lại đến khi reset (phút)
    const resetTime = new Date(req.rateLimit.resetTime);
    const now = new Date();
    const minutesRemaining = Math.ceil((resetTime - now) / (1000 * 60));

    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: `Bạn chỉ có thể thêm 1 đánh giá mỗi giờ. Vui lòng thử lại sau ${minutesRemaining} phút.`,
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      resetTime: resetTime.toISOString(),
    });
  },
  skip: (req) => {
    // Bỏ qua trong môi trường test
    if (process.env.NODE_ENV === "test") {
      return true;
    }

    // Bỏ qua nếu là admin đã đăng nhập (đã được set bởi checkAdminForRateLimit middleware)
    return req.isAdmin === true;
  },
});
