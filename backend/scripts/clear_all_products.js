/**
 * Script xóa TOÀN BỘ sản phẩm khỏi MongoDB + products.json
 * Dùng đúng model Product từ project để xóa đúng collection
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import đúng Product model từ project
import Product from "../models/Product.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ Không tìm thấy MONGODB_URI trong .env");
  process.exit(1);
}

const backendProductsPath = path.join(__dirname, "../data/products.json");
const frontendProductsPath = path.join(__dirname, "../../fontend/src/data/products.json");

async function nukeAllProducts() {
  console.log("💥 XÓA TOÀN BỘ SẢN PHẨM\n");

  // 1. Xóa products.json backend
  try {
    fs.writeFileSync(backendProductsPath, "[]", "utf8");
    console.log("✅ backend/data/products.json → đã xóa sạch (set = [])");
  } catch (err) {
    console.error("❌ Lỗi xóa backend/data/products.json:", err.message);
  }

  // 2. Xóa products.json frontend
  try {
    if (fs.existsSync(frontendProductsPath)) {
      fs.writeFileSync(frontendProductsPath, "[]", "utf8");
      console.log("✅ fontend/src/data/products.json → đã xóa sạch (set = [])");
    }
  } catch (err) {
    console.error("❌ Lỗi xóa frontend products.json:", err.message);
  }

  // 3. Kết nối MongoDB và xóa collection products
  console.log("\n🔗 Kết nối MongoDB Atlas...");
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 30000,
    });
    console.log("✅ Đã kết nối MongoDB Atlas");

    // Xóa tất cả documents trong collection products
    const result = await Product.deleteMany({});
    console.log(`✅ Đã xóa ${result.deletedCount} sản phẩm khỏi MongoDB collection 'products'`);

    // Verify xóa thành công
    const remaining = await Product.countDocuments();
    console.log(`🔍 Số sản phẩm còn lại trong MongoDB: ${remaining}`);

    await mongoose.disconnect();
    console.log("✅ Đã ngắt kết nối MongoDB");
  } catch (err) {
    console.error("❌ Lỗi MongoDB:", err.message);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }

  console.log("\n🎉 XONG! Tất cả sản phẩm đã bị xóa hoàn toàn.");
  console.log("📝 Bây giờ bạn có thể import dữ liệu mới.");
}

nukeAllProducts();
