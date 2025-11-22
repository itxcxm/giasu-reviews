import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";
import adminRouter from "./routes/adminRouter.js";
import centersRouter from "./routes/centersRouter.js";

const app = express();
const PORT = process.env.PORT;

// Trust proxy để lấy đúng IP từ headers (khi đứng sau proxy/load balancer)
// Cần thiết cho rate limiting hoạt động chính xác
app.set("trust proxy", 1);

// Cấu hình các nguồn cho phép truy cập CORS
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

// Thiết lập middleware CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: function (origin, callback) {
      // Chấp nhận request không có origin (ví dụ: app mobile, POSTMAN, CURL, server-side requests)
      if (!origin) return callback(null, true);

      // Kiểm tra nếu origin khớp với bất kỳ allowed origin nào
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        // Hỗ trợ wildcard hoặc exact match
        if (allowedOrigin.includes("*")) {
          const pattern = allowedOrigin.replace("*", ".*");
          return new RegExp(`^${pattern}$`).test(origin);
        }
        return origin === allowedOrigin || origin.startsWith(allowedOrigin);
      });

      // Nếu nguồn nằm trong danh sách cho phép hoặc đang ở môi trường development
      if (isAllowed || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        // Log để debug
        console.log("CORS blocked origin:", origin);
        console.log("Allowed origins:", allowedOrigins);
        // Nếu nguồn không hợp lệ, trả về lỗi
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true, // Cho phép gửi cookie qua CORS
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Thiết lập middleware xử lý cookie và các dữ liệu body
app.use(cookieParser());
// Tăng giới hạn kích thước body để hỗ trợ upload nhiều ảnh base64 (tối đa 5 ảnh x 10MB = 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Định nghĩa route gốc kiểm tra server hoạt động
app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Định nghĩa route kiểm tra sức khỏe hệ thống
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Đăng ký router cho API
app.use("/api/admin", adminRouter);
app.use("/api/centers", centersRouter);

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

  // Xử lý lỗi PayloadTooLargeError
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      message:
        "Kích thước dữ liệu quá lớn. Vui lòng giảm số lượng hoặc kích thước ảnh.",
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
    console.log("🚀 Đang khởi động server...");

    // Kết nối database
    await connectDB();

    // Khởi động server lắng nghe cổng PORT
    app.listen(PORT, () => {
      console.log("=".repeat(50));
      console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log("=".repeat(50));
    });
  } catch (error) {
    console.error("❌ Không thể khởi động server:", error.message);
    console.error("💡 Vui lòng kiểm tra:");
    console.error("   1. MongoDB đã được cài đặt và đang chạy");
    console.error("   2. File .env đã được cấu hình đúng");
    console.error("   3. Port không bị chiếm bởi process khác");
    process.exit(1);
  }
};

// Thực thi khởi động server
startServer();
