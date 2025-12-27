/**
 * @file app.js
 * @description Tệp khởi tạo chính của ứng dụng Express.
 *              Cấu hình các middleware, routes, xử lý lỗi và khởi động server.
 * @requires dotenv: Để tải các biến môi trường từ tệp .env.
 * @requires express: Framework web chính.
 * @requires cors: Middleware để xử lý Cross-Origin Resource Sharing.
 * @requires cookie-parser: Middleware để phân tích cú pháp cookie.
 * @requires ./config/database: Hàm kết nối đến cơ sở dữ liệu MongoDB.
 * @requires ./routes/*: Các tệp định tuyến cho từng phần của API.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";
import adminRoutes from "./routes/adminRoutes.js";
import centersRoutes from "./routes/centersRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 8080; // Sử dụng cổng từ .env hoặc mặc định 8080

// Trust proxy để lấy đúng địa chỉ IP của client khi ứng dụng chạy sau một proxy (ví dụ: Nginx, Vercel).
// Cần thiết để các cơ chế như rate limiting hoạt động chính xác. `1` nghĩa là tin tưởng proxy đầu tiên.
app.set("trust proxy", 1);

// Cấu hình các nguồn (origin) được phép truy cập API qua CORS
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

/**
 * @middleware cors
 * @description Cấu hình Cross-Origin Resource Sharing (CORS) để kiểm soát việc truy cập API từ các domain khác nhau.
 * - origin: Xác định các nguồn được phép. Hỗ trợ wildcard. Cho phép các request không có origin (VD: Postman).
 * - credentials: true - Cho phép trình duyệt gửi cookie và header Authorization kèm theo request.
 * - methods: Các phương thức HTTP được phép.
 * - allowedHeaders: Các header được phép trong request.
 * - exposedHeaders: Các header mà trình duyệt client có thể truy cập, ở đây là 'Set-Cookie' để client nhận cookie.
 */
app.use(
  cors({
    origin: function (origin, callback) {
      // Chấp nhận các request không có origin (ví dụ: app mobile, Postman, cURL, server-side)
      if (!origin) return callback(null, true);

      // Kiểm tra xem origin của request có nằm trong danh sách được phép hay không.
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        // Hỗ trợ wildcard ('*') để khớp với subdomain, ví dụ: 'https://*.example.com'
        if (allowedOrigin.includes("*")) {
          const pattern = allowedOrigin.replace(/\*/g, ".*");
          return new RegExp(`^${pattern}$`).test(origin);
        }
        // So khớp chính xác hoặc kiểm tra tiền tố (ví dụ cho Vercel preview URLs)
        return origin === allowedOrigin || origin.startsWith(allowedOrigin);
      });

      // Cho phép truy cập nếu origin hợp lệ hoặc trong môi trường development
      if (isAllowed || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked origin:", origin);
        console.log("✅ Allowed origins:", allowedOrigins);
        callback(new Error(`Origin '${origin}' is not allowed by CORS.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Middleware để phân tích cú pháp cookie từ header `Cookie` của request
app.use(cookieParser());
// Middleware để phân tích cú pháp body của request dưới dạng JSON.
// Tăng giới hạn kích thước lên 10MB để hỗ trợ upload ảnh dạng base64.
app.use(express.json({ limit: "10mb" }));
// Middleware để phân tích cú pháp body của request được mã hóa URL (form data).
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// =================================================================
// ROUTES KIỂM TRA & API
// =================================================================

// Route gốc để kiểm tra server có đang hoạt động hay không
app.get("/", (req, res) => {
  res.json({
    message: "Server is running smoothly.",
    timestamp: new Date().toISOString(),
  });
});

// Route 'health check' thường được dùng bởi các dịch vụ giám sát (monitoring)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Đăng ký các router xử lý cho từng nhóm API
app.use("/api/admin", adminRoutes);
app.use("/api/centers", centersRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reviews", reviewRoutes);

// =================================================================
// MIDDLEWARE XỬ LÝ LỖI
// =================================================================

// Middleware bắt các request đến route không tồn tại (lỗi 404)
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found.",
    path: req.originalUrl,
  });
});

/**
 * @middleware Global Error Handler
 * @description Middleware xử lý lỗi tập trung. Bất kỳ lỗi nào được `next(err)` từ các route hay middleware khác
 *              sẽ được chuyển đến đây để xử lý và trả về một response lỗi thống nhất.
 * @param {Error} err - Đối tượng lỗi được truyền vào.
 * @param {express.Request} req - Đối tượng request.
 * @param {express.Response} res - Đối tượng response.
 * @param {express.NextFunction} next - Hàm next.
 */
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler:", err.stack);

  // Xử lý lỗi từ CORS
  if (err.message.includes("is not allowed by CORS")) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tài nguyên này do chính sách CORS.",
      error: process.env.NODE_ENV === "development" ? err.message : {},
    });
  }

  // Xử lý lỗi kích thước payload quá lớn
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      message:
        "Kích thước dữ liệu quá lớn. Vui lòng giảm số lượng hoặc kích thước ảnh.",
      error: process.env.NODE_ENV === "development" ? err.message : {},
    });
  }

  // Xử lý các lỗi khác và trả về lỗi 500 (Internal Server Error) mặc định
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Đã có lỗi xảy ra trên server.",
    // Chỉ hiển thị chi tiết lỗi (stack trace) trong môi trường development
    error: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});

/**
 * @function startServer
 * @description Khởi động ứng dụng. Bao gồm việc kết nối đến cơ sở dữ liệu
 *              và sau đó lắng nghe các kết nối đến trên cổng đã định.
 */
const startServer = async () => {
  try {
    console.log("🚀 Attempting to start the server...");

    // Kết nối đến cơ sở dữ liệu MongoDB
    await connectDB();

    // Khởi động server Express để lắng nghe các request
    app.listen(PORT, () => {
      console.log("=".repeat(50));
      console.log(`✅ Server is running at http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log("=".repeat(50));
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error("💡 Please check the following:");
    console.error("   1. MongoDB is installed and running.");
    console.error("   2. The .env file is correctly configured.");
    console.error("   3. The port is not being used by another process.");
    process.exit(1); // Thoát khỏi tiến trình nếu không thể khởi động server
  }
};

// Gọi hàm để bắt đầu toàn bộ ứng dụng
startServer();
