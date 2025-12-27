import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { adminMiddleware } from "../middlewares/auth.js";

const router = Router();

// --- Các route không yêu cầu xác thực ---

// Route để admin đăng nhập.
// POST /api/admin/login
router.post("/login", adminController.loginAdmin);

// Route để kiểm tra trạng thái đăng nhập của admin một cách nhanh chóng từ client.
// Route này không dùng middleware xác thực mà tự xử lý logic kiểm tra token trong controller.
// GET /api/admin/check-auth
router.get("/check-auth", adminController.checkAuth);


// --- Các route yêu cầu xác thực admin ---
// Tất cả các route bên dưới sẽ đi qua `adminMiddleware` trước tiên
// để đảm bảo chỉ admin mới có quyền truy cập.

// Route để admin đăng xuất.
// POST /api/admin/logout
router.post("/logout", adminMiddleware, adminController.logoutAdmin);

// Route để lấy thông tin của admin đang đăng nhập.
// GET /api/admin/me
router.get("/me", adminMiddleware, adminController.getCurrentAdmin);

// Route để cập nhật thông tin cá nhân của admin đang đăng nhập (tên, email, mật khẩu).
// PUT /api/admin/me
router.put("/me", adminMiddleware, adminController.updateAdmin);

// Route để admin lấy danh sách tất cả các trung tâm (bao gồm cả những trung tâm chưa được duyệt).
// Hỗ trợ tìm kiếm, lọc và phân trang qua query params.
// GET /api/admin/centers
router.get("/centers", adminMiddleware, adminController.getCenters);

// =================================================================
// QUẢN LÝ NGƯỜI DÙNG
// =================================================================

// Route để lấy danh sách tất cả người dùng.
// GET /api/admin/users
router.get("/users", adminMiddleware, adminController.getUsers);

// Route để xóa một người dùng theo ID.
// DELETE /api/admin/users/:id
router.delete("/users/:id", adminMiddleware, adminController.deleteUser);

// Route để cập nhật trạng thái của người dùng (active, inactive, banned).
// PATCH /api/admin/users/:id/status
router.patch("/users/:id/status", adminMiddleware, adminController.updateUserStatus);

// Route để cập nhật quyền cho một người dùng.
// PUT /api/admin/users/:id/permissions
router.put("/users/:id/permissions", adminMiddleware, adminController.updateUserPermissions);


// =ac==============================================================
// QUẢN LÝ QUYỀN
// =================================================================

// Route để lấy danh sách tất cả các quyền có trong hệ thống.
// GET /api/admin/permissions
router.get("/permissions", adminMiddleware, adminController.getPermissions);


export default router;