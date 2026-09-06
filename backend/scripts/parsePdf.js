import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_PATH = path.join(__dirname, "../data/dermatology_guideline.pdf");
const OUTPUT_PATH = path.join(__dirname, "../data/medical_guidelines.json");

async function parsePdfData() {
  console.log("--> Đang đọc file PDF Hướng dẫn Da liễu Bộ Y tế...");

  if (!fs.existsSync(PDF_PATH)) {
    console.error("❌ Không tìm thấy file PDF tại:", PDF_PATH);
    process.exit(1);
  }

  const rawBuffer = fs.readFileSync(PDF_PATH);
  const uint8Array = new Uint8Array(rawBuffer);
  
  try {
    const parser = new PDFParse(uint8Array);
    const data = await parser.getText();
    const text = data.text;
    console.log("--> Đã trích xuất thành công văn bản PDF! Tổng ký tự:", text.length);

    // Tách văn bản thành các bệnh dựa trên mẫu chữ hoa tiêu đề bệnh
    const diseaseRegex = /(?:^|\n)(BỆNH [A-ZÂĂĐÊÔƠƯ\s\-\,\(\)]+|VIÊM [A-ZÂĂĐÊÔƠƯ\s\-\,\(\)]+|HỘI CHỨNG [A-ZÂĂĐÊÔƠƯ\s\-\,\(\)]+|UNG THƯ [A-ZÂĂĐÊÔƠƯ\s\-\,\(\)]+|TRỨNG CÁ|NHỌT, ÁP XE DA|U MỀM LÂY|RÁM MÁ|U VÀNG|GÀI ĐEN)/g;

    const matches = [...text.matchAll(diseaseRegex)];
    const entries = [];

    if (matches.length === 0) {
      // Fallback: cắt theo từng trang nếu không tìm thấy mẫu Regex
      console.log("--> Cắt văn bản theo độ dài từng đoạn...");
      const chunkSize = 1500;
      for (let i = 0; i < text.length; i += chunkSize) {
        entries.push({
          id: `section_${Math.floor(i / chunkSize) + 1}`,
          title: `Tài liệu Da liễu Bộ Y Tế (Phần ${Math.floor(i / chunkSize) + 1})`,
          content: text.substring(i, i + chunkSize).trim(),
          keywords: ["da liễu", "bộ y tế", "chẩn đoán", "điều trị", "phác đồ"]
        });
      }
    } else {
      for (let i = 0; i < matches.length; i++) {
        const title = matches[i][1].trim();
        const start = matches[i].index;
        const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
        const rawContent = text.substring(start, end).trim();

        // Rút gọn content để vừa kích thước prompt AI
        const cleanContent = rawContent.replace(/\s+/g, " ").substring(0, 3000);

        // Trích xuất từ khóa tìm kiếm
        const keywords = [
          title.toLowerCase(),
          ...title.toLowerCase().split(" ").filter(w => w.length > 2)
        ];

        entries.push({
          id: `disease_${i + 1}`,
          title,
          content: cleanContent,
          keywords: [...new Set(keywords)]
        });
      }
    }

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2), "utf-8");

    console.log(`🎉 ĐÃ XUẤT THÀNH CÔNG ${entries.length} MỤC BỆNH VÀO: ${OUTPUT_PATH}`);
  } catch (err) {
    console.error("❌ Lỗi khi phân tích PDF:", err);
  }
}

parsePdfData();
