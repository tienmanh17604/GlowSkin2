import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';
import SkinDiseaseKnowledge from '../models/SkinDiseaseKnowledge.js';

dotenv.config();

// Force Google DNS to properly resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedSkinDiseaseKnowledgeBase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI chưa được khai báo trong file .env');
    process.exit(1);
  }

  const jsonPath = path.join(__dirname, '../data/skin_disease_knowledge_base.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Không tìm thấy file data: skin_disease_knowledge_base.json');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const { source, purpose, lesion_features_for_vision = [], chapters = [] } = rawData;

  console.log(`\n==================================================`);
  console.log(`Đang kết nối tới MongoDB Atlas...`);

  await mongoose.connect(mongoUri);
  console.log(`✅ Kết nối MongoDB Atlas thành công!`);

  console.log(`\nĐang làm sạch bộ sưu tập (collection) SkinDiseaseKnowledge cũ...`);
  await SkinDiseaseKnowledge.deleteMany({});

  const documentsToInsert = [];
  let globalCounter = 1;

  for (const chapter of chapters) {
    const categoryName = chapter.category_vi || 'Bệnh da liễu khác';
    const diseases = chapter.diseases || [];

    for (const disease of diseases) {
      const visualFeaturesText = (disease.clinical_visual_features || '').toLowerCase();
      
      // Auto-extract matching lesion features for vision AI search
      const matchedLesions = lesion_features_for_vision.filter((feature) => {
        const pattern = new RegExp(`\\b${feature}\\b|${feature}`, 'i');
        return pattern.test(visualFeaturesText);
      });

      documentsToInsert.push({
        diseaseId: `skin_disease_${globalCounter++}`,
        category_vi: categoryName,
        name_vi: disease.name_vi,
        name_source: disease.name_source || disease.name_vi,
        english_alias: disease.english_alias || null,
        source_page: disease.source_page || null,
        clinical_visual_features: disease.clinical_visual_features || '',
        ai_note: disease.ai_note || 'Image findings are supportive only; do not treat as a definitive diagnosis.',
        lesion_features: matchedLesions,
        sourceInfo: source || { title: 'Hướng dẫn chẩn đoán và điều trị các bệnh da liễu', publisher: 'Bộ Y tế', year: 2023 },
        purpose: purpose || 'Knowledge base for skincare and skin-image analysis'
      });
    }
  }

  console.log(`Đang đẩy ${documentsToInsert.length} bệnh da liễu từ ${chapters.length} chương vào MongoDB Atlas...`);
  const inserted = await SkinDiseaseKnowledge.insertMany(documentsToInsert);
  console.log(`\n🎉 ĐÃ ĐẨY THÀNH CÔNG ${inserted.length} BỆNH DA LIỄU VÀO MONGODB ATLAS!`);

  // Print statistics breakdown
  console.log(`\n================== THỐNG KÊ CHI TIẾT ==================`);
  for (const chapter of chapters) {
    const count = await SkinDiseaseKnowledge.countDocuments({ category_vi: chapter.category_vi });
    console.log(`📍 ${chapter.category_vi}: ${count} bệnh`);
  }

  const taggedWithLesionsCount = await SkinDiseaseKnowledge.countDocuments({ 'lesion_features.0': { $exists: true } });
  console.log(`--------------------------------------------------`);
  console.log(`✨ Số lượng bệnh đã bóc tách được nhãn tổn thương (lesion_features): ${taggedWithLesionsCount}/${inserted.length}`);
  console.log(`==================================================\n`);

  await mongoose.disconnect();
  console.log(`Đã ngắt kết nối MongoDB. Đẩy dữ liệu hoàn tất!`);
}

seedSkinDiseaseKnowledgeBase().catch((err) => {
  console.error('❌ Lỗi khi đẩy dữ liệu Skin Disease Knowledge Base vào MongoDB:', err);
  process.exit(1);
});
