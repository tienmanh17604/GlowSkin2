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

function cleanImageUrl(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  const secondHttp = url.indexOf("http", 8);
  if (secondHttp > 0) {
    url = url.substring(0, secondHttp).trim();
  }
  return url;
}

async function uploadToCloudinary(sourceUrl, folder, publicId) {
  try {
    const res = await cloudinary.uploader.upload(sourceUrl, {
      folder: `glowskin/products/${folder}`,
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    });
    return res.secure_url;
  } catch (err) {
    console.warn(`  ⚠️ Upload thất bại '${publicId}': ${err.message}. Giữ link gốc.`);
    return sourceUrl;
  }
}

async function main() {
  console.log("🚀 BẮT ĐẦU ĐỒNG BỘ TOÀN BỘ ẢNH LÊN CLOUDINARY...\n");

  const backendProducts = JSON.parse(fs.readFileSync(backendProductsPath, "utf8"));

  // 1. Cập nhật Serum từ file Serum.xlsx (đang có 107 link ảnh Shopee trực tiếp)
  const serumExcelPath = path.join(DATA_EXE_DIR, "Serum.xlsx");
  if (fs.existsSync(serumExcelPath)) {
    const wb = xlsx.readFile(serumExcelPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = xlsx.utils.decode_range(ws["!ref"]);
    let serumIdx = 0;
    for (let r = 1; r <= range.e.r; r++) {
      const nameCell = ws[xlsx.utils.encode_cell({ r, c: 0 })];
      const imgCell = ws[xlsx.utils.encode_cell({ r, c: 3 })];
      if (!nameCell || !nameCell.v) continue;
      let rawImg = "";
      if (imgCell) {
        if (imgCell.l && imgCell.l.Target) rawImg = imgCell.l.Target;
        else if (imgCell.v) rawImg = String(imgCell.v).trim();
      }
      if (rawImg && rawImg.startsWith("http")) {
        // Tìm serum tương ứng
        while (serumIdx < backendProducts.length) {
          if (backendProducts[serumIdx].category === "serum") {
            backendProducts[serumIdx].image = cleanImageUrl(rawImg);
            backendProducts[serumIdx].hoverImage = cleanImageUrl(rawImg);
            backendProducts[serumIdx].images = [cleanImageUrl(rawImg)];
            serumIdx++;
            break;
          }
          serumIdx++;
        }
      }
    }
    console.log("✅ Đã cập nhật 107 link Shopee từ Serum.xlsx vào danh sách sản phẩm");
  }

  // 2. Tìm tất cả các sản phẩm có link ảnh hợp lệ nhưng CHƯA lên Cloudinary
  const queue = [];
  backendProducts.forEach((p, index) => {
    const img = p.image || "";
    if (img.includes("res.cloudinary.com")) return; // Đã lên Cloudinary
    if (img.includes("i.ibb.co") || img.includes("susercontent.com")) {
      queue.push({
        index,
        category: p.category,
        name: p.name,
        sourceUrl: cleanImageUrl(img),
        publicId: `${p.category}_${index + 1}_${slugify(p.name)}`,
      });
    }
  });

  console.log(`📦 Tổng số sản phẩm sẵn sàng upload lên Cloudinary: ${queue.length}\n`);

  // Concurrency pool 6 workers
  const CONCURRENCY = 6;
  let cursor = 0;
  const total = queue.length;
  let successCount = 0;

  async function worker() {
    while (cursor < total) {
      const i = cursor++;
      const item = queue[i];
      console.log(`[${i + 1}/${total}] Uploading (${item.category}): ${item.name.substring(0, 35)}...`);
      const cldUrl = await uploadToCloudinary(item.sourceUrl, item.category, item.publicId);
      if (cldUrl.includes("res.cloudinary.com")) {
        backendProducts[item.index].image = cldUrl;
        backendProducts[item.index].hoverImage = cldUrl;
        backendProducts[item.index].images = [cldUrl];
        successCount++;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`\n🎉 Upload thành công ${successCount}/${total} ảnh lên Cloudinary!`);

  // 3. Lưu JSON backend & frontend
  fs.writeFileSync(backendProductsPath, JSON.stringify(backendProducts, null, 2), "utf8");
  fs.writeFileSync(frontendProductsPath, JSON.stringify(backendProducts, null, 2), "utf8");
  console.log("✅ Đã lưu backend/data/products.json và fontend/src/data/products.json");

  // 4. Đồng bộ vào MongoDB
  console.log("\n🔗 Đang đồng bộ vào MongoDB...");
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
    console.log("✅ Đã kết nối MongoDB");

    for (let i = 0; i < backendProducts.length; i += 200) {
      const chunk = backendProducts.slice(i, i + 200);
      const bulkOps = chunk.map((p) => ({
        updateOne: {
          filter: { id: p.id },
          update: {
            $set: {
              image: p.image,
              hoverImage: p.hoverImage,
              images: p.images,
            },
          },
        },
      }));
      await Product.bulkWrite(bulkOps);
      console.log(`   Đã đồng bộ MongoDB: ${Math.min(i + 200, backendProducts.length)}/${backendProducts.length}`);
    }
    console.log("🎉 Hoàn tất đồng bộ toàn bộ MongoDB!");
  } catch (err) {
    console.error("❌ Lỗi sync MongoDB:", err.message);
  } finally {
    await mongoose.disconnect();
  }

  // Thống kê cuối
  const cldFinal = backendProducts.filter((p) => p.image?.includes("res.cloudinary.com")).length;
  console.log(`\n✨ TỔNG KẾT: ${cldFinal}/${backendProducts.length} sản phẩm hiện đã có link ảnh Cloudinary CDN!`);
}

main().catch(console.error);
