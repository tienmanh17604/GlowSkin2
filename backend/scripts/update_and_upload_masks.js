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
const excelFile = path.join(DATA_EXE_DIR, "Mặt nạ.xlsx");

function cleanImageUrl(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  const secondHttp = url.indexOf("http", 8);
  if (secondHttp > 0) {
    url = url.substring(0, secondHttp).trim();
  }
  return url;
}

function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}

function slugify(text) {
  return removeVietnameseTones(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 30);
}

function readExcelMasks() {
  if (!fs.existsSync(excelFile)) {
    throw new Error(`Không tìm thấy file: ${excelFile}`);
  }

  const wb = xlsx.readFile(excelFile);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = xlsx.utils.decode_range(ws["!ref"]);

  const items = [];
  let currentBrand = "";

  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    const nameCell = ws[xlsx.utils.encode_cell({ r: R, c: 0 })];
    const brandCell = ws[xlsx.utils.encode_cell({ r: R, c: 1 })];
    const linkCell = ws[xlsx.utils.encode_cell({ r: R, c: 2 })];
    const imgCell = ws[xlsx.utils.encode_cell({ r: R, c: 3 })];

    if (!nameCell || !nameCell.v) continue;
    const name = String(nameCell.v).trim();
    if (!name) continue;

    if (brandCell && brandCell.v && String(brandCell.v).trim()) {
      currentBrand = String(brandCell.v).trim();
    }

    let shopeeLink = "";
    if (linkCell) {
      if (linkCell.l && linkCell.l.Target) shopeeLink = linkCell.l.Target;
      else if (typeof linkCell.v === "string" && linkCell.v.startsWith("http")) shopeeLink = linkCell.v.trim();
    }

    let rawImg = "";
    if (imgCell) {
      if (imgCell.l && imgCell.l.Target) rawImg = imgCell.l.Target;
      else if (imgCell.v) rawImg = String(imgCell.v).trim();
    }

    items.push({
      excelRow: R + 1,
      name,
      brand: currentBrand || "Khác",
      link: shopeeLink,
      image: cleanImageUrl(rawImg),
    });
  }

  return { items, wb, ws };
}

async function uploadToCloudinary(sourceUrl, publicId) {
  try {
    const res = await cloudinary.uploader.upload(sourceUrl, {
      folder: "glowskin/products/mask",
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    });
    return res.secure_url;
  } catch (err) {
    console.warn(`  ⚠️ Upload Cloudinary thất bại cho '${publicId}': ${err.message}. Sử dụng link nguồn.`);
    return sourceUrl;
  }
}

async function main() {
  console.log("🚀 BẮT ĐẦU CẬP NHẬT SẢN PHẨM & LINK ẢNH MẶT NẠ TỪ EXCEL...\n");

  const { items, wb, ws } = readExcelMasks();
  console.log(`📦 Đọc được ${items.length} sản phẩm Mặt nạ hợp lệ từ 'Mặt nạ.xlsx'`);

  // Load existing products
  const backendProducts = JSON.parse(fs.readFileSync(backendProductsPath, "utf8"));
  const maskIndices = [];
  backendProducts.forEach((p, idx) => {
    if (p.category === "mask") maskIndices.push(idx);
  });

  console.log(`Tìm thấy ${maskIndices.length} sản phẩm Mặt nạ trong products.json`);

  // Upload to Cloudinary with concurrency pool
  const CONCURRENCY = 5;
  let cursor = 0;
  const total = items.length;
  const finalUrls = new Array(total);

  async function worker() {
    while (cursor < total) {
      const i = cursor++;
      const item = items[i];
      const prodIdx = maskIndices[i];
      const prod = prodIdx !== undefined ? backendProducts[prodIdx] : null;

      const publicId = `mask_${i + 1}_${slugify(item.name)}`;
      console.log(`[${i + 1}/${total}] Đang xử lý: ${item.name.substring(0, 35)}...`);

      const cldUrl = await uploadToCloudinary(item.image, publicId);
      finalUrls[i] = cldUrl;

      // Update in products JSON
      if (prod) {
        prod.image = cldUrl;
        prod.hoverImage = cldUrl;
        prod.images = [cldUrl];
        if (item.link) prod.link = item.link;
        if (item.brand) prod.brand = item.brand;
        if (item.name) prod.name = item.name;
      }

      // Update in Excel sheet
      const cellKey = `D${item.excelRow}`;
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

  // 1. Save Excel
  try {
    xlsx.writeFile(wb, excelFile);
    console.log("\n✅ Đã lưu link ảnh mới vào file Excel 'Mặt nạ.xlsx'");
  } catch (err) {
    console.warn("\n⚠️ Không thể ghi đè file Excel (có thể đang mở trong Excel), đã bỏ qua bước ghi .xlsx.");
  }

  // 2. Save JSON
  fs.writeFileSync(backendProductsPath, JSON.stringify(backendProducts, null, 2), "utf8");
  fs.writeFileSync(frontendProductsPath, JSON.stringify(backendProducts, null, 2), "utf8");
  console.log("✅ Đã cập nhật backend/data/products.json và fontend/src/data/products.json");

  // 3. Sync to MongoDB
  console.log("\n🔗 Đang đồng bộ vào MongoDB...");
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
    console.log("✅ Đã kết nối MongoDB");

    let mongoUpdated = 0;
    for (const prodIdx of maskIndices) {
      const prod = backendProducts[prodIdx];
      const res = await Product.updateOne(
        { id: prod.id },
        {
          $set: {
            name: prod.name,
            brand: prod.brand,
            link: prod.link,
            image: prod.image,
            hoverImage: prod.hoverImage,
            images: prod.images,
          },
        }
      );
      if (res.matchedCount > 0) mongoUpdated++;
    }
    console.log(`🎉 Đã đồng bộ thành công ${mongoUpdated}/${maskIndices.length} sản phẩm Mặt nạ trong MongoDB!`);
  } catch (err) {
    console.error("❌ Lỗi sync MongoDB:", err.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n✨ HOÀN TẤT TOÀN BỘ CẬP NHẬT SẢN PHẨM VÀ LINK ẢNH MẶT NẠ!");
}

main().catch(console.error);
