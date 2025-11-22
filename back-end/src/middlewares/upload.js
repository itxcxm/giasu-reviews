import multer from "multer";
import { HTTP_STATUS } from "../utils/constants.js";

// Cấu hình multer để lưu file vào memory (không lưu vào disk)
const storage = multer.memoryStorage();

// Cấu hình file filter - chỉ chấp nhận ảnh
const fileFilter = (req, file, cb) => {
  // Kiểm tra định dạng file
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Chỉ chấp nhận file ảnh (PNG, JPG, JPEG, GIF, WEBP, HEIC, HEIF)"
      ),
      false
    );
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB mỗi file
    files: 5, // Tối đa 5 files
  },
});

// Middleware để upload nhiều ảnh (field name: images)
export const uploadMultipleImages = upload.array("images", 5);

// Middleware để upload 1 ảnh (field name: image) - backward compatibility
export const uploadSingleImage = upload.single("image");

// Middleware xử lý lỗi multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Kích thước file quá lớn. Mỗi file tối đa 10MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Số lượng file quá nhiều. Tối đa 5 file.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message:
          "Field name không hợp lệ. Sử dụng 'images' cho nhiều file hoặc 'image' cho 1 file.",
      });
    }
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Lỗi upload file: ${err.message}`,
    });
  }
  if (err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message || "Lỗi upload file",
    });
  }
  next();
};
