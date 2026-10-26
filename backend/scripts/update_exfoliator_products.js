import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as xlsxModule from "xlsx";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

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

function readExfoliatorExcel() {
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

    const cleanedImg = cleanImageUrl(rawImg);

    items.push({
      name,
      brand: currentBrand || "Khác",
      link: shopeeLink,
      image: cleanedImg,
    });
  }

  return items;
}

async function updateExfoliators() {
  console.log("🚀 Bắt đầu cập nhật sản phẩm Tẩy da chết từ file Excel...\n");

  const excelItems = readExfoliatorExcel();
  console.log(`📦 Đọc được ${excelItems.length} sản phẩm từ 'Tẩy da chết.xlsx'`);

  // 1. Cập nhật backend/data/products.json
  const backendProducts = JSON.parse(fs.readFileSync(backendProductsPath, "utf8"));
  let updatedCount = 0;

  // Lấy các sản phẩm exfoliator hiện tại
  let exIndex = 0;
  for (let i = 0; i < backendProducts.length; i++) {
    if (backendProducts[i].category === "exfoliator") {
      const excelItem = excelItems[exIndex];
      if (excelItem) {
        backendProducts[i].image = excelItem.image;
        backendProducts[i].hoverImage = excelItem.image;
        backendProducts[i].images = [excelItem.image];
        if (excelItem.link) backendProducts[i].link = excelItem.link;
        if (excelItem.name) backendProducts[i].name = excelItem.name;
        if (excelItem.brand) backendProducts[i].brand = excelItem.brand;
        updatedCount++;
      }
      exIndex++;
    }
  }

  console.log(`✅ Đã cập nhật ${updatedCount} sản phẩm Tẩy da chết trong danh sách`);

  fs.writeFileSync(backendProductsPath, JSON.stringify(backendProducts, null, 2), "utf8");
  console.log("✅ Đã lưu backend/data/products.json");

  // 2. Cập nhật fontend/src/data/products.json
  fs.writeFileSync(frontendProductsPath, JSON.stringify(backendProducts, null, 2), "utf8");
  console.log("✅ Đã lưu fontend/src/data/products.json");

  // 3. Đồng bộ vào MongoDB
  console.log("\n🔗 Đang đồng bộ vào MongoDB...");
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
    });
    console.log("✅ Đã kết nối MongoDB");

    const exProducts = backendProducts.filter((p) => p.category === "exfoliator");
    let mongoUpdated = 0;

    for (const prod of exProducts) {
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
      if (res.matchedCount > 0) {
        mongoUpdated++;
      }
    }

    console.log(`🎉 Đã cập nhật thành công ${mongoUpdated}/${exProducts.length} sản phẩm Tẩy da chết trong MongoDB!`);
  } catch (err) {
    console.error("❌ Lỗi sync MongoDB:", err.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n✨ HOÀN TẤT CẬP NHẬT SẢN PHẨM VÀ LINK ẢNH TẨY DA CHẾT!");
}

updateExfoliators().catch(console.error);
