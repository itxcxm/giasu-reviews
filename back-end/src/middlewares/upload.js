import multer from "multer";
import { HTTP_STATUS } from "../utils/constants.js";

// Cấu hình multer để lưu file tải lên vào bộ nhớ (RAM) dưới dạng Buffer.
// Cách này hiệu quả cho việc xử lý ảnh ngay sau khi upload (ví dụ: gửi đến một dịch vụ khác)
// mà không cần ghi và xóa file tạm thời trên đĩa cứng của server.
const storage = multer.memoryStorage();

// Bộ lọc file, đảm bảo chỉ các file có mimetype bắt đầu bằng 'image/' (tức là file ảnh) mới được chấp nhận.
// Nếu file không phải là ảnh, một lỗi sẽ được tạo ra.
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Chấp nhận file
  } else {
    // Từ chối file và gửi kèm một thông báo lỗi
    cb(new Error("Chỉ chấp nhận các định dạng file ảnh."), false);
  }
};

// Khởi tạo middleware multer với các cấu hình đã định nghĩa.
const upload = multer({
  storage: storage, // Sử dụng bộ nhớ làm nơi lưu trữ.
  fileFilter: fileFilter, // Áp dụng bộ lọc file ảnh.
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn kích thước mỗi file là 10MB.
    files: 5,                   // Giới hạn số lượng file tối đa trong một request là 5.
  },
});

// Middleware để xử lý việc tải lên nhiều file ảnh cùng lúc.
// Các file này phải được gửi trong một trường (field) có tên là 'images'. Tối đa 5 file.
export const uploadMultipleImages = upload.array("images", 5);

// Middleware để xử lý việc tải lên một file ảnh duy nhất.
// File này phải được gửi trong một trường có tên là 'image'.
// Dùng để tương thích với các phiên bản client cũ hơn.
export const uploadSingleImage = upload.single("image");

// Middleware chuyên xử lý các lỗi phát sinh từ multer.
// Nó sẽ bắt các lỗi như vượt quá kích thước, quá số lượng file, sai tên trường, etc.
// Middleware này nên được đặt ngay sau các middleware upload trong định nghĩa route.
export const handleUploadError = (err, req, res, next) => {
  // Nếu lỗi là một instance của MulterError, ta có thể xử lý các mã lỗi cụ thể.
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Kích thước file vượt quá giới hạn cho phép (tối đa 10MB).",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Số lượng file tải lên vượt quá giới hạn (tối đa 5 file).",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Tên trường (field name) không hợp lệ. Sử dụng 'images' cho nhiều file hoặc 'image' cho một file.",
      });
    }
    // Các lỗi Multer khác.
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Lỗi khi tải file lên: ${err.message}`,
    });
  }
  // Nếu là lỗi khác (ví dụ từ fileFilter).
  if (err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message || "Đã có lỗi xảy ra khi tải file.",
    });
  }
  // Nếu không có lỗi, chuyển tiếp sang middleware tiếp theo.
  next();
};
