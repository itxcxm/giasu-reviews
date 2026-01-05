import { Router } from "express";
import { centersController } from "../controllers/centersController.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.js";
import {
  uploadMultipleImages,
  uploadSingleImage,
  handleUploadError,
} from "../middlewares/upload.js";
import { checkReviewLimit } from "../middlewares/reviewLimit.js";

const router = Router();

// --- Các Route Công Khai (Public) ---
// Các endpoint này không yêu cầu xác thực.

// Lấy danh sách các trung tâm với các tùy chọn tìm kiếm, lọc, và phân trang.
// GET /api/centers
router.get("/", centersController.getCenters);

// Lấy danh sách đầy đủ tất cả trung tâm (thường dành cho mục đích quản lý nội bộ).
// GET /api/centers/all
router.get("/all", centersController.getAllCenters);


// --- Route Tạo Mới ---
// Các endpoint này yêu cầu người dùng phải đăng nhập.

// Tạo một trung tâm mới. Bất kỳ người dùng nào đã đăng nhập đều có thể tạo.
// Middleware `authMiddleware` kiểm tra xác thực.
// Middleware `uploadSingleImage` xử lý việc tải lên một file ảnh có tên trường là 'image'.
// Middleware `handleUploadError` bắt các lỗi từ `uploadSingleImage`.
// POST /api/centers
router.post(
  "/",
  authMiddleware, 
  uploadSingleImage, 
  handleUploadError,
  centersController.createCenter
);

// Route riêng cho admin tạo trung tâm, không bị giới hạn bởi rate limit.
// POST /api/centers/admin/create
router.post(
  "/admin/create",
  adminMiddleware, // Chỉ admin mới có quyền truy cập.
  uploadSingleImage,
  handleUploadError,
  centersController.createCenter
);


// --- Route Quản Lý Đánh Giá (Admin) ---

// Lấy tất cả các bài đánh giá từ tất cả các trung tâm. Yêu cầu quyền admin.
// GET /api/centers/reviews/all
router.get("/reviews/all", adminMiddleware, centersController.getAllReviews);


// --- Các Route Theo ID ---
// Các endpoint này hoạt động trên một tài nguyên trung tâm cụ thể.

// Lấy thông tin chi tiết của một trung tâm theo ID.
// GET /api/centers/:id
router.get("/:id", centersController.getCenterById);

// Thêm một bài đánh giá mới cho một trung tâm.
// Yêu cầu người dùng đăng nhập (`authMiddleware`).
// Cho phép upload nhiều ảnh với tên trường 'images' (`uploadMultipleImages`).
// POST /api/centers/:id/reviews
router.post(
  "/:id/reviews",
  authMiddleware,
  uploadMultipleImages,
  handleUploadError,
  checkReviewLimit, // Áp dụng giới hạn số lượng review mỗi user cho 1 trung tâm.
  centersController.addReview
);


// --- Các Route Quản Trị Theo ID (Admin) ---
// Các endpoint này yêu cầu quyền admin để thực hiện các thay đổi trên một trung tâm cụ thể.

// Cập nhật thông tin của một trung tâm.
// PUT /api/centers/:id
router.put("/:id", adminMiddleware, centersController.updateCenter);

// Xóa một trung tâm.
// DELETE /api/centers/:id
router.delete("/:id", adminMiddleware, centersController.deleteCenter);

// Thay đổi trạng thái xác thực (duyệt hoặc hủy duyệt) của một trung tâm.
// PUT /api/centers/:id/verify
router.put("/:id/verify", adminMiddleware, centersController.verifyCenter);

// Xóa một bài đánh giá cụ thể khỏi một trung tâm cụ thể.
// DELETE /api/centers/:centerId/reviews/:reviewId
router.delete(
  "/:centerId/reviews/:reviewId",
  adminMiddleware,
  centersController.deleteReview
);

export default router;
