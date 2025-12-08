import { Router } from "express";
import { centersController } from "../controllers/centersController.js";
import { adminMiddleware } from "../middlewares/auth.js";
import {
  uploadMultipleImages,
  uploadSingleImage,
  handleUploadError,
} from "../middlewares/upload.js";
import {
  createCenterRateLimiter,
  checkAdminForRateLimit,
} from "../middlewares/rateLimit.js";

const router = Router();

// Public routes - Không cần xác thực
// Lấy danh sách centers (có thể filter theo isVerified, search, pagination)
router.get("/", centersController.getCenters);

// Lấy tất cả centers (dành cho mục đích admin/moderator)
router.get("/all", centersController.getAllCenters);

// Tạo center mới (public - ai cũng có thể thêm, mặc định isVerified = false)
// Phải đặt trước routes có :id để tránh conflict
// Hỗ trợ upload file hình ảnh
// Áp dụng rate limiting: 5 requests mỗi 15 phút từ mỗi IP (bỏ qua cho admin)
router.post(
  "/",
  checkAdminForRateLimit, // Kiểm tra admin trước (set req.isAdmin)
  createCenterRateLimiter, // Rate limiting middleware (bỏ qua nếu req.isAdmin = true)
  uploadSingleImage, // Upload 1 ảnh cho center
  handleUploadError,
  centersController.createCenter
);

// Route riêng cho admin tạo center (không có rate limit)
// Admin có thể tạo center không giới hạn
router.post(
  "/admin/create",
  adminMiddleware, // Yêu cầu xác thực admin
  uploadSingleImage, // Upload 1 ảnh cho center
  handleUploadError,
  centersController.createCenter
);

// Admin routes - Yêu cầu xác thực admin (phải đặt trước routes có :id để tránh conflict)
// Lấy tất cả reviews từ tất cả centers (admin)
router.get("/reviews/all", adminMiddleware, centersController.getAllReviews);

// Lấy center theo ID (phải đặt sau routes cụ thể)
router.get("/:id", centersController.getCenterById);

// Thêm review cho center (public) - hỗ trợ upload file
// Áp dụng rate limiting: 1 request mỗi 1 giờ từ mỗi IP (bỏ qua cho admin)
router.post(
  "/:id/reviews",
  uploadMultipleImages,
  handleUploadError,
  centersController.addReview
);

// Admin routes - Yêu cầu xác thực admin
// Cập nhật center
router.put("/:id", adminMiddleware, centersController.updateCenter);

// Xóa center
router.delete("/:id", adminMiddleware, centersController.deleteCenter);

// Duyệt/hủy duyệt center
router.put("/:id/verify", adminMiddleware, centersController.verifyCenter);

// Xóa review từ center (admin)
router.delete(
  "/:centerId/reviews/:reviewId",
  adminMiddleware,
  centersController.deleteReview
);

export default router;
