import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';
import MedicalGuideline from '../models/MedicalGuideline.js';

dotenv.config();

// Force Google DNS to properly resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI chưa được khai báo trong file .env');
    process.exit(1);
  }

  const jsonPath = path.join(__dirname, '../data/medical_guidelines.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Không tìm thấy file data: medical_guidelines.json');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`\n==================================================`);
  console.log(`Đang kết nối tới MongoDB Atlas...`);

  await mongoose.connect(mongoUri);
  console.log(`✅ Kết nối MongoDB Atlas thành công!`);

  console.log(`\nĐang làm sạch bộ sưu tập (collection) MedicalGuideline cũ...`);
  await MedicalGuideline.deleteMany({});

  console.log(`Đang đẩy ${rawData.length} bài hướng dẫn Y Khoa & AI Skincare vào MongoDB...`);

  const documentsToInsert = rawData.map(item => ({
    guidelineId: item.id,
    source: item.source || 'Bộ Y Tế / DATA AI',
    title: item.title,
    categories: item.categories || [],
    content: item.content,
    keywords: item.keywords || []
  }));

  const inserted = await MedicalGuideline.insertMany(documentsToInsert);
  console.log(`\n🎉 ĐÃ ĐẨY THÀNH CÔNG ${inserted.length} BÀI HƯỚNG DẪN Y KHOA VÀO MONGODB!`);

  // Breakdown statistics
  const munCount = await MedicalGuideline.countDocuments({ categories: 'Mụn (Acne)' });
  const sacToCount = await MedicalGuideline.countDocuments({ categories: 'Nhóm Sắc Tố (Pigmentation)' });
  const laoHoaCount = await MedicalGuideline.countDocuments({ categories: 'Lão Hóa & Nếp Nhăn (Aging & Wrinkles)' });

  console.log(`==================================================`);
  console.log(`📍 1. Nhóm Mụn: ${munCount} tài liệu trong MongoDB`);
  console.log(`📍 2. Nhóm Sắc Tố: ${sacToCount} tài liệu trong MongoDB`);
  console.log(`📍 3. Nhóm Lão Hóa & Nếp Nhăn: ${laoHoaCount} tài liệu trong MongoDB`);
  console.log(`==================================================\n`);

  await mongoose.disconnect();
  console.log(`Đã ngắt kết nối MongoDB. Đẩy dữ liệu hoàn tất!`);
}

seedDatabase().catch((err) => {
  console.error('❌ Lỗi khi đẩy dữ liệu vào MongoDB:', err);
  process.exit(1);
});
