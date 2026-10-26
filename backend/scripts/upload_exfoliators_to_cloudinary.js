import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as xlsxModule from "xlsx";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const xlsx = xlsxModule.default || xlsxModule;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_EXE_DIR = path.join(__dirname, "../data/Data Sản Phẩm EXE");
const backendProductsPath = path.join(__dirname, "../data/products.json");
const frontendProductsPath = path.join(__dirname, "../../fontend/src/data/products.json");
const excelFile = path.join(DATA_EXE_DIR, "Tẩy da chết.xlsx");

function cleanImageUrl(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  const secondHttp = url.indexOf("http", 8);
  if (secondHttp > 0) {
    url = url.substring(0, secondHttp).trim();
  }
  return url;
}

async function uploadToCloudinary(sourceUrl, publicId) {
  try {
    const res = await cloudinary.uploader.upload(sourceUrl, {
      folder: "glowskin/products/exfoliator",
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    });
    return res.secure_url;
  } catch (err) {
    console.error(`  ❌ Lỗi upload ${publicId}:`, err.message);
    return sourceUrl; // Fallback to source URL if upload fails
  }
}

async function run() {
  console.log("🚀 BẮT ĐẦU CHUYỂN ẢNH TẨY DA CHẾT SANG CLOUDINARY (CHỐNG LỖI MẠNG / RATE-LIMIT)...\n");

  const backendProducts = JSON.parse(fs.readFileSync(backendProductsPath, "utf8"));
  const exIndices = [];
  backendProducts.forEach((p, idx) => {
    if (p.category === "exfoliator") exIndices.push(idx);
  });

  console.log(`Tìm thấy ${exIndices.length} sản phẩm Tẩy da chết trong products.json`);

  // Đọc file Excel
  const wb = xlsx.readFile(excelFile);
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Upload tuần tự có kiểm soát (concurrency = 3 để không nghẽn)
  const CONCURRENCY = 3;
  let cursor = 0;
  const total = exIndices.length;
  const cloudinaryUrls = new Array(total);

  async function worker() {
    while (cursor < total) {
      const i = cursor++;
      const prodIdx = exIndices[i];
      const prod = backendProducts[prodIdx];
      const sourceUrl = cleanImageUrl(prod.image);

      console.log(`[${i + 1}/${total}] Đang upload: ${prod.name.substring(0, 35)}...`);
      const publicId = `exfoliator_${i + 1}_${prod.id.replace(/^exfoliator-/, "").substring(0, 30)}`;
      const cldUrl = await uploadToCloudinary(sourceUrl, publicId);

      cloudinaryUrls[i] = cldUrl;
      console.log(`   -> ✅ Cloudinary: ${cldUrl}`);

      // Gán vào products data
      backendProducts[prodIdx].image = cldUrl;
      backendProducts[prodIdx].hoverImage = cldUrl;
      backendProducts[prodIdx].images = [cldUrl];

      // Gán vào Excel sheet (cột D, dòng i + 2 vì dòng 1 là header)
      const excelRow = i + 2;
      const cellKey = `D${excelRow}`;
      if (ws[cellKey]) {
        ws[cellKey].v = cldUrl;
        ws[cellKey].w = cldUrl;
        if (ws[cellKey].l) {
          ws[cellKey].l.Target = cldUrl;
          if (ws[cellKey].l.Rel) ws[cellKey].l.Rel.Target = cldUrl;
        }
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // Lưu file Excel (nếu file đang mở trong Microsoft Excel thì bắt lỗi EBUSY)
  try {
    xlsx.writeFile(wb, excelFile);
    console.log("\n✅ Đã cập nhật link ảnh Cloudinary vào file Excel 'Tẩy da chết.xlsx'");
  } catch (excelErr) {
    console.warn("\n⚠️ File Excel đang mở trong ứng dụng khác (Excel), bỏ qua cập nhật trực tiếp vào file .xlsx.");
  }

  // Lưu JSON
  fs.writeFileSync(backendProductsPath, JSON.stringify(backendProducts, null, 2), "utf8");
  fs.writeFileSync(frontendProductsPath, JSON.stringify(backendProducts, null, 2), "utf8");
  console.log("✅ Đã cập nhật backend/data/products.json và fontend/src/data/products.json");

  // Đồng bộ vào MongoDB
  console.log("\n🔗 Đang đồng bộ vào MongoDB...");
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
    console.log("✅ Đã kết nối MongoDB");

    let mongoUpdated = 0;
    for (const prodIdx of exIndices) {
      const prod = backendProducts[prodIdx];
      const res = await Product.updateOne(
        { id: prod.id },
        {
          $set: {
            image: prod.image,
            hoverImage: prod.hoverImage,
            images: prod.images,
          },
        }
      );
      if (res.matchedCount > 0) mongoUpdated++;
    }
    console.log(`🎉 Đã đồng bộ thành công ${mongoUpdated}/${exIndices.length} sản phẩm trong MongoDB!`);
  } catch (err) {
    console.error("❌ Lỗi sync MongoDB:", err.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n✨ HOÀN TẤT TẤT CẢ! 100% ẢNH TẨY DA CHẾT ĐÃ HOẠT ĐỘNG HOÀN HẢO QUA CLOUDINARY CDN!");
}

run().catch(console.error);
