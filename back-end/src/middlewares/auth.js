// Middleware xác thực JWT token, kiểm tra token trong header/cookie, tự động refresh nếu accessToken hết hạn
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import {
  HTTP_STATUS,
  JWT_CONFIG,
  getCookieOptions,
} from "../utils/constants.js";
import { JwtService } from "../services/jwtService.js";

// Middleware xác thực JWT token
// Kiểm tra token trong cookie hoặc header Authorization, tự động refresh nếu accessToken hết hạn
export const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token truy cập từ cookie hoặc header Authorization
    let token = req.cookies.accessToken;

    // Nếu không có token trong cookie, thử lấy từ header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // Nếu không có token -> lỗi chưa xác thực
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Token không được cung cấp",
      });
    }

    try {
      // Xác thực accessToken
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);

      // Tìm user từ DB, loại trừ trường password
      const user = await User.findById(decoded.id).select("-password");

      // Không tìm thấy user
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Token không hợp lệ - User không tồn tại",
        });
      }

      // Check trạng thái tài khoản
      if (!user.isActive) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Tài khoản đã bị vô hiệu hóa",
        });
      }

      // Lưu thông tin user vào request để downstream middleware/controller dùng
      req.user = user;
      req.userId = user._id;
      next();
    } catch (accessTokenError) {
      // Nếu access token hết hạn hoặc không hợp lệ thì check refresh token
      if (
        accessTokenError.name === "TokenExpiredError" ||
        accessTokenError.name === "JsonWebTokenError"
      ) {
        // Kiểm tra refreshToken từ cookie
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: "Token đã hết hạn",
          });
        }

        try {
          // Xác thực refreshToken
          const decodedRefreshToken = jwt.verify(
            refreshToken,
            JWT_CONFIG.REFRESH_SECRET
          );
          // Tìm user từ DB với refreshToken
          const user = await User.findById(decodedRefreshToken.id).select(
            "-password"
          );

          if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
              success: false,
              message: "Token không hợp lệ - User không tồn tại",
            });
          }

          // Kiểm tra trạng thái tài khoản
          if (!user.isActive) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
              success: false,
              message: "Tài khoản đã bị vô hiệu hóa",
            });
          }

          // Tạo accessToken và refreshToken mới
          const jwtService = new JwtService();
          const newTokens = await jwtService.createTokenJwt(user.email);

          if (!newTokens) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: "Không thể tạo token mới",
            });
          }

          // Thiết lập cookie mới cho accessToken và refreshToken
          const cookieOptions = getCookieOptions();
          res.cookie("accessToken", newTokens.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000, // 15 phút
          });
          res.cookie("refreshToken", newTokens.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
          });

          // Lưu thông tin user vào request
          req.user = user;
          req.userId = user._id;

          next();
        } catch (refreshTokenError) {
          // Refresh token cũng hết hạn hoặc không hợp lệ
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: "Token đã hết hạn",
          });
        }
      } else {
        // Nếu lỗi không phải liên quan token hết hạn bác bỏ luôn
        throw accessTokenError;
      }
    }
  } catch (error) {
    // Lỗi hệ thống khi xác thực token
    console.error("Auth middleware error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi xác thực",
    });
  }
};

// Middleware kiểm tra quyền admin
// Chỉ cho phép user có role = "admin" truy cập (phải qua xác thực trước)
export const adminMiddleware = (req, res, next) => {
  try {
    // Đã xác thực chưa
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    // Kiểm tra quyền admin (role trong model là "Admin", "Member", "Viewer")
    if (req.user.role !== "Admin") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Không có quyền truy cập - Cần quyền admin",
      });
    }

    next();
  } catch (error) {
    // Lỗi nội bộ khi kiểm tra quyền
    console.error("Admin middleware error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi kiểm tra quyền",
    });
  }
};

// Middleware kiểm tra quyền user hoặc admin
// Admin truy cập mọi tài nguyên, user chỉ truy cập tài nguyên chính mình
export const userOrAdminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    const { id } = req.params;
    const userId = req.user._id.toString();

    // Nếu là admin: cho phép (role trong model là "Admin")
    if (req.user.role === "Admin") {
      return next();
    }

    // Nếu là user, chỉ truy cập dữ liệu chính mình
    if (userId !== id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Không có quyền truy cập tài nguyên này",
      });
    }

    next();
  } catch (error) {
    // Lỗi kiểm tra quyền
    console.error("User or admin middleware error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi kiểm tra quyền",
    });
  }
};

// Middleware xác thực tùy chọn
// Nếu không có token vẫn cho đi, nếu có thì xác thực và lưu user vào req
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ cookie hoặc header
    let token = req.cookies.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // Nếu không có token, cứ cho qua không xác thực
    if (!token) {
      return next();
    }

    try {
      // Thử xác thực token và lấy user
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
      const user = await User.findById(decoded.id).select("-password");

      // Nếu hợp lệ và đang active thì lưu
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (error) {
      // Token không hợp lệ vẫn cứ cho qua
      console.log("Optional auth: Token không hợp lệ, tiếp tục không xác thực");
    }

    next();
  } catch (error) {
    // Lỗi nội bộ, vẫn cho qua để không cản trở luồng request
    console.error("Optional auth middleware error:", error);
    next();
  }
};

// Middleware kiểm tra tài khoản đang active
// Đảm bảo user đã xác thực và chặn nếu tài khoản bị vô hiệu hóa
export const activeUserMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    if (!req.user.isActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Tài khoản đã bị vô hiệu hóa",
      });
    }

    next();
  } catch (error) {
    // Lỗi nội bộ khi kiểm tra trạng thái active
    console.error("Active user middleware error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi kiểm tra trạng thái tài khoản",
    });
  }
};

// Hàm tiện ích tạo JWT token cho userId
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
  });
};

// Hàm tiện ích xác thực, giải mã JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.SECRET);
  } catch (error) {
    throw error;
  }
};
