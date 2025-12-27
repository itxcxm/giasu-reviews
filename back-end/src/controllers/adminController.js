// Import các service xử lý nghiệp vụ liên quan đến admin và trung tâm
import { AdminService } from "../services/adminService.js";
import { CentersService } from "../services/centersService.js";
import { UserService } from "../services/userService.js";
import Permission from "../models/Permission.js";

// Import các hằng số và cấu hình dùng chung cho HTTP, Cookie và JWT
import {
  HTTP_STATUS,
  getCookieOptions,
  JWT_CONFIG,
} from "../utils/constants.js";

// Import các hàm tạo access token và refresh token
import { generateToken, generateRefreshToken } from "../middlewares/auth.js";

// Thư viện xử lý JWT
import jwt from "jsonwebtoken";

// Model User để thao tác với dữ liệu người dùng trong database
import User from "../models/User.js";

// Khởi tạo instance của các service
const adminService = new AdminService();
const centersService = new CentersService();
const userService = new UserService();

/**
 * Controller xử lý các chức năng liên quan đến Admin
 */
export class AdminController {
  constructor() {
    this.adminService = adminService;
    this.centersService = centersService;
    this.userService = userService;
  }
  getUsers = async (req, res) => {
    try {
      const { search, status } = req.query;
      const users = await this.userService.getUsers({ search, status });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: users });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi lấy danh sách người dùng",
      });
    }
  };
  getPermissions = async (req, res) => {
    try {
      const permissions = await Permission.find();
      return res.status(HTTP_STATUS.OK).json({ success: true, data: permissions });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi lấy danh sách quyền",
      });
    }
  };
  deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Xóa người dùng thành công",
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi xóa người dùng",
      });
    }
  };
  updateUserStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await this.userService.updateUserStatus(id, status);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Cập nhật trạng thái người dùng thành công",
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái người dùng",
      });
    }
  };
  updateUserPermissions = async (req, res) => {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;
      await this.userService.updateUserPermissions(id, permissionIds);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Cập nhật quyền người dùng thành công",
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi cập nhật quyền người dùng",
      });
    }
  };

  /**
   * Đăng xuất admin
   * - Xóa accessToken và refreshToken khỏi cookie
   */
  logoutAdmin = async (req, res) => {
    try {
      const cookieOptions = getCookieOptions();

      // Ghi đè cookie với giá trị rỗng và thời gian sống = 0
      res.cookie("accessToken", "", { ...cookieOptions, maxAge: 0 });
      res.cookie("refreshToken", "", { ...cookieOptions, maxAge: 0 });

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
  
  /**
   * Đăng nhập admin
   * - Kiểm tra email, mật khẩu
   * - Sinh accessToken và refreshToken
   * - Lưu token vào cookie
   */
  loginAdmin = async (req, res) => {
    try {
      const { email, password } = req.body || {};

      // Validate dữ liệu đầu vào
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email và mật khẩu là bắt buộc",
        });
      }

      // Kiểm tra thông tin đăng nhập
      const admin = await this.adminService.loginAdmin(email, password);

      if (!admin) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác hoặc bạn không phải là admin.",
        });
      }

      // Tạo token
      const accessToken = generateToken(admin);
      const refreshToken = generateRefreshToken(admin);

      // Cấu hình cookie
      const cookieOptions = getCookieOptions();
      const accessTokenOptions = { ...cookieOptions, maxAge: 15 * 60 * 1000 }; // 15 phút
      const refreshTokenOptions = { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 ngày

      // Gán token vào cookie
      res.cookie("accessToken", accessToken, accessTokenOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenOptions);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Đăng nhập admin thành công",
        data: { admin },
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi đăng nhập admin",
      });
    }
  }

  /**
   * Lấy thông tin admin hiện tại từ middleware xác thực
   */
  getCurrentAdmin = async (req, res) => {
    try {
      const admin = req.user;

      // Trường hợp chưa xác thực
      if (!admin) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Chưa đăng nhập hoặc token không hợp lệ",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Đã xác thực thành công",
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            status: admin.status,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
          },
        },
      });
    } catch {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi kiểm tra đăng nhập",
      });
    }
  };

  /**
   * Kiểm tra trạng thái đăng nhập admin thông qua accessToken trong cookie
   */
  checkAuth = async (req, res) => {
    try {
      const accessToken = req.cookies.accessToken;

      // Chưa đăng nhập
      if (!accessToken) {
        return res.json({
          success: false,
          authenticated: false,
          message: "Chưa đăng nhập",
        });
      }

      // Giải mã token
      const decoded = jwt.verify(accessToken, JWT_CONFIG.ACCESS_TOKEN_SECRET);
      const admin = await User.findById(decoded.id);

      // Kiểm tra quyền admin và trạng thái hoạt động
      if (admin && admin.role === 'admin' && admin.status === 'active') {
        return res.json({
          success: true,
          authenticated: true,
          message: "Admin đã đăng nhập",
          data: {
            admin: {
              id: admin._id,
              name: admin.name,
              email: admin.email,
              role: admin.role,
            },
          },
        });
      }

      return res.json({
        success: false,
        authenticated: false,
        message: "Token không hợp lệ hoặc bạn không phải admin.",
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        authenticated: false,
        message: "Lỗi hệ thống khi kiểm tra đăng nhập",
      });
    }
  };

  /**
   * Lấy danh sách trung tâm (có phân trang, tìm kiếm, sắp xếp)
   */
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

      // Chuẩn hóa options truyền xuống service
      const options = {
        search,
        isVerified: isVerified !== undefined ? isVerified : null,
        sortBy,
        sortOrder,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      };

      const result = await this.centersService.getCenters({}, options);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.centers,
        pagination: result.pagination,
      });
    } catch {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi lấy danh sách trung tâm",
      });
    }
  };

  /**
   * Cập nhật thông tin admin (tên, email, mật khẩu)
   */
  updateAdmin = async (req, res) => {
    try {
      const adminId = req.user._id;
      const { name, email, oldPassword, newPassword } = req.body || {};

      // Kiểm tra dữ liệu cập nhật
      if (!name && !email && !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Cần cung cấp ít nhất một trường để cập nhật: tên, email hoặc mật khẩu",
        });
      }

      // Validate mật khẩu mới
      if (newPassword && (typeof newPassword !== "string" || newPassword.length < 6)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Mật khẩu mới phải có ít nhất 6 ký tự",
        });
      }

      // Validate email
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: "Email không hợp lệ",
          });
        }
      }

      const updateData = { name, email, oldPassword, newPassword };
      const updatedAdmin = await this.adminService.updateAdmin(adminId, updateData);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Cập nhật thông tin thành công",
        data: {
          admin: {
            id: updatedAdmin._id,
            name: updatedAdmin.name,
            email: updatedAdmin.email,
            role: updatedAdmin.role,
            status: updatedAdmin.status,
            updatedAt: updatedAdmin.updatedAt,
          },
        },
      });
    } catch (error) {
      // Xử lý các lỗi nghiệp vụ cụ thể
      if (error.message === "Admin không tồn tại") {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Admin không tồn tại",
        });
      }
      if (error.message === "Email đã được sử dụng") {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }
      if (
        error.message === "Cần cung cấp mật khẩu cũ để thay đổi mật khẩu" ||
        error.message === "Mật khẩu cũ không chính xác"
      ) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi hệ thống khi cập nhật thông tin",
      });
    }
  };
}

// Export instance controller
export const adminController = new AdminController();
