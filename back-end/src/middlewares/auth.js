import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import {
  HTTP_STATUS,
  JWT_CONFIG,
  getCookieOptions,
} from "../utils/constants.js";

/**
 * Hàm tiện ích: Lấy access token từ cookie hoặc header
 */
const getAccessToken = (req) => {
  let token = req.cookies?.accessToken;
  if (!token) {
    // Lấy từ header dạng Bearer
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  return token;
};

/**
 * Hàm set cookie xác thực (access/refresh token) cho response
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  // Chú ý: Trên Vercel chỉ chạy HTTPS nên luôn bật secure
  const cookieOptions = getCookieOptions();
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    httpOnly: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 phút
    secure: true,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    secure: true,
  });
};

/**
 * Hàm attach (gắn) thông tin admin vào request - để các middleware/controller xử lý
 */
const attachAdminToRequest = (req, admin) => {
  req.admin = admin;
  req.user = admin;
  req.userId = admin?._id || null;
  req.adminId = admin?._id || null;
};

/**
 * Middleware chính: Xác thực token/refresh token, attach admin, tự động refresh token nếu cần
 * Nếu optional = true, chỉ gắn admin hoặc null mà không trả lỗi (cho middleware optional)
 */
const handleAuth = async (req, res, next, options = { optional: false }) => {
  try {
    const token = getAccessToken(req);

    if (!token) {
      if (options.optional) {
        attachAdminToRequest(req, null);
        return next();
      }
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Token không được cung cấp",
      });
    }

    try {
      // Giải mã access token
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin) {
        if (options.optional) {
          attachAdminToRequest(req, null);
          return next();
        }
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Token không hợp lệ - Admin không tồn tại",
        });
      }
      // Kiểm tra role admin
      if (admin.role !== "admin") {
        if (options.optional) {
          attachAdminToRequest(req, null);
          return next();
        }
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Chỉ admin mới có quyền truy cập",
        });
      }
      attachAdminToRequest(req, admin);
      return next();
    } catch (accessTokenError) {
      // Nếu token hết hạn hoặc không hợp lệ, thử xác thực bằng refresh token
      if (
        accessTokenError.name === "TokenExpiredError" ||
        accessTokenError.name === "JsonWebTokenError"
      ) {
        // Refresh token logic
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
          if (options.optional) {
            attachAdminToRequest(req, null);
            return next();
          }
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: "Token đã hết hạn",
          });
        }
        try {
          // Giải mã refresh token
          const decodedRefreshToken = jwt.verify(
            refreshToken,
            JWT_CONFIG.REFRESH_SECRET
          );
          const admin = await Admin.findById(decodedRefreshToken.id).select(
            "-password"
          );
          // Kiểm tra tồn tại và quyền admin
          if (admin && admin.role === "admin") {
            // Sinh access token & refresh token mới
            const newAccessToken = jwt.sign(
              { id: admin._id },
              JWT_CONFIG.SECRET,
              { expiresIn: JWT_CONFIG.EXPIRES_IN }
            );
            const newRefreshToken = jwt.sign(
              { id: admin._id },
              JWT_CONFIG.REFRESH_SECRET,
              { expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN }
            );
            setAuthCookies(res, newAccessToken, newRefreshToken);
            attachAdminToRequest(req, admin);
            return next();
          } else {
            if (options.optional) {
              attachAdminToRequest(req, null);
              return next();
            }
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
              success: false,
              message: "Token không hợp lệ - Admin không tồn tại",
            });
          }
        } catch (refreshTokenError) {
          if (options.optional) {
            attachAdminToRequest(req, null);
            return next();
          }
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: "Token đã hết hạn",
          });
        }
      } else {
        // Các lỗi khác không liên quan tới token
        throw accessTokenError;
      }
    }
  } catch (error) {
    // Nếu middleware optional thì không trả lỗi, chỉ gắn null
    if (options.optional) {
      attachAdminToRequest(req, null);
      return next();
    }
    console.error(options.errorLogLabel || "Lỗi middleware xác thực:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi xác thực",
    });
  }
};

// Middleware xác thực Admin (có refresh nếu cần)
// Sử dụng cho các route cần xác thực bắt buộc
export const authMiddleware = (req, res, next) =>
  handleAuth(req, res, next, { optional: false, errorLogLabel: "Auth middleware error:" });

// Middleware kiểm tra quyền admin và xác thực token (thường như authMiddleware, nhưng để tách biệt logic nếu sau này bổ sung)
export const adminMiddleware = (req, res, next) =>
  handleAuth(req, res, next, { optional: false, errorLogLabel: "Admin middleware error:" });

/**
 * Hàm tiện ích sinh JWT token cho adminId
 */
export const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
  });
};

/**
 * Hàm tiện ích sinh refresh token cho adminId
 */
export const generateRefreshToken = (adminId) => {
  return jwt.sign({ id: adminId }, JWT_CONFIG.REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
  });
};

/**
 * Middleware xác thực không bắt buộc: chỉ kiểm tra, nếu không hợp lệ thì req.admin = null, không trả lỗi
 * Thường dùng cho các route muốn biết user có đăng nhập hay chưa
 */
export const optionalAuthMiddleware = (req, res, next) =>
  handleAuth(req, res, next, { optional: true, errorLogLabel: "Optional auth middleware error:" });

/**
 * Hàm tiện ích xác thực & giải mã JWT token (access token)
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.SECRET);
  } catch (error) {
    throw error;
  }
};
