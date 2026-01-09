import { ReviewRepository } from '../repositories/reviewRepository.js';
import { CentersRepository } from '../repositories/centersRepository.js';

// Khởi tạo một instance của ReviewRepository để sử dụng trong service.
const reviewRepository = new ReviewRepository();
const centersRepository = new CentersRepository();

// Lớp ReviewService chứa business logic cho các hoạt động liên quan đến đánh giá.
// Hiện tại, lớp này chủ yếu đóng vai trò trung gian, gọi các phương thức từ repository.
// Trong tương lai, có thể thêm các logic phức tạp hơn ở đây (ví dụ: gửi email thông báo khi có review mới).
export class ReviewService {
  // Lấy tất cả các bài đánh giá, chuyển tiếp yêu cầu đến repository.
  async getAllReviews(options) {
    return await reviewRepository.findAll(options);
  }

  // Lấy các bài đánh giá của một người dùng cụ thể.
  async getReviewsByUserId(userId) {
    return await reviewRepository.findByUserId(userId);
  }

  // Xóa một bài đánh giá.
  async deleteReview(reviewId) {
    const review = await reviewRepository.findById(reviewId);
    if (review) {
      await reviewRepository.delete(reviewId);
      await centersRepository.updateCenterStatistics(review.center);
    }
  }

  // Người dùng xóa bài đánh giá của chính họ
  async deleteOwnReview(reviewId, userId) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      // Nếu không tìm thấy review, có thể coi như đã xóa thành công hoặc throw lỗi.
      // Ở đây ta chọn không làm gì để tránh lộ thông tin.
      return; 
    }

    // So sánh ID người dùng sở hữu review với ID người dùng đang thực hiện yêu cầu.
    // Cần chuyển đổi ObjectId sang string để so sánh.
    if (review.user.toString() !== userId) {
      throw new Error('Forbidden'); // Lỗi sẽ được bắt ở controller
    }

    // Nếu đúng là chủ sở hữu, tiến hành xóa.
    await reviewRepository.delete(reviewId);
    // Cập nhật lại thống kê cho trung tâm.
    await centersRepository.updateCenterStatistics(review.center);
  }

  async updateReviewStatus(reviewId, status) {
    const updatedReview = await reviewRepository.update(reviewId, { status });
    if (updatedReview) {
      await centersRepository.updateCenterStatistics(updatedReview.center);
    }
    return updatedReview;
  }

  // Lấy các bài đánh giá của một trung tâm cụ thể.
  async getReviewsByCenterId(centerId) {
    return await reviewRepository.findByCenterId(centerId);
  }
}
