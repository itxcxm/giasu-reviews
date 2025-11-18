import { Router } from "express";
import { UserController } from "../controllers/userController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = Router();
const userController = new UserController();

// Routes
router.get("/", authMiddleware, adminMiddleware, userController.getUsers); // Lấy danh sách tất cả user
router.get("/me", authMiddleware, userController.getCurrentUser); // Lấy thông tin user hiện tại
router.get("/:id", authMiddleware, adminMiddleware, userController.getUserById); // Lấy thông tin user theo id
router.post("/", userController.createUser); // Tạo mới user
router.put(
  "/:id/admin",
  authMiddleware,
  adminMiddleware,
  userController.updateUserByAdmin
); // Admin cập nhật user (name, role, status, avatar_url)
router.put("/:id/profile", authMiddleware, userController.updateUserProfile); // User cập nhật profile của mình (password, name, email, avatar_url)
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  userController.deleteUser
); // Xóa user (chỉ admin)

export default router;
