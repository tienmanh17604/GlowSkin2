import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import SkinTrainingKnowledge from "../models/SkinTrainingKnowledge.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedSkinTrainingKnowledge() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ MONGODB_URI chưa được khai báo trong file .env");
    process.exit(1);
  }

  const jsonPath = path.join(__dirname, "../data/training_ai_skin_knowledge.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("❌ Không tìm thấy file data: training_ai_skin_knowledge.json");
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`\n==================================================`);
  console.log(`Đang kết nối tới MongoDB Atlas...`);

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✅ Kết nối MongoDB Atlas thành công!`);

  console.log(`\nĐang làm sạch bộ sưu tập (collection) SkinTrainingKnowledge cũ...`);
  await SkinTrainingKnowledge.deleteMany({});

  console.log(`Đang đẩy ${rawData.length} hồ sơ bệnh lý & đặc tính thị giác từ file Excel vào MongoDB...`);

  const inserted = await SkinTrainingKnowledge.insertMany(rawData);
  console.log(`\n🎉 ĐÃ ĐẨY THÀNH CÔNG ${inserted.length} BẢN GHI TRAINING AI VÀO MONGODB ATLAS!`);

  // Category breakdown
  console.log(`\n================== THỐNG KÊ DANH MỤC TRAINING ==================`);
  const categories = await SkinTrainingKnowledge.distinct("category");
  for (const cat of categories) {
    const count = await SkinTrainingKnowledge.countDocuments({ category: cat });
    const conditions = await SkinTrainingKnowledge.find({ category: cat }).select("condition");
    const condNames = conditions.map(c => c.condition).join(", ");
    console.log(`📍 [${cat}] (${count} tình trạng): ${condNames}`);
  }
  console.log(`=================================================================\n`);

  await mongoose.disconnect();
  console.log(`Đã ngắt kết nối MongoDB. Đẩy dữ liệu hoàn tất!`);
}

seedSkinTrainingKnowledge().catch((err) => {
  console.error("❌ Lỗi khi đẩy dữ liệu Training AI vào MongoDB:", err);
  process.exit(1);
});
