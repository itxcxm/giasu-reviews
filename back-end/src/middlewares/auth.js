import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import {
  HTTP_STATUS,
  JWT_CONFIG,
  getCookieOptions,
} from "../utils/constants.js";

// Middleware xác thực Admin
// Kiểm tra token trong cookie hoặc header Authorization, tự động refresh nếu accessToken hết hạn
export const authMiddleware = async (req, res, next) => {
  try {
    // Debug: Log cookies và headers để troubleshoot
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DEBUG === "true"
    ) {
      console.log("Auth Middleware - Request cookies:", req.cookies);
      console.log("Auth Middleware - Request origin:", req.headers.origin);
      console.log(
        "Auth Middleware - Authorization header:",
        req.headers.authorization ? "Present" : "Missing"
      );
    }

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
      // Log thêm thông tin để debug
      if (
        process.env.NODE_ENV === "development" ||
        process.env.DEBUG === "true"
      ) {
        console.log(
          "Auth Middleware - No token found. Cookies received:",
          Object.keys(req.cookies)
        );
      }
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Token không được cung cấp",
      });
    }

    try {
      // Xác thực accessToken
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);

      // Tìm admin từ DB, loại trừ trường password
      const admin = await Admin.findById(decoded.id).select("-password");

      // Không tìm thấy admin
      if (!admin) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Token không hợp lệ - Admin không tồn tại",
        });
      }

      // Kiểm tra role phải là admin
      if (admin.role !== "admin") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Chỉ admin mới có quyền truy cập",
        });
      }

      // Lưu thông tin admin vào request để downstream middleware/controller dùng
      req.admin = admin;
      req.user = admin; // Giữ tương thích với code cũ
      req.userId = admin._id;
      req.adminId = admin._id;
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
          // Tìm admin từ DB với refreshToken
          const admin = await Admin.findById(decodedRefreshToken.id).select(
            "-password"
          );

          if (!admin) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
              success: false,
              message: "Token không hợp lệ - Admin không tồn tại",
            });
          }

          // Kiểm tra role phải là admin
          if (admin.role !== "admin") {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
              success: false,
              message: "Chỉ admin mới có quyền truy cập",
            });
          }

          // Tạo accessToken và refreshToken mới
          const accessToken = jwt.sign({ id: admin._id }, JWT_CONFIG.SECRET, {
            expiresIn: JWT_CONFIG.EXPIRES_IN,
          });
          const newRefreshToken = jwt.sign(
            { id: admin._id },
            JWT_CONFIG.REFRESH_SECRET,
            { expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN }
          );

          // Thiết lập cookie mới cho accessToken và refreshToken
          const cookieOptions = getCookieOptions();
          res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000, // 15 phút
          });
          res.cookie("refreshToken", newRefreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
          });

          // Lưu thông tin admin vào request
          req.admin = admin;
          req.user = admin; // Giữ tương thích với code cũ
          req.userId = admin._id;
          req.adminId = admin._id;

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

// Middleware kiểm tra quyền admin và xác thực token
// Tự động xác thực token và kiểm tra role là admin
export const adminMiddleware = async (req, res, next) => {
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

      // Tìm admin từ DB, loại trừ trường password
      const admin = await Admin.findById(decoded.id).select("-password");

      // Không tìm thấy admin
      if (!admin) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Token không hợp lệ - Admin không tồn tại",
        });
      }

      // Kiểm tra role phải là admin
      if (admin.role !== "admin") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Chỉ admin mới có quyền truy cập",
        });
      }

      // Lưu thông tin admin vào request để downstream middleware/controller dùng
      req.admin = admin;
      req.user = admin; // Giữ tương thích với code cũ
      req.userId = admin._id;
      req.adminId = admin._id;
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
          // Tìm admin từ DB với refreshToken
          const admin = await Admin.findById(decodedRefreshToken.id).select(
            "-password"
          );

          if (!admin) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
              success: false,
              message: "Token không hợp lệ - Admin không tồn tại",
            });
          }

          // Kiểm tra role phải là admin
          if (admin.role !== "admin") {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
              success: false,
              message: "Chỉ admin mới có quyền truy cập",
            });
          }

          // Tạo accessToken và refreshToken mới
          const accessToken = jwt.sign({ id: admin._id }, JWT_CONFIG.SECRET, {
            expiresIn: JWT_CONFIG.EXPIRES_IN,
          });
          const newRefreshToken = jwt.sign(
            { id: admin._id },
            JWT_CONFIG.REFRESH_SECRET,
            { expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN }
          );

          // Thiết lập cookie mới cho accessToken và refreshToken
          const cookieOptions = getCookieOptions();
          res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000, // 15 phút
          });
          res.cookie("refreshToken", newRefreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
          });

          // Lưu thông tin admin vào request
          req.admin = admin;
          req.user = admin; // Giữ tương thích với code cũ
          req.userId = admin._id;
          req.adminId = admin._id;

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
    console.error("Admin middleware error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi xác thực",
    });
  }
};

// Hàm tiện ích tạo JWT token cho adminId
export const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
  });
};

// Hàm tiện ích tạo refresh token cho adminId
export const generateRefreshToken = (adminId) => {
  return jwt.sign({ id: adminId }, JWT_CONFIG.REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
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
