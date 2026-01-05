import Review from "../models/Review.js";
import { HTTP_STATUS } from "../utils/constants.js";

export const checkReviewLimit = async (req, res, next) => {
  // Bỏ qua nếu người dùng có vai trò là admin
  if (req.user && req.user.role === "admin") {
    return next();
  }

  try {
    const userId = req.user?.id;
    const centerId = req.params?.id;

    // Kiểm tra xem ID người dùng và ID trung tâm có tồn tại không
    if (!userId || !centerId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Thiếu thông tin người dùng hoặc trung tâm để kiểm tra giới hạn.",
      });
    }

    // Đếm số lượng đánh giá mà người dùng đã viết cho trung tâm này
    const reviewCount = await Review.countDocuments({
      user: userId,
      center: centerId,
    });

    // Nếu số lượng đánh giá từ 3 trở lên, trả về lỗi
    if (reviewCount >= 3) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Bạn đã đạt đến giới hạn 3 đánh giá cho trung tâm này.",
      });
    }

    // Nếu chưa đạt giới hạn, cho phép request tiếp tục
    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra giới hạn đánh giá:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi hệ thống khi kiểm tra giới hạn đánh giá.",
    });
  }
};
