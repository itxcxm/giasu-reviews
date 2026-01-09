import { ReviewService } from "../services/reviewService.js";
import { HTTP_STATUS } from "../utils/constants.js";

// Khởi tạo review service để sử dụng trong controller.
const reviewService = new ReviewService();

// Lớp ReviewController chứa các phương thức xử lý logic cho các route liên quan đến đánh giá.
class ReviewController {
  // Lấy tất cả các bài đánh giá trên toàn hệ thống (dành cho admin).
  // Có hỗ trợ tìm kiếm và sắp xếp.
  getAllReviews = async (req, res) => {
    try {
      const {
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const options = {
        search,
        sortBy,
        sortOrder,
      };

      const reviews = await reviewService.getAllReviews(options);
      res.status(HTTP_STATUS.OK).json({ success: true, data: reviews });
    } catch (error) {
      console.error("Lỗi khi lấy tất cả đánh giá:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Không thể lấy danh sách đánh giá." });
    }
  };

  // Lấy tất cả các bài đánh giá của một người dùng cụ thể.
  getUserReviews = async (req, res) => {
    try {
      const { userId } = req.params;
      const reviews = await reviewService.getReviewsByUserId(userId);
      res.status(HTTP_STATUS.OK).json({ success: true, data: reviews });
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá của người dùng:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({
          success: false,
          message: "Không thể lấy đánh giá của người dùng.",
        });
    }
  };

  // Xóa một bài đánh giá dựa trên ID của nó (dành cho admin hoặc chính người dùng đó).
  deleteReview = async (req, res) => {
    try {
      const { reviewId } = req.params;
      await reviewService.deleteReview(reviewId);
      res
        .status(HTTP_STATUS.OK)
        .json({ success: true, message: "Đã xóa đánh giá thành công." });
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Không thể xóa đánh giá." });
    }
  };

  // Người dùng tự xóa bài đánh giá của chính họ.
  deleteOwnReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id; // Lấy từ authMiddleware

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Yêu cầu xác thực." });
        }

        await reviewService.deleteOwnReview(reviewId, userId);
        res.status(HTTP_STATUS.OK).json({ success: true, message: "Đã xóa đánh giá của bạn thành công." });
    } catch (error) {
        console.error("Lỗi khi người dùng xóa đánh giá:", error);
        
        if (error.message === 'Forbidden') {
             return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: "Bạn không có quyền xóa đánh giá này." });
        }
        
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Không thể xóa đánh giá." });
    }
  };


  updateReviewStatus = async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Trạng thái không hợp lệ.' });
      }

      await reviewService.updateReviewStatus(reviewId, status);

      res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật trạng thái đánh giá thành công.' });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đánh giá:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Không thể cập nhật trạng thái đánh giá." });
    }
  };

  // Lấy tất cả các bài đánh giá của một trung tâm cụ thể.
  getCenterReviews = async (req, res) => {
    try {
      const { centerId } = req.params;
      const reviews = await reviewService.getReviewsByCenterId(centerId);
      res.status(HTTP_STATUS.OK).json({ success: true, data: reviews });
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá của trung tâm:", error);
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({
          success: false,
          message: "Không thể lấy đánh giá của trung tâm.",
        });
    }
  };
}

// Xuất ra một instance của controller để sử dụng trong routes.
export const reviewController = new ReviewController();
