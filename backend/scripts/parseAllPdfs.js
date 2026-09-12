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
  Y_KHOA: 'Y Khoa Chăm Sóc Da Bổ Sung'
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
  if (categories.length === 0) categories.push(CATEGORIES.Y_KHOA);

  return categories;
}

function extractKeywords(title, content) {
  const text = (title + " " + content.substring(0, 500)).toLowerCase();
  const words = text
    .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !['chẩn', 'đoán', 'điều', 'trị', 'bệnh', 'nguyên', 'nhân', 'thường', 'hoặc', 'trong', 'theo', 'ngược', 'dùng'].includes(w));
  return [...new Set(words)].slice(0, 15);
}

async function getPdfText(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  let data;
  if (typeof pdfModule === 'function') {
    data = await pdfModule(dataBuffer);
  } else if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse(new Uint8Array(dataBuffer));
    data = await parser.getText();
  }
  return data.text || (typeof data === 'string' ? data : '');
}

async function main() {
  console.log('=== 🚀 BẮT ĐẦU BÓC TÁCH HOÀN CHỈNH & ĐẦY ĐỦ 100% DỮ LIỆU Y KHOA (NO TRUNCATION) ===\n');

  const pdf1Path = path.join(__dirname, '../data/dermatology_guideline.pdf');
  const pdf2Path = path.join(__dirname, '../data/DATA AI.pdf');
  const outputPath = path.join(__dirname, '../data/medical_guidelines.json');

  const text1 = await getPdfText(pdf1Path);
  const text2 = await getPdfText(pdf2Path);

  console.log(`- dermatology_guideline.pdf: ${text1.length} ký tự`);
  console.log(`- DATA AI.pdf: ${text2.length} ký tự`);

  // --- PARSE FILE 1: dermatology_guideline.pdf ---
  const mainStartIdx = text1.indexOf("Chương 1\n");
  const mainBodyText = mainStartIdx > 0 ? text1.substring(mainStartIdx) : text1;

  const tocStart = text1.indexOf("MỤC LỤC");
  const tocEnd = text1.indexOf("Chương 1\n", tocStart > 0 ? tocStart : 0);
  const tocContent = text1.substring(tocStart > 0 ? tocStart : 0, tocEnd > 0 ? tocEnd : 15000);
  
  const diseaseTitles = [];
  const tocLines = tocContent.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of tocLines) {
    const match = line.match(/^([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ0-9\s,\-\/\(\)]+)\s*\.{3,}\s*(\d+)$/);
    if (match) {
      const title = match[1].trim();
      if (!title.startsWith('Chương') && !title.startsWith('MỤC LỤC') && title.length > 3) {
        diseaseTitles.push(title);
      }
    }
  }

  console.log(`\nFound ${diseaseTitles.length} diseases listed in TOC.`);

  const results = [];
  let counter = 1;

  const bodyLines = mainBodyText.split('\n');
  let currentTitle = "HƯỚNG DẪN CHẨN ĐOÁN VÀ ĐIỀU TRỊ BỆNH DA LIỄU BỘ Y TẾ";
  let currentContent = [];

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) continue;

    const matchedTitle = diseaseTitles.find(t => {
      const cleanLine = line.replace(/^[0-9]+\.\s*/, '').trim();
      return cleanLine === t || cleanLine === t.toUpperCase() || line === t;
    });

    if (matchedTitle && currentContent.length > 0) {
      const fullText = currentContent.join('\n').trim();
      const cleanedText = fullText
        .replace(/HƯỚNG DẪN CHẨN ĐOÁN VÀ ĐIỀU TRỊ CÁC BỆNH DA LIỄU/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (cleanedText.length > 100) {
        results.push({
          id: `byt_4416_${counter++}`,
          source: 'Quyết định 4416/QĐ-BYT Bộ Y Tế',
          title: currentTitle,
          categories: classifySection(currentTitle, cleanedText),
          content: cleanedText,
          keywords: extractKeywords(currentTitle, cleanedText)
        });
      }

      currentTitle = matchedTitle;
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    const fullText = currentContent.join('\n').trim();
    const cleanedText = fullText
      .replace(/HƯỚNG DẪN CHẨN ĐOÁN VÀ ĐIỀU TRỊ CÁC BỆNH DA LIỄU/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleanedText.length > 100) {
      results.push({
        id: `byt_4416_${counter++}`,
        source: 'Quyết định 4416/QĐ-BYT Bộ Y Tế',
        title: currentTitle,
        categories: classifySection(currentTitle, cleanedText),
        content: cleanedText,
        keywords: extractKeywords(currentTitle, cleanedText)
      });
    }
  }

  console.log(`✅ Đã bóc tách thành công ${results.length} bài hướng dẫn Y Khoa ĐẦY ĐỦ từ QĐ 4416 (Bộ Y Tế).`);

  // --- PARSE FILE 2: DATA AI.pdf ---
  console.log(`\n==================================================`);
  console.log(`2. Đang bóc tách Chuyên Sâu File DATA AI.pdf (FULL CONTENT)...`);

  const pages2 = text2.split(/--\s*\d+\s*of\s*\d+\s*--/gi);
  let aiCounter = 1;
  let currentAiTitle = "Tổng quan Skincare & AI Data";
  let currentAiBuffer = [];

  for (const pageText of pages2) {
    const trimmed = pageText.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || "";

    const isHeader = lines.length === 1 || 
                     /^(Mụn|Sắc tố|Thâm|Nám|Đồi mồi|Tàn nhang|Sạm|Nếp nhăn|Căng bóng|Làm sáng|Các loại mụn|Thâm do mụn)/i.test(firstLine);

    if (isHeader && currentAiBuffer.length > 0) {
      const fullAiText = currentAiBuffer.join('\n\n').trim();
      if (fullAiText.length > 50) {
        results.push({
          id: `data_ai_${aiCounter++}`,
          source: 'DATA AI Chuyên Sâu SkinCare',
          title: currentAiTitle,
          categories: classifySection(currentAiTitle, fullAiText),
          content: fullAiText,
          keywords: extractKeywords(currentAiTitle, fullAiText)
        });
      }
      currentAiTitle = firstLine.length > 3 ? firstLine : currentAiTitle;
      currentAiBuffer = [trimmed];
    } else {
      currentAiBuffer.push(trimmed);
    }
  }

  if (currentAiBuffer.length > 0) {
    const fullAiText = currentAiBuffer.join('\n\n').trim();
    if (fullAiText.length > 50) {
      results.push({
        id: `data_ai_${aiCounter++}`,
        source: 'DATA AI Chuyên Sâu SkinCare',
        title: currentAiTitle,
        categories: classifySection(currentAiTitle, fullAiText),
        content: fullAiText,
        keywords: extractKeywords(currentAiTitle, fullAiText)
      });
    }
  }

  console.log(`✅ Đã hợp nhất tổng cộng ${results.length} bài hướng dẫn Y Khoa & AI Skincare.`);

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`🎉 ĐÃ LƯU THÀNH CÔNG FILE DATA ĐẦY ĐỦ TẠI: ${outputPath}`);
}

main().catch(console.error);

