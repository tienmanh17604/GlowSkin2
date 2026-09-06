import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES = {
  MUN: 'Mụn (Acne)',
  SAC_TO: 'Nhóm Sắc Tố (Pigmentation)',
  LAO_HOA: 'Lão Hóa & Nếp Nhăn (Aging & Wrinkles)',
  KHAC: 'Y Khoa Chăm Sóc Da Bổ Sung'
};

function classifySection(title, content) {
  const text = (title + " " + content).toLowerCase();
  
  const isMun = /mụn|trứng cá|bã nhờn|bít tắc|viêm da tuyến bã|sẩn mủ|mụn mủ|mụn bọc|mụn ẩn|mụn nang|acne/i.test(text);
  const isSacTo = /sắc tố|thâm|nám|tàn nhang|đồi mồi|rám|sạm|cháy nắng|tăng sắc tố|melasma|pigmentation|pih/i.test(text);
  const isLaoHoa = /lão hóa|nếp nhăn|chảy xệ|căng bóng|làm sáng|collagen|elastin|aging|wrinkle/i.test(text);

  const categories = [];
  if (isMun) categories.push(CATEGORIES.MUN);
  if (isSacTo) categories.push(CATEGORIES.SAC_TO);
  if (isLaoHoa) categories.push(CATEGORIES.LAO_HOA);
  if (categories.length === 0) categories.push(CATEGORIES.KHAC);

  return categories;
}

async function parseMainDermatologyPdf(filePath) {
  console.log(`\n==================================================`);
  console.log(`1. Đang bóc tách File Bộ Y Tế QĐ 4416 (dermatology_guideline.pdf)...`);
  const dataBuffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(dataBuffer);

  let data;
  if (typeof pdfModule === 'function') {
    data = await pdfModule(dataBuffer);
  } else if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse(uint8Array);
    data = await parser.getText();
  }

  // Split QĐ 4416 into major disease sections
  const rawSections = data.text.split(/(?=[0-9]+\.\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ\s]{3,})/g);
  
  const results = [];
  let counter = 1;

  for (const sec of rawSections) {
    const trimmed = sec.trim();
    if (trimmed.length < 100) continue;

    const firstLine = trimmed.split('\n')[0].replace(/^[0-9]+\.\s*/, '').trim();
    const categories = classifySection(firstLine, trimmed);
    const keywords = firstLine
      .toLowerCase()
      .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    results.push({
      id: `byt_4416_${counter++}`,
      source: 'Quyết định 4416/QĐ-BYT Bộ Y Tế',
      title: firstLine || `Bài Y Khoa ${counter}`,
      categories,
      content: trimmed.substring(0, 1800),
      keywords: [...new Set(keywords)]
    });
  }

  console.log(`-> Chiết xuất được ${results.length} bài hướng dẫn chuẩn Bộ Y Tế.`);
  return results;
}

async function parseDataAiPdf(filePath) {
  console.log(`\n==================================================`);
  console.log(`2. Đang bóc tách Chuyên Sâu File DATA AI.pdf (Mụn - Sắc tố - Lão hóa)...`);
  const dataBuffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(dataBuffer);

  let data;
  if (typeof pdfModule === 'function') {
    data = await pdfModule(dataBuffer);
  } else if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse(uint8Array);
    data = await parser.getText();
  }

  // Split pages by `-- X of 32 --`
  const rawPages = data.text.split(/--\s*\d+\s*of\s*\d+\s*--/gi);
  
  const results = [];
  let currentTitle = "Tổng quan Da Liễu DATA AI";
  let currentBuffer = "";
  let counter = 1;

  for (const pageText of rawPages) {
    const trimmed = pageText.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || "";

    // Check if page header starts a new topic
    if (lines.length === 1 || firstLine.length < 35 || /^(mụn|sắc tố|thâm|nám|đồi mồi|tàn nhang|sạm|nếp nhăn|căng bóng|làm sáng)/i.test(firstLine)) {
      if (currentBuffer.length > 80) {
        const categories = classifySection(currentTitle, currentBuffer);
        const keywords = currentTitle
          .toLowerCase()
          .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 2);

        results.push({
          id: `data_ai_${counter++}`,
          source: 'DATA AI Chuyên Sâu SkinCare',
          title: currentTitle,
          categories,
          content: currentBuffer.substring(0, 1800),
          keywords: [...new Set(keywords)]
        });
      }
      currentTitle = firstLine.length > 3 ? firstLine : currentTitle;
      currentBuffer = trimmed;
    } else {
      currentBuffer += "\n\n" + trimmed;
    }
  }

  if (currentBuffer.length > 80) {
    const categories = classifySection(currentTitle, currentBuffer);
    results.push({
      id: `data_ai_${counter++}`,
      source: 'DATA AI Chuyên Sâu SkinCare',
      title: currentTitle,
      categories,
      content: currentBuffer.substring(0, 1800),
      keywords: currentTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    });
  }

  console.log(`-> Chiết xuất được ${results.length} mục dữ liệu chuyên sâu (Mụn, Sắc tố, Lão hóa) từ DATA AI.pdf.`);
  return results;
}

async function main() {
  const pdf1 = path.join(__dirname, '../data/dermatology_guideline.pdf');
  const pdf2 = path.join(__dirname, '../data/DATA AI.pdf');
  const outputPath = path.join(__dirname, '../data/medical_guidelines.json');

  const list1 = await parseMainDermatologyPdf(pdf1);
  const list2 = await parseDataAiPdf(pdf2);

  const merged = [...list1, ...list2];

  // Statistics for 3 key focus topics
  const munCount = merged.filter(item => item.categories.includes(CATEGORIES.MUN)).length;
  const sacToCount = merged.filter(item => item.categories.includes(CATEGORIES.SAC_TO)).length;
  const laoHoaCount = merged.filter(item => item.categories.includes(CATEGORIES.LAO_HOA)).length;

  console.log(`\n==================================================`);
  console.log(`🔥 ĐÃ TẢI HOÀN TẤT & HỢP NHẤT DỮ LIỆU AI SKINCARE:`);
  console.log(`-> TỔNG SỐ TÀI LIỆU Y KHOA: ${merged.length}`);
  console.log(`📍 1. MỤN (Mụn viêm, mụn ẩn, mụn đầu đen, bít tắc): ${munCount} tài liệu`);
  console.log(`📍 2. NHÓM SẮC TỐ (Nám, tàn nhang, thâm mụn, sạm nắng, PIH): ${sacToCount} tài liệu`);
  console.log(`📍 3. LÃO HÓA & NẾP NHĂN (Nếp nhăn, chảy xệ, làm sáng, căng bóng): ${laoHoaCount} tài liệu`);
  console.log(`==================================================\n`);

  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`✅ Đã lưu tập tin dữ liệu hợp nhất tại: ${outputPath}`);
}

main().catch(console.error);
