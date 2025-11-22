import mongoose from "mongoose";

async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI không được cấu hình trong file .env");
    }

    console.log("🔌 Đang kết nối đến MongoDB...");

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10 giây timeout
    });

    console.log("✅ Đã kết nối MongoDB thành công!");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);

    if (err.name === "MongoServerSelectionError") {
      console.error("\n💡 Hướng dẫn khắc phục:");
      console.error("   1. Kiểm tra MongoDB đã được cài đặt và đang chạy");
      console.error("   2. Kiểm tra MONGODB_URI trong file .env");
      console.error("   3. Nếu dùng MongoDB local: mongod");
      console.error(
        "   4. Nếu dùng MongoDB Atlas: kiểm tra connection string và network access"
      );
    }

    process.exit(1);
  }
}

export default connectDB;
