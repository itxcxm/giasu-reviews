import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/database.js";
import userRouter from "./routes/userRouter.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình các nguồn cho phép truy cập CORS
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

// Thiết lập middleware CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: function (origin, callback) {
      // Chấp nhận request không có origin (ví dụ: app mobile, POSTMAN, CURL)
      if (!origin) return callback(null, true);

      // Nếu nguồn nằm trong danh sách cho phép hoặc đang ở môi trường development
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        // Nếu nguồn không hợp lệ, trả về lỗi
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Cho phép gửi cookie qua CORS
  })
);

// Thiết lập middleware xử lý cookie và các dữ liệu body
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Định nghĩa route gốc kiểm tra server hoạt động


// Định nghĩa route kiểm tra sức khỏe hệ thống


// Đăng ký router cho API user
// app.use("/api/auth", authRouter);
// app.use("/api/projects", projectRouter);
// app.use("/api/tasks", taskRouter);

// Xử lý route không tồn tại (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  // Xử lý lỗi CORS
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "Not allowed by CORS",
      error: process.env.NODE_ENV === "development" ? err.message : {},
    });
  }

  // Xử lý lỗi mặc định
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});

// Hàm khởi động server (kết nối DB và lắng nghe kết nối)
const startServer = async () => {
  try {
    // Kết nối database
    await connectDB();

    // Khởi động server lắng nghe cổng PORT
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Không thể khởi động server:", error);
    process.exit(1);
  }
};

// Thực thi khởi động server
startServer();
