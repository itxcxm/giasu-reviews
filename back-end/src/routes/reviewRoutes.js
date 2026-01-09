import { reviewController } from "../controllers/reviewController.js";
import { adminMiddleware, authMiddleware } from "../middlewares/auth.js";
import { Router } from "express";

const router = Router();

// Lấy tất cả các bài đánh giá trong hệ thống.
// Chỉ admin mới có quyền truy cập.
// GET /api/reviews/
router.get("/", adminMiddleware, reviewController.getAllReviews);

// Lấy tất cả các bài đánh giá của một người dùng cụ thể.
// Yêu cầu người dùng phải đăng nhập.
// GET /api/reviews/user/:userId
router.get("/user/:userId", authMiddleware, reviewController.getUserReviews);

// Xóa một bài đánh giá theo ID của nó.
// Chỉ admin mới có quyền truy cập.
// DELETE /api/reviews/:reviewId
router.delete("/:reviewId", adminMiddleware, reviewController.deleteReview);

// Người dùng tự xóa bài đánh giá của chính họ.
// Yêu cầu người dùng phải đăng nhập.
// DELETE /api/reviews/me/:reviewId
router.delete("/me/:reviewId", authMiddleware, reviewController.deleteOwnReview);


// Cập nhật trạng thái của một bài đánh giá.
// Chỉ admin mới có quyền truy cập.
// PATCH /api/reviews/:reviewId/status
router.patch("/:reviewId/status", adminMiddleware, reviewController.updateReviewStatus);


// Lấy tất cả các bài đánh giá của một trung tâm cụ thể.
// Route này công khai, không yêu cầu xác thực.
// GET /api/reviews/center/:centerId
router.get("/center/:centerId", reviewController.getCenterReviews);

export default router;
