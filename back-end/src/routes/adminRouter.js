import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { adminMiddleware } from "../middlewares/auth.js";

const router = Router();

// Đăng ký admin mới (không cần xác thực)
router.post("/register", adminController.registerAdmin);

// Đăng nhập admin (không cần xác thực)
router.post("/login", adminController.loginAdmin);

// Kiểm tra đăng nhập và lấy thông tin admin hiện tại (yêu cầu xác thực)
router.get("/me", adminMiddleware, adminController.getCurrentAdmin);

// Kiểm tra đăng nhập (tự xử lý verify token trong controller)
router.get("/check-auth", adminController.checkAuth);

// Các route khác yêu cầu quyền admin
router.get("/centers", adminMiddleware, adminController.getCenters);

export default router;
