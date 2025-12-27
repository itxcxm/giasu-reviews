import { UserService } from "../services/userService.js";
import {
  HTTP_STATUS,
  getCookieOptions,
  JWT_CONFIG,
} from "../utils/constants.js";
import { generateToken, generateRefreshToken } from "../middlewares/auth.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Khởi tạo một instance của UserService để tái sử dụng trong controller.
const userService = new UserService();

export class UserController {
  constructor() {
    this.userService = userService;
  }

  // Xử lý yêu cầu đăng ký người dùng mới.
  registerUser = async (req, res) => {
    try {
      const { name, email, password } = req.body || {};

      // --- VALIDATION ---
      // Kiểm tra các trường bắt buộc.
      if (!name || !email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Tên, email và mật khẩu là bắt buộc.",
        });
      }
      // Kiểm tra độ dài mật khẩu.
      if (typeof password !== "string" || password.length < 6) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Mật khẩu phải có ít nhất 6 ký tự.",
        });
      }
      // Kiểm tra định dạng email.
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email không hợp lệ.",
        });
      }

      // Gọi service để xử lý logic đăng ký.
      const user = await this.userService.registerUser(name, email, password);

      // Trả về response thành công.
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.",
        data: { user },
      });
    } catch (error) {
      // Bắt các lỗi cụ thể từ service.
      if (error.message === "Email đã được sử dụng") {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: "Email này đã được sử dụng.",
        });
      }
      // Bắt các lỗi chung khác.
      console.error("Lỗi khi đăng ký người dùng:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Đã có lỗi xảy ra trong quá trình đăng ký.",
      });
    }
  };

  // Xử lý yêu cầu đăng nhập của người dùng.
  loginUser = async (req, res) => {
    try {
      const { email, password } = req.body || {};

      // Kiểm tra email và password có được cung cấp không.
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email và mật khẩu là bắt buộc.",
        });
      }

      // Gọi service để kiểm tra thông tin đăng nhập.
      const user = await this.userService.loginUser(email, password);

      // Nếu không tìm thấy người dùng hoặc sai mật khẩu.
      if (!user) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác.",
        });
      }

      // Tạo token truy cập (ngắn hạn) và token làm mới (dài hạn).
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Lấy các tùy chọn cookie cơ bản (httpOnly, secure, sameSite).
      const cookieOptions = getCookieOptions();
      const accessTokenOptions = { ...cookieOptions, maxAge: 15 * 60 * 1000 }; // 15 phút
      const refreshTokenOptions = { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 ngày

      // Gửi token về cho client thông qua httpOnly cookie để tăng bảo mật.
      res.cookie("accessToken", accessToken, accessTokenOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenOptions);

      // Trả về thông tin người dùng và accessToken trong body
      // để frontend có thể sử dụng ngay mà không cần đọc cookie.
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Đăng nhập thành công.",
        data: { user, token: accessToken },
      });
    } catch (error) {
      // Bắt lỗi tài khoản chưa được kích hoạt.
       if (error.message.includes("kích hoạt")) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: error.message,
          });
        }
      // Bắt các lỗi chung khác.
      console.error("Lỗi khi đăng nhập:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Đã có lỗi xảy ra trong quá trình đăng nhập.",
      });
    }
  };

  // Xử lý yêu cầu đăng xuất của người dùng.
  logoutUser = async (req, res) => {
    try {
      const cookieOptions = getCookieOptions();
      // Xóa cookie bằng cách ghi đè với thời gian hết hạn là 0.
      res.cookie("accessToken", "", { ...cookieOptions, maxAge: 0 });
      res.cookie("refreshToken", "", { ...cookieOptions, maxAge: 0 });
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Đăng xuất thành công.",
      });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Đã có lỗi xảy ra khi đăng xuất.",
      });
    }
  };

  // Lấy thông tin người dùng hiện tại đang đăng nhập.
  // Yêu cầu middleware xác thực đã chạy trước để gán `req.user`.
  getCurrentUser = async (req, res) => {
    try {
      const user = req.user; // `req.user` được gán bởi middleware.
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Chưa đăng nhập hoặc token không hợp lệ.",
        });
      }
      // Trả về thông tin người dùng đã được làm sạch (loại bỏ trường nhạy cảm).
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Xác thực thành công.",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch {
      console.error("Lỗi khi lấy thông tin người dùng hiện tại:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Đã có lỗi xảy ra khi lấy thông tin người dùng.",
      });
    }
  };

  // Kiểm tra trạng thái đăng nhập của người dùng từ cookie.
  // Endpoint này không dùng auth middleware mà tự kiểm tra token.
  checkAuth = async (req, res) => {
    try {
      const accessToken = req.cookies.accessToken;
      const refreshToken = req.cookies.refreshToken;

      // Nếu không có cả hai token, người dùng chưa đăng nhập.
      if (!accessToken && !refreshToken) {
        return res.json({ success: true, authenticated: false, message: "Chưa đăng nhập." });
      }

      // 1. Ưu tiên kiểm tra Access Token.
      if (accessToken) {
        try {
          const decoded = jwt.verify(accessToken, JWT_CONFIG.ACCESS_TOKEN_SECRET);
          const user = await User.findById(decoded.id);
          if (user && user.isActive) {
            // Access token hợp lệ, trả về thông tin người dùng.
            return res.json({
              success: true,
              authenticated: true,
              message: "Đã đăng nhập.",
              data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
            });
          }
        } catch (error) {
          // Lỗi thường là "TokenExpiredError", sẽ tiếp tục thử với refresh token.
        }
      }

      // 2. Nếu Access Token không hợp lệ, thử dùng Refresh Token.
      if (refreshToken) {
        try {
          const decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET);
          const user = await User.findById(decoded.id);
          if (user && user.isActive) {
            // Refresh token hợp lệ, tạo một Access Token mới.
            const newAccessToken = generateToken(user);
            const cookieOptions = getCookieOptions();
            res.cookie("accessToken", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 phút

            return res.json({
              success: true,
              authenticated: true,
              message: "Đã đăng nhập (token đã được làm mới).",
              data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
            });
          }
        } catch (error) {
          // Refresh token cũng không hợp lệ, người dùng phải đăng nhập lại.
        }
      }

      // Nếu cả hai token đều không hợp lệ.
      return res.json({ success: true, authenticated: false, message: "Phiên đăng nhập đã hết hạn." });
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái đăng nhập:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        authenticated: false,
        message: "Đã có lỗi xảy ra khi kiểm tra đăng nhập.",
      });
    }
  };
}

// Xuất một instance của controller để sử dụng trong file routes.
export const userController = new UserController();
