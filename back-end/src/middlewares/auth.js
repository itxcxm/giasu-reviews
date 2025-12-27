import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  HTTP_STATUS,
  JWT_CONFIG,
  getCookieOptions,
} from "../utils/constants.js";

// Hàm tiện ích để lấy access token từ request.
// Ưu tiên lấy từ cookie trước, nếu không có thì lấy từ header 'Authorization'.
const getAccessToken = (req) => {
  let token = req.cookies?.accessToken;
  if (!token) {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  return token;
};

// Hàm tiện ích để thiết lập access token và refresh token vào cookie của response.
const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = getCookieOptions();
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 phút
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });
};

// Gắn thông tin người dùng vào đối tượng request để các middleware sau có thể sử dụng.
const attachUserToRequest = (req, user) => {
  req.user = user;
  req.userId = user?._id || null;
};

// Middleware xử lý xác thực chính, có thể tùy chỉnh thông qua options.
// Luồng hoạt động:
// 1. Lấy access token.
// 2. Nếu không có token: kiểm tra xem có cho phép truy cập tùy chọn không (optional).
// 3. Nếu có token: xác thực nó.
//    - Nếu hợp lệ: kiểm tra vai trò (role), gắn user vào request, và cho đi tiếp.
//    - Nếu hết hạn (expired): thử dùng refresh token.
//      - Nếu có refresh token: xác thực nó.
//        - Nếu refresh token hợp lệ: tạo cặp token mới, set vào cookie, gắn user vào request, và cho đi tiếp.
//        - Nếu refresh token không hợp lệ: từ chối truy cập.
//      - Nếu không có refresh token: từ chối truy cập.
const handleAuth = async (req, res, next, options = { optional: false, requiredRole: null }) => {
  try {
    const token = getAccessToken(req);

    // Nếu không có token
    if (!token) {
      if (options.optional) {
        attachUserToRequest(req, null); // Gắn user là null và cho qua
        return next();
      }
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Yêu cầu cần token để xác thực.",
      });
    }

    try {
      // Thử xác thực access token
      const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Token không hợp lệ, người dùng không tồn tại.",
        });
      }
      
      // Kiểm tra vai trò yêu cầu (nếu có)
      // Admin có quyền truy cập vào tất cả các route yêu cầu vai trò khác.
      if (options.requiredRole && user.role !== options.requiredRole && user.role !== "admin") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `Bạn không có quyền truy cập. Yêu cầu vai trò: ${options.requiredRole}.`,
        });
      }
      attachUserToRequest(req, user);
      return next();
    } catch (accessTokenError) {
      // Nếu access token hết hạn hoặc lỗi
      if (accessTokenError.name === "TokenExpiredError" || accessTokenError.name === "JsonWebTokenError") {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
          if (options.optional) {
            attachUserToRequest(req, null);
            return next();
          }
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: "Phiên đăng nhập đã hết hạn.",
          });
        }
        try {
          // Thử xác thực refresh token
          const decodedRefreshToken = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET);
          const user = await User.findById(decodedRefreshToken.id).select("-password");
          if (user) {
            // Kiểm tra lại vai trò với user lấy từ refresh token
            if (options.requiredRole && user.role !== options.requiredRole && user.role !== "admin") {
               return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: `Bạn không có quyền truy cập. Yêu cầu vai trò: ${options.requiredRole}.`,
              });
            }
            // Tạo cặp token mới và gửi lại cho client
            const newAccessToken = generateToken(user);
            const newRefreshToken = generateRefreshToken(user); // Tạo mới cả refresh token để tăng bảo mật
            setAuthCookies(res, newAccessToken, newRefreshToken);
            attachUserToRequest(req, user);
            return next();
          } else {
             return res.status(HTTP_STATUS.UNAUTHORIZED).json({
              success: false,
              message: "Refresh token không hợp lệ, người dùng không tồn tại.",
            });
          }
        } catch (refreshTokenError) {
          // Nếu refresh token cũng hết hạn hoặc lỗi
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
          });
        }
      } else {
        // Ném các lỗi không mong muốn khác
        throw accessTokenError;
      }
    }
  } catch (error) {
    if (options.optional) {
      attachUserToRequest(req, null);
      return next();
    }
    console.error(options.errorLogLabel || "Lỗi middleware xác thực:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi hệ thống trong quá trình xác thực.",
    });
  }
};

// Middleware yêu cầu người dùng phải là admin.
export const adminMiddleware = (req, res, next) =>
  handleAuth(req, res, next, {
    optional: false,
    requiredRole: "admin",
    errorLogLabel: "Lỗi middleware của Admin:",
  });

// Middleware yêu cầu người dùng phải có vai trò 'user'. Admin cũng được chấp nhận.
export const userMiddleware = (req, res, next) =>
  handleAuth(req, res, next, {
    optional: false,
    requiredRole: "user",
    errorLogLabel: "Lỗi middleware của User:",
  });

// Middleware yêu cầu người dùng phải đăng nhập (bất kỳ vai trò nào).
export const authMiddleware = (req, res, next) =>
  handleAuth(req, res, next, {
    optional: false,
    requiredRole: null, // Bất kỳ người dùng nào đã xác thực đều được phép
    errorLogLabel: "Lỗi middleware xác thực chung:",
  });

// Middleware xác thực tùy chọn: nếu người dùng có token hợp lệ, `req.user` sẽ được gắn.
// Nếu không, vẫn cho qua nhưng `req.user` sẽ là null. Hữu ích cho các route công khai có thể hiển thị thêm thông tin cho người dùng đã đăng nhập.
export const optionalAuthMiddleware = (req, res, next) =>
  handleAuth(req, res, next, {
    optional: true,
    errorLogLabel: "Lỗi middleware xác thực tùy chọn:",
  });

// Hàm tạo access token.
export const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
  });
};

// Hàm tạo refresh token.
export const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
  });
};

// Hàm xác minh một token bất kỳ.
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.SECRET); // Lưu ý: SECRET này có thể cần thay đổi tùy theo loại token
  } catch (error) {
    throw error;
  }
};

