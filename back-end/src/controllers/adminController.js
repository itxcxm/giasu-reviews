// Import các service và hàm tiện ích cần thiết
import { AdminService } from "../services/adminServices.js";
import { CentersService } from "../services/centersServices.js";
import {
  HTTP_STATUS,
  getCookieOptions,
  JWT_CONFIG,
} from "../utils/constants.js";
import { generateToken, generateRefreshToken } from "../middlewares/auth.js";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/*
 * Ghi chú tối ưu cho Vercel:
 * - Chỉ set các thuộc tính cookie an toàn cho môi trường production (httpOnly, sameSite, secure)
 * - Đảm bảo không trả về dữ liệu nhạy cảm trong response
 * - Gọn gàng phần xử lý try/catch, giảm log lỗi không cần thiết ở production
 * - Khởi tạo instance service bên ngoài class, tối ưu cold start nếu service không stateful, nhưng vẫn giữ nguyên ngữ cảnh cũ để tránh breaking.
 */

// Khởi tạo instance các service
const adminService = new AdminService();
const centersService = new CentersService();

export class AdminController {
    // Đăng xuất admin
    logoutAdmin = async (req, res) => {
      try {
        // Xóa cookie accessToken và refreshToken bằng cách set lại với maxAge = 0
        const cookieOptions = getCookieOptions();
        res.cookie("accessToken", "", {
          ...cookieOptions,
          maxAge: 0,
        });
        res.cookie("refreshToken", "", {
          ...cookieOptions,
          maxAge: 0,
        });
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: "Đăng xuất thành công",
        });
      } catch {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Lỗi hệ thống khi đăng xuất",
        });
      }
    };
  constructor() {
    // Gán service vào class
    this.adminService = adminService;
    this.centersService = centersService;
  }

  // Đăng ký admin mới
  registerAdmin = async (req, res) => {
    try {
      const { name, email, password } = req.body || {};

      // Kiểm tra đầu vào bắt buộc
      if (!name || !email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Tên, email và mật khẩu là bắt buộc",
        });
      }
      // Kiểm tra độ dài mật khẩu
      if (typeof password !== "string" || password.length < 6) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Mật khẩu phải có ít nhất 6 ký tự",
        });
      }
      // Kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email không hợp lệ",
        });
      }

      // Đăng ký tài khoản mới
      const admin = await this.adminService.registerAdmin(
        name,
        email,
        password
      );

      // Trả về kết quả đăng ký thành công (ẩn thông tin nhạy cảm)
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message:
          "Đăng ký thành công. Tài khoản của bạn đang chờ được kích hoạt bởi quản trị viên.",
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
          },
        },
      });
    } catch (error) {
      // Xử lý lỗi email đã tồn tại hoặc lỗi conflict
      // Trả về message đơn giản khi lỗi conflict, hạn chế log ra stdout cho production
      if (error.message === "Email đã được sử dụng" || error.code === 11000) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }
      // Lỗi hệ thống chung
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi đăng ký",
      });
    }
  };

  // Đăng nhập admin
  loginAdmin = async (req, res) => {
    try {
      const { email, password } = req.body || {};

      // Kiểm tra đầu vào
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email và mật khẩu là bắt buộc",
        });
      }

      let admin;
      try {
        // Thực hiện đăng nhập và kiểm tra kích hoạt
        admin = await this.adminService.loginAdmin(email, password);
      } catch (error) {
        // Nếu tài khoản chưa kích hoạt
        if (error.message && error.message.includes("kích hoạt")) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: error.message,
          });
        }
        // Các lỗi khác
        throw error;
      }

      // Nếu không tìm thấy tài khoản hợp lệ
      if (!admin) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      // Set cookie an toàn cho môi trường production (phù hợp Vercel/HTTPS)
      // Sử dụng getCookieOptions() để tự động xử lý cross-domain (sameSite: "none" khi cross-domain)
      const cookieOptions = getCookieOptions();

      // Sinh access token và refresh token cho admin
      const accessToken = generateToken(admin._id);
      const refreshToken = generateRefreshToken(admin._id);

      // Log cookie options để debug (chỉ trong development hoặc khi cần)
      if (
        process.env.NODE_ENV === "development" ||
        process.env.DEBUG_COOKIES === "true"
      ) {
        console.log("Cookie options:", JSON.stringify(cookieOptions, null, 2));
        console.log("CLIENT_URL:", process.env.CLIENT_URL);
        console.log("NODE_ENV:", process.env.NODE_ENV);
      }

      // Gửi cookie về client - ĐẢM BẢO set cookies trước khi gửi response
      const accessTokenOptions = {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 phút
      };
      const refreshTokenOptions = {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      };

      res.cookie("accessToken", accessToken, accessTokenOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenOptions);

      // Đảm bảo cookies được gửi - kiểm tra headers đã được set
      if (
        process.env.NODE_ENV === "development" ||
        process.env.DEBUG_COOKIES === "true"
      ) {
        const setCookieHeaders = res.getHeader("Set-Cookie");
        console.log("Set-Cookie headers:", setCookieHeaders);
      }

      // Trả về thông tin đăng nhập thành công (ẩn trường nhạy cảm)
      // QUAN TRỌNG: Phải gửi response sau khi set cookies
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
          },
        },
      });
    } catch (error) {
      // Lỗi hệ thống chung khi đăng nhập
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi đăng nhập",
      });
    }
  };

  // Lấy thông tin admin hiện tại (sau xác thực)
  getCurrentAdmin = async (req, res) => {
    try {
      const admin = req.admin || req.user;
      // Nếu chưa đăng nhập hoặc không hợp lệ
      if (!admin) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Chưa đăng nhập hoặc token không hợp lệ",
        });
      }
      // Trả về thông tin admin (không bao gồm trường nhạy cảm)
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Đã xác thực thành công",
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
          },
        },
      });
    } catch {
      // Lỗi hệ thống khi kiểm tra đăng nhập
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi kiểm tra đăng nhập",
      });
    }
  };

  // Kiểm tra trạng thái đăng nhập & quyền admin
  // Tự verify token trong controller, không dùng middleware
  // Xử lý cả accessToken và refreshToken
  checkAuth = async (req, res) => {
    try {
      // Lấy accessToken từ cookies hoặc header
      let accessToken = req.cookies?.accessToken;
      if (!accessToken) {
        const authHeader = req.headers?.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          accessToken = authHeader.substring(7);
        }
      }

      // Lấy refreshToken từ cookies
      const refreshToken = req.cookies?.refreshToken;

      // Nếu không có cả accessToken và refreshToken
      if (!accessToken && !refreshToken) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: "Chưa đăng nhập",
          authenticated: false,
        });
      }

      // Verify tokens và lấy admin
      let decoded;
      let admin = null;
      let shouldRefreshTokens = false;

      // Ưu tiên verify accessToken trước
      if (accessToken) {
        try {
          decoded = jwt.verify(accessToken, JWT_CONFIG.SECRET);
          // AccessToken hợp lệ, tìm admin
          admin = await Admin.findById(decoded.id).select("-password");
        } catch (accessTokenError) {
          // AccessToken hết hạn hoặc không hợp lệ
          if (
            accessTokenError.name === "TokenExpiredError" ||
            accessTokenError.name === "JsonWebTokenError"
          ) {
            // Thử dùng refreshToken
            if (refreshToken) {
              try {
                decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);
                admin = await Admin.findById(decoded.id).select("-password");
                shouldRefreshTokens = true; // Cần tạo lại tokens mới
              } catch (refreshTokenError) {
                // RefreshToken cũng không hợp lệ
                return res.status(HTTP_STATUS.OK).json({
                  success: true,
                  message: "Token không hợp lệ",
                  authenticated: false,
                });
              }
            } else {
              // Không có refreshToken
              return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Token đã hết hạn",
                authenticated: false,
              });
            }
          } else {
            throw accessTokenError;
          }
        }
      } else if (refreshToken) {
        // Chỉ có refreshToken, không có accessToken
        try {
          decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);
          admin = await Admin.findById(decoded.id).select("-password");
          shouldRefreshTokens = true; // Cần tạo lại tokens mới
        } catch (refreshTokenError) {
          return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Token không hợp lệ",
            authenticated: false,
          });
        }
      }

      // Nếu không tìm thấy admin
      if (!admin) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: "Token không hợp lệ - Admin không tồn tại",
          authenticated: false,
        });
      }

      // Kiểm tra role admin
      if (admin.role !== "admin") {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: "Chỉ admin mới có quyền truy cập",
          authenticated: false,
        });
      }

      // Kiểm tra tài khoản đã kích hoạt chưa
      if (!admin.isActive) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: "Tài khoản chưa được kích hoạt",
          authenticated: false,
        });
      }

      // Nếu cần refresh tokens (khi accessToken hết hạn nhưng refreshToken hợp lệ)
      if (shouldRefreshTokens) {
        const newAccessToken = generateToken(admin._id);
        const newRefreshToken = generateRefreshToken(admin._id);
        const cookieOptions = getCookieOptions();

        res.cookie("accessToken", newAccessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000, // 15 phút
        });
        res.cookie("refreshToken", newRefreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });
      }

      // Đã xác thực là admin hợp lệ và đã kích hoạt
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Đã xác thực",
        authenticated: true,
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
          },
        },
      });
    } catch (error) {
      // Lỗi hệ thống khi kiểm tra đăng nhập
      console.error("Check auth error:", error);
      return res.status(HTTP_STATUS.OK).json({
        success: false,
        message: "Lỗi hệ thống khi kiểm tra đăng nhập",
        authenticated: false,
      });
    }
  };

  // Lấy danh sách trung tâm (có phân trang, tìm kiếm, lọc/trật tự)
  getCenters = async (req, res) => {
    try {
      // Lấy tham số truy vấn cho lọc, tìm kiếm, phân trang
      const {
        search = "",
        isVerified,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,
      } = req.query;

      // Tạo options cho query service
      const options = {
        search,
        isVerified: isVerified !== undefined ? isVerified : null,
        sortBy,
        sortOrder,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      };

      // Lấy danh sách trung tâm từ service
      const result = await this.centersService.getCenters({}, options);

      // Trả về danh sách trung tâm cùng thông tin phân trang
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.centers,
        pagination: result.pagination,
      });
    } catch {
      // Lỗi hệ thống khi lấy danh sách trung tâm
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi lấy danh sách trung tâm",
      });
    }
  };
}

// Xuất instance controller để dùng cho router
export const adminController = new AdminController();
