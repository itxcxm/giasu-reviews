import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { userMiddleware, authMiddleware } from "../middlewares/auth.js";

const router = Router();

// --- Các Route không yêu cầu xác thực ---

// Route để đăng ký một tài khoản người dùng mới.
// POST /api/user/register
router.post("/register", userController.registerUser);

// Route để đăng nhập.
// POST /api/user/login
router.post("/login", userController.loginUser);

// Route để kiểm tra trạng thái đăng nhập của người dùng từ cookie.
// Thường được gọi khi client khởi động để xác định trạng thái UI.
// GET /api/user/check-auth
router.get("/check-auth", userController.checkAuth);


// --- Các Route yêu cầu xác thực ---

// Route để đăng xuất. Yêu cầu người dùng đã đăng nhập.
// `authMiddleware` được dùng ở đây để đảm bảo chỉ người dùng đã đăng nhập mới có thể gọi logout.
// POST /api/user/logout
router.post("/logout", authMiddleware, userController.logoutUser);

// Route để lấy thông tin chi tiết của người dùng đang đăng nhập.
// Middleware `userMiddleware` đảm bảo rằng người dùng đã đăng nhập và có vai trò là 'user' (hoặc 'admin').
// GET /api/user/me
router.get("/me", userMiddleware, userController.getCurrentUser);

export default router;