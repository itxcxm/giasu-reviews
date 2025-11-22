import { AdminService } from "../services/adminServices.js";
import { CentersService } from "../services/centersServices.js";
import { HTTP_STATUS, getCookieOptions } from "../utils/constants.js";
import { generateToken, generateRefreshToken } from "../middlewares/auth.js";

// Controller quản lý các thao tác với Admin
export class AdminController {
  constructor() {
    this.adminService = new AdminService();
    this.centersService = new CentersService();
  }

  // Đăng ký admin mới
  registerAdmin = async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Kiểm tra các trường bắt buộc
      if (!name || !email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Tên, email và mật khẩu là bắt buộc",
        });
      }

      // Kiểm tra độ dài password (tối thiểu 6 ký tự)
      if (password.length < 6) {
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

      // Đăng ký admin
      const admin = await this.adminService.registerAdmin(
        name,
        email,
        password
      );

      // Không tự động đăng nhập vì tài khoản chưa được kích hoạt (isActive = false)
      // Admin cần được kích hoạt bởi quản trị viên khác trước khi có thể đăng nhập

      // Trả về thông tin admin (không bao gồm password)
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
      console.error("Register admin error:", error);

      // Xử lý lỗi duplicate email
      if (error.message === "Email đã được sử dụng" || error.code === 11000) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Lỗi hệ thống khi đăng ký",
      });
    }
  };

  // Đăng nhập admin
  loginAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;

      // Kiểm tra email và password có được cung cấp
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email và mật khẩu là bắt buộc",
        });
      }

      // Xác thực đăng nhập
      let admin;
      try {
        admin = await this.adminService.loginAdmin(email, password);
      } catch (error) {
        // Xử lý lỗi tài khoản chưa active
        if (error.message && error.message.includes("kích hoạt")) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: error.message,
          });
        }
        throw error; // Re-throw các lỗi khác
      }

      if (!admin) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      // Tạo accessToken và refreshToken
      const accessToken = generateToken(admin._id);
      const refreshToken = generateRefreshToken(admin._id);

      // Thiết lập cookie cho accessToken và refreshToken
      const cookieOptions = getCookieOptions();
      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 phút
      });
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      // Trả về thông tin admin (không bao gồm password)
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
      console.error("Login admin error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi đăng nhập",
      });
    }
  };

  // Kiểm tra đăng nhập và trả về thông tin admin hiện tại
  // Endpoint này yêu cầu adminMiddleware để xác thực token
  getCurrentAdmin = async (req, res) => {
    try {
      // Lấy thông tin admin từ request (đã được set bởi adminMiddleware)
      const admin = req.admin || req.user;

      // Nếu không có admin trong request (không nên xảy ra nếu middleware hoạt động đúng)
      if (!admin) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Chưa đăng nhập hoặc token không hợp lệ",
        });
      }

      // Trả về thông tin admin
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
    } catch (error) {
      console.error("Get current admin error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi kiểm tra đăng nhập",
      });
    }
  };

  // Kiểm tra đăng nhập (endpoint đơn giản chỉ trả về true/false)
  checkAuth = async (req, res) => {
    try {
      // Lấy thông tin admin từ request (đã được set bởi adminMiddleware)
      const admin = req.admin || req.user;

      if (!admin) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Chưa đăng nhập",
          authenticated: false,
        });
      }

      // Kiểm tra role phải là admin
      if (admin.role !== "admin") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Không có quyền truy cập",
          authenticated: false,
        });
      }

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
      console.error("Check auth error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi kiểm tra đăng nhập",
        authenticated: false,
      });
    }
  };

  // Lấy danh sách centers (cho admin)
  getCenters = async (req, res) => {
    try {
      const {
        search = "",
        isVerified,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,
      } = req.query;

      const options = {
        search,
        isVerified: isVerified !== undefined ? isVerified : null,
        sortBy,
        sortOrder,
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await this.centersService.getCenters({}, options);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.centers,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Get centers error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi lấy danh sách trung tâm",
      });
    }
  };
}

// Export instance để sử dụng trong routes
export const adminController = new AdminController();
