import mongoose from "mongoose";

async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    // Kiểm tra xem chuỗi kết nối có tồn tại trong file .env không
    if (!mongoURI) {
      throw new Error(" biến môi trường MONGODB_URI chưa được cấu hình trong file .env");
    }

    console.log("🔌 Đang kết nối đến cơ sở dữ liệu MongoDB...");

    // Thực hiện kết nối bằng Mongoose
    await mongoose.connect(mongoURI, {
      // Cấu hình thời gian chờ để chọn server, hữu ích khi kết nối tới Replica Set
      serverSelectionTimeoutMS: 10000, // Timeout sau 10 giây
    });

    console.log("✅ Kết nối MongoDB thành công!");
    console.log(`📊 Tên cơ sở dữ liệu: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);

    // Cung cấp hướng dẫn chi tiết hơn cho các lỗi thường gặp
    if (err.name === "MongoServerSelectionError") {
      console.error("\n💡 Gợi ý khắc phục:");
      console.error("   1. Đảm bảo dịch vụ MongoDB đang chạy (lệnh `mongod` cho local).");
      console.error("   2. Kiểm tra lại chuỗi `MONGODB_URI` trong tệp .env có chính xác không.");
      console.error("   3. Nếu dùng MongoDB Atlas, xác nhận địa chỉ IP của bạn đã được thêm vào danh sách truy cập (IP Access List).");
      console.error("   4. Kiểm tra tường lửa (firewall) có đang chặn kết nối đến cổng 27017 không.");
    }

    // Dừng toàn bộ ứng dụng nếu không thể kết nối đến DB, vì đây là một lỗi nghiêm trọng.
    process.exit(1);
  }
}

export default connectDB;
