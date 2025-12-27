import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { HTTP_STATUS, JWT_CONFIG } from "../utils/constants.js";

// Middleware này kiểm tra xem một request có được thực hiện bởi admin hay không.
// Nó không chặn request mà chỉ gắn một cờ `req.isAdmin = true/false`.
// Mục đích là để các middleware rate limiter phía sau có thể sử dụng cờ này để bỏ qua giới hạn cho admin.
// Middleware này nên được đặt *trước* bất kỳ rate limiter nào trong chuỗi xử lý của route.
export const checkAdminForRateLimit = async (req, res, next) => {
  try {
    // Ưu tiên lấy token từ cookie, sau đó mới đến header.
    let token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      req.isAdmin = false;
      return next();
    }

    try {
      // Xác thực access token.
      const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.id).select("role isActive");

      // Nếu người dùng tồn tại, có vai trò 'admin' và tài khoản đang hoạt động.
      if (user && user.role === "admin" && user.isActive === true) {
        req.isAdmin = true;
      } else {
        req.isAdmin = false;
      }
      return next();
    } catch (tokenError) {
      // Nếu access token hết hạn, thử dùng refresh token để xác định vai trò.
      // Việc này giúp admin không bị áp dụng rate limit ngay cả khi access token vừa hết hạn
      // và đang trong quá trình được làm mới bởi middleware xác thực chính.
      if (tokenError.name === "TokenExpiredError") {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
          req.isAdmin = false;
          return next();
        }
        try {
          const decodedRefresh = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET);
          const user = await User.findById(decodedRefresh.id).select("role isActive");
          if (user && user.role === "admin" && user.isActive === true) {
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
      // Các lỗi token khác đều coi như không phải admin.
      req.isAdmin = false;
      return next();
    }
  } catch (error) {
    // Bất kỳ lỗi không mong muốn nào xảy ra cũng mặc định không phải admin và tiếp tục.
    req.isAdmin = false;
    return next();
  }
};

// Bộ giới hạn yêu cầu cho chức năng tạo trung tâm.
// Mục đích: Chống spam, ngăn người dùng tạo hàng loạt trung tâm trong thời gian ngắn.
export const createCenterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Cửa sổ thời gian là 15 phút.
  max: 30, // Mỗi địa chỉ IP được phép tối đa 30 yêu cầu trong 15 phút.
  message: {
    success: false,
    message: "Bạn đã gửi quá nhiều yêu cầu tạo trung tâm. Vui lòng thử lại sau.",
  },
  standardHeaders: true, // Bật header `RateLimit-*` theo chuẩn.
  legacyHeaders: false, // Tắt header `X-RateLimit-*` cũ.
  // Hàm xử lý khi một yêu cầu bị chặn.
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Quá nhiều yêu cầu tạo trung tâm. Vui lòng thử lại sau 15 phút.",
      // Gợi ý cho client biết cần chờ bao lâu (tính bằng giây).
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000), 
    });
  },
  // Hàm quyết định có bỏ qua giới hạn cho một yêu cầu cụ thể hay không.
  skip: (req) => {
    // Luôn bỏ qua nếu môi trường là 'test'.
    if (process.env.NODE_ENV === "test") {
      return true;
    }
    // Bỏ qua nếu cờ `isAdmin` đã được middleware `checkAdminForRateLimit` đặt thành true.
    return req.isAdmin === true;
  },
});

// Bộ giới hạn yêu cầu cho chức năng thêm đánh giá.
// Mục đích: Ngăn chặn một người dùng spam nhiều bài đánh giá liên tục.
export const addReviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // Cửa sổ thời gian là 1 giờ.
  max: 20, // Mỗi IP được phép tối đa 20 yêu cầu trong 1 giờ.
  message: {
    success: false,
    message: "Bạn chỉ có thể thêm tối đa 20 đánh giá mỗi giờ. Vui lòng thử lại sau.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Tính toán thời gian còn lại cho đến khi giới hạn được reset, trả về cho client.
    const resetTime = new Date(req.rateLimit.resetTime);
    const now = new Date();
    const minutesRemaining = Math.ceil((resetTime - now) / (1000 * 60));

    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: `Bạn đã đạt giới hạn gửi đánh giá. Vui lòng thử lại sau khoảng ${minutesRemaining} phút.`,
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      resetTime: resetTime.toISOString(),
    });
  },
  skip: (req) => {
    if (process.env.NODE_ENV === "test") {
      return true;
    }
    return req.isAdmin === true;
  },
});
