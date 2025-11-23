// Import các service và hàm tiện ích cần thiết
import { AdminService } from "../services/adminServices.js";
import { CentersService } from "../services/centersServices.js";
import { HTTP_STATUS, getCookieOptions } from "../utils/constants.js";
import { generateToken, generateRefreshToken } from "../middlewares/auth.js";

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
      const admin = await this.adminService.registerAdmin(name, email, password);

      // Trả về kết quả đăng ký thành công (ẩn thông tin nhạy cảm)
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Đăng ký thành công. Tài khoản của bạn đang chờ được kích hoạt bởi quản trị viên.",
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
      const cookieOptions = {
        ...getCookieOptions(),
        secure: true,
        httpOnly: true,
        sameSite: "strict",
      };

      // Sinh access token và refresh token cho admin
      const accessToken = generateToken(admin._id);
      const refreshToken = generateRefreshToken(admin._id);

      // Gửi cookie về client
      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 phút
      });
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      // Trả về thông tin đăng nhập thành công (ẩn trường nhạy cảm)
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
  checkAuth = async (req, res) => {
    try {
      const admin = req.admin;
      // Nếu chưa đăng nhập hoặc không có quyền admin
      if (!admin || admin.role !== "admin") {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: "Chưa đăng nhập hoặc không có quyền truy cập",
          authenticated: false,
        });
      }
      // Nếu tài khoản chưa kích hoạt
      if (!admin.isActive) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: "Tài khoản chưa được kích hoạt",
          authenticated: false,
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
    } catch {
      // Lỗi hệ thống khi kiểm tra đăng nhập
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
