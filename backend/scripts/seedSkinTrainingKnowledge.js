import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as xlsxModule from "xlsx";
import SkinTrainingKnowledge from "../models/SkinTrainingKnowledge.js";

const xlsx = xlsxModule.default || xlsxModule;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedSkinTrainingKnowledge() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ MONGODB_URI chưa được khai báo trong file .env");
    process.exit(1);
  }

  const excelPath = path.join(__dirname, "../data/Training AI mô tả.xlsx");
  const jsonPath = path.join(__dirname, "../data/training_ai_skin_knowledge.json");

  let rawData = [];

  if (fs.existsSync(excelPath)) {
    console.log(`Đang đọc trực tiếp từ file Excel mới nhất: 'Training AI mô tả.xlsx'...`);
    const workbook = xlsx.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json(worksheet);

    let currentCategory = "Mụn không viêm";
    rawData = rawRows.map((row, index) => {
      const cat = row["Skin Concern Category"];
      if (cat && cat.trim()) {
        currentCategory = cat.trim();
      }

      const rawIngredients = row["Recommended Ingredients"] || "";
      const ingredientsArr = rawIngredients
        ? rawIngredients
            .split(/[,;\n]+/)
            .map((i) => i.trim())
            .filter(Boolean)
        : [];

      return {
        index: index + 1,
        conditionId: `skin_train_${index + 1}`,
        category: currentCategory,
        condition: (row["Condition"] || "").trim(),
        description: (row["Description"] || "").trim(),
        visualSigns: (row["Visual Signs"] || "").trim(),
        color: (row["Color"] || "").trim(),
        texture: (row["Texture"] || "").trim(),
        elevation: (row["Elevation"] || "").trim(),
        typicalSize: (row["Typical Size"] || "").trim(),
        distribution: (row["Distribution"] || "").trim(),
        inflammation: (row["Inflammation"] || "").trim(),
        distinctiveFeatures: (row["Distinctive Features"] || "").trim(),
        lookalikes: (row["Lookalikes"] || "").trim(),
        causes: (row["Causes"] || "").trim(),
        recommendedIngredients: ingredientsArr,
        recommendedIngredientsRaw: rawIngredients.trim(),
        careTips: (row["Care Tips"] || "").trim(),
        whenToSeekHelp: (row["When to Seek Help"] || "").trim(),
        sourceUrl: (row["Source URL"] || "").trim()
      };
    });

    fs.writeFileSync(jsonPath, JSON.stringify(rawData, null, 2), "utf-8");
    console.log(`✅ Đã đồng bộ ${rawData.length} bản ghi sang file JSON.`);
  } else if (fs.existsSync(jsonPath)) {
    rawData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } else {
    console.error("❌ Không tìm thấy file data Excel hoặc JSON!");
    process.exit(1);
  }

  console.log(`\n==================================================`);
  console.log(`Đang kết nối tới MongoDB Atlas...`);

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✅ Kết nối MongoDB Atlas thành công!`);

  console.log(`\nĐang làm sạch bộ sưu tập (collection) SkinTrainingKnowledge cũ...`);
  await SkinTrainingKnowledge.deleteMany({});

  console.log(`Đang đẩy ${rawData.length} hồ sơ bệnh lý & đặc tính thị giác từ file Excel vào MongoDB...`);

  const inserted = await SkinTrainingKnowledge.insertMany(rawData);
  console.log(`\n🎉 ĐÃ ĐẨY THÀNH CÔNG ${inserted.length} BẢN GHI TRAINING AI TỪ EXCEL VÀO MONGODB ATLAS!`);

  // Category breakdown
  console.log(`\n================== THỐNG KÊ DANH MỤC TRAINING ==================`);
  const categories = await SkinTrainingKnowledge.distinct("category");
  for (const cat of categories) {
    const count = await SkinTrainingKnowledge.countDocuments({ category: cat });
    const conditions = await SkinTrainingKnowledge.find({ category: cat }).select("condition");
    const condNames = conditions.map((c) => c.condition).join(", ");
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
