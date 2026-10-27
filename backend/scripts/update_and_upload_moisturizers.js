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

// Tìm file Kem dưỡng b.xlsx
const exeFiles = fs.readdirSync(DATA_EXE_DIR);
const moisturizerFileName = exeFiles.find(
  (f) => f.includes("du") && f.includes("ng") && f.endsWith(".xlsx")
);
if (!moisturizerFileName) {
  throw new Error("Không tìm thấy file Kem dưỡng trong Data Sản Phẩm EXE");
}
const excelFile = path.join(DATA_EXE_DIR, moisturizerFileName);
console.log(`📂 Sử dụng file: ${moisturizerFileName}`);

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
    .substring(0, 35);
}

function detectSkinTypes(name) {
  const t = name.toLowerCase();
  const types = new Set();
  if (t.includes("dầu") || t.includes("oil") || t.includes("kiềm dầu") || t.includes("nhờn") || t.includes("mụn") || t.includes("acne") || t.includes("gel") || t.includes("thạch")) {
    types.add("oily"); types.add("combination");
  }
  if (t.includes("khô") || t.includes("ẩm") || t.includes("dry") || t.includes("moist") || t.includes("cấp nước") || t.includes("ha") || t.includes("hyaluronic") || t.includes("nourish") || t.includes("cream")) {
    types.add("dry"); types.add("normal");
  }
  if (t.includes("nhạy cảm") || t.includes("dịu") || t.includes("sensitive") || t.includes("calm") || t.includes("b5") || t.includes("cica") || t.includes("phục hồi") || t.includes("repair")) {
    types.add("sensitive");
  }
  if (t.includes("trắng") || t.includes("white") || t.includes("brightening") || t.includes("sáng") || t.includes("mờ thâm")) {
    types.add("normal"); types.add("combination"); types.add("dry");
  }
  if (types.size === 0) {
    types.add("combination"); types.add("normal");
  }
  return [...types];
}

function detectConcerns(name) {
  const t = name.toLowerCase();
  const concerns = new Set(["dehydration"]);
  if (t.includes("mụn") || t.includes("acne") || t.includes("blemish")) concerns.add("acne");
  if (t.includes("thâm") || t.includes("trắng") || t.includes("white") || t.includes("vitamin c") || t.includes("dark spot") || t.includes("sáng") || t.includes("nám")) {
    concerns.add("dark_spots");
    concerns.add("dullness");
  }
  if (t.includes("pore") || t.includes("lỗ chân lông") || t.includes("se khít")) concerns.add("pores");
  if (t.includes("lão hóa") || t.includes("retinol") || t.includes("collagen") || t.includes("anti-aging") || t.includes("aging") || t.includes("nếp nhăn")) concerns.add("aging");
  if (t.includes("xỉn") || t.includes("dull") || t.includes("brightening") || t.includes("sạm")) concerns.add("dullness");
  return [...concerns];
}

function readExcelMoisturizers() {
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

  return items;
}

async function uploadToCloudinary(sourceUrl, publicId) {
  try {
    const res = await cloudinary.uploader.upload(sourceUrl, {
      folder: "glowskin/products/moisturizer",
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    });
    return res.secure_url;
  } catch (err) {
    console.warn(`  ⚠️ Upload Cloudinary thất bại cho '${publicId}': ${err.message}. Sử dụng trực tiếp link nguồn.`);
    return sourceUrl;
  }
}

async function main() {
  console.log("🚀 BẮT ĐẦU CẬP NHẬT SẢN PHẨM & LINK ẢNH KEM DƯỠNG TỪ EXCEL...\n");

  const excelItems = readExcelMoisturizers();
  console.log(`📦 Đọc được ${excelItems.length} sản phẩm hợp lệ từ '${moisturizerFileName}'`);

  // Load existing products
  const backendProducts = JSON.parse(fs.readFileSync(backendProductsPath, "utf8"));
  const existingMoisturizers = backendProducts.filter((p) => p.category === "moisturizer");
  console.log(`🔍 Hiện tại có ${existingMoisturizers.length} sản phẩm Kem dưỡng trong products.json`);

  // Map existing moisturizers by lowercase name
  const existingMap = new Map();
  existingMoisturizers.forEach((m) => {
    const key = m.name.trim().toLowerCase();
    if (!existingMap.has(key)) {
      existingMap.set(key, [m]);
    } else {
      existingMap.get(key).push(m);
    }
  });

  // Prepare upload queue
  console.log("\n☁️ Chuẩn bị upload ảnh lên Cloudinary...");
  const uploadQueue = excelItems.map((item, idx) => {
    const pId = `moisturizer_${idx + 1}_${slugify(item.name)}`;
    return {
      index: idx,
      item,
      publicId: pId,
      sourceUrl: item.image,
    };
  });

  // Concurrency pool for uploads
  const CONCURRENCY = 8;
  let cursor = 0;
  let cldSuccessCount = 0;
  const total = uploadQueue.length;
  const cldResults = new Array(total);

  async function worker() {
    while (cursor < total) {
      const cur = cursor++;
      const q = uploadQueue[cur];
      if (!q.sourceUrl) {
        cldResults[cur] = "";
        continue;
      }

      console.log(`[${cur + 1}/${total}] Uploading: ${q.item.name.substring(0, 35)}...`);
      const cldUrl = await uploadToCloudinary(q.sourceUrl, q.publicId);
      cldResults[cur] = cldUrl;
      if (cldUrl.includes("res.cloudinary.com")) {
        cldSuccessCount++;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`\n🎉 Upload hoàn tất: ${cldSuccessCount}/${total} ảnh đã được lưu trữ trên Cloudinary CDN!`);

  // Build the new 151 Moisturizer products
  const newMoisturizerProducts = [];
  const usedIds = new Set(backendProducts.filter((p) => p.category !== "moisturizer").map((p) => p.id));

  for (let i = 0; i < excelItems.length; i++) {
    const exItem = excelItems[i];
    const finalImageUrl = cldResults[i] || exItem.image;

    // Check if we have an existing moisturizer matching this item
    const key = exItem.name.trim().toLowerCase();
    let existing = null;
    if (existingMap.has(key) && existingMap.get(key).length > 0) {
      existing = existingMap.get(key).shift();
    }

    // Determine ID
    let prodId = existing ? existing.id : `moisturizer-${slugify(exItem.name)}`;
    let counter = 2;
    while (usedIds.has(prodId)) {
      prodId = `${existing ? existing.id : `moisturizer-${slugify(exItem.name)}`}-${counter}`;
      counter++;
    }
    usedIds.add(prodId);

    // Price
    let price = existing && existing.price ? existing.price : 190000 + Math.floor(Math.random() * 300) * 1000;
    let rating = existing && existing.rating ? existing.rating : +(4.7 + Math.random() * 0.3).toFixed(1);
    let reviews = existing && existing.reviews ? existing.reviews : 45 + Math.floor(Math.random() * 250);
    let skinTypes = existing && existing.skinTypes && existing.skinTypes.length > 0 ? existing.skinTypes : detectSkinTypes(exItem.name);
    let concerns = existing && existing.concerns && existing.concerns.length > 0 ? existing.concerns : detectConcerns(exItem.name);
    let stock = existing && existing.stock ? existing.stock : 40 + Math.floor(Math.random() * 60);
    let description = existing && existing.description && !existing.description.startsWith("Shopee Việt Nam")
      ? existing.description
      : `${exItem.name} — kem dưỡng cao cấp của thương hiệu ${exItem.brand}. Sản phẩm cung cấp độ ẩm chuyên sâu, phục hồi hàng rào bảo vệ da và duy trì làn da mịn màng, khỏe đẹp mỗi ngày.`;

    const productObj = {
      id: prodId,
      name: exItem.name,
      brand: exItem.brand,
      category: "moisturizer",
      price,
      rating,
      reviews,
      skinTypes,
      concerns,
      ingredients: existing && existing.ingredients ? existing.ingredients : [],
      image: finalImageUrl,
      hoverImage: finalImageUrl,
      images: [finalImageUrl],
      description,
      stock,
      link: exItem.link || (existing ? existing.link : null),
    };

    newMoisturizerProducts.push(productObj);
  }

  // Replace old moisturizers in backendProducts
  const nonMoisturizerProducts = backendProducts.filter((p) => p.category !== "moisturizer");
  const updatedAllProducts = [...nonMoisturizerProducts, ...newMoisturizerProducts];

  console.log(`\n💾 Đang lưu ${updatedAllProducts.length} sản phẩm (trong đó có ${newMoisturizerProducts.length} Kem dưỡng)...`);

  fs.writeFileSync(backendProductsPath, JSON.stringify(updatedAllProducts, null, 2), "utf8");
  console.log("✅ Đã lưu backend/data/products.json");

  fs.writeFileSync(frontendProductsPath, JSON.stringify(updatedAllProducts, null, 2), "utf8");
  console.log("✅ Đã lưu fontend/src/data/products.json");

  // Sync to MongoDB
  console.log("\n🔗 Đang đồng bộ vào MongoDB...");
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
    });
    console.log("✅ Đã kết nối MongoDB thành công");

    // Remove old moisturizers in MongoDB
    const deleteRes = await Product.deleteMany({ category: "moisturizer" });
    console.log(`🗑️ Đã xóa ${deleteRes.deletedCount} kem dưỡng cũ trong MongoDB`);

    // Insert new moisturizers
    const insertRes = await Product.insertMany(newMoisturizerProducts);
    console.log(`🎉 Đã thêm ${insertRes.length} kem dưỡng mới vào MongoDB!`);
  } catch (err) {
    console.error("❌ Lỗi sync MongoDB:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  }

  console.log("\n✨ HOÀN TẤT CẬP NHẬT SẢN PHẨM VÀ LINK ẢNH KEM DƯỠNG THÀNH CÔNG!");
}

main().catch(console.error);
