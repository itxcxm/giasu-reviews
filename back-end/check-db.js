// Script kiểm tra kết nối database
import "dotenv/config";
import mongoose from "mongoose";

const checkDatabase = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/giasu-reviews";

    console.log("🔍 Đang kiểm tra kết nối database...");
    console.log(`📝 MONGODB_URI: ${mongoURI.replace(/\/\/.*@/, "//***:***@")}`);

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ Kết nối database thành công!");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔌 Port: ${mongoose.connection.port}`);

    // Kiểm tra collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(`\n📚 Collections (${collections.length}):`);
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Đóng kết nối thành công!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi kết nối database:", error.message);

    if (error.name === "MongoServerSelectionError") {
      console.error("\n💡 Hướng dẫn khắc phục:");
      console.error("   1. Kiểm tra MongoDB đã được cài đặt chưa");
      console.error("   2. Khởi động MongoDB:");
      console.error("      - Windows: net start MongoDB");
      console.error("      - Linux/Mac: sudo systemctl start mongod");
      console.error("      - Hoặc: mongod");
      console.error("   3. Kiểm tra MONGODB_URI trong file .env");
    } else if (error.name === "MongoNetworkError") {
      console.error("\n💡 Lỗi mạng:");
      console.error("   1. Kiểm tra MongoDB có đang chạy không");
      console.error("   2. Kiểm tra firewall có chặn port 27017 không");
    }

    process.exit(1);
  }
};

checkDatabase();
