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
const cachePath = path.join(__dirname, "../data/ibb_cache.json");

const EXCEL_SOURCES = [
  { file: "Sữa rửa mặt.xlsx",       category: "cleanser",       label: "Sữa rửa mặt" },
  { file: "Toner (1).xlsx",          category: "toner",          label: "Toner" },
  { file: "Serum.xlsx",              category: "serum",          label: "Serum" },
  { file: "Kem dưỡng (1).xlsx",      category: "moisturizer",    label: "Kem dưỡng" },
  { file: "Kem chống nắng (1).xlsx", category: "sunscreen",      label: "Kem chống nắng" },
  { file: "Mặt nạ.xlsx",             category: "mask",           label: "Mặt nạ" },
  { file: "Tẩy da chết.xlsx",        category: "exfoliator",     label: "Tẩy da chết" },
  { file: "Tẩy trang.xlsx",          category: "makeup_remover", label: "Tẩy trang" },
];

// Load cache
let cache = {};
if (fs.existsSync(cachePath)) {
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    console.log(`📦 Đã load ${Object.keys(cache).length} URL từ cache.`);
  } catch (e) {
    cache = {};
  }
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
    .substring(0, 60);
}

function estimatePrice(category, name, brand) {
  const priceMap = {
    cleanser: [85000, 180000],
    toner: [120000, 320000],
    serum: [180000, 580000],
    moisturizer: [150000, 450000],
    sunscreen: [95000, 380000],
    mask: [35000, 250000],
    exfoliator: [95000, 280000],
    makeup_remover: [85000, 250000],
  };
  const [min, max] = priceMap[category] || [100000, 300000];
  return Math.round((min + Math.random() * (max - min)) / 1000) * 1000;
}

function detectSkinTypes(name) {
  const t = name.toLowerCase();
  const types = new Set();
  if (t.includes("dầu") || t.includes("pore") || t.includes("oil control") || t.includes("acne")) {
    types.add("oily"); types.add("combination");
  }
  if (t.includes("khô") || t.includes("dưỡng ẩm") || t.includes("hydrat") || t.includes("moisture")) {
    types.add("dry"); types.add("normal"); types.add("combination");
  }
  if (t.includes("nhạy cảm") || t.includes("sensitive") || t.includes("làm dịu") || t.includes("cica") || t.includes("calm")) {
    types.add("sensitive"); types.add("dry");
  }
  if (t.includes("trắng") || t.includes("white") || t.includes("brightening") || t.includes("tone up")) {
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
  if (t.includes("thâm") || t.includes("trắng") || t.includes("white") || t.includes("vitamin c") || t.includes("dark spot")) { concerns.add("dark_spots"); concerns.add("dullness"); }
  if (t.includes("pore") || t.includes("lỗ chân lông") || t.includes("se khít")) concerns.add("pores");
  if (t.includes("lão hóa") || t.includes("retinol") || t.includes("collagen") || t.includes("anti-aging") || t.includes("aging")) concerns.add("aging");
  if (t.includes("xỉn") || t.includes("dull") || t.includes("brightening") || t.includes("tone up")) concerns.add("dullness");
  return [...concerns];
}

function generateDescription(name, brand, category) {
  const catNames = {
    cleanser: "sữa rửa mặt", toner: "nước dưỡng/toner", serum: "serum",
    moisturizer: "kem dưỡng ẩm", sunscreen: "kem chống nắng",
    mask: "mặt nạ", exfoliator: "tẩy tế bào chết", makeup_remover: "nước tẩy trang"
  };
  return `${name} — ${catNames[category] || "sản phẩm"} cao cấp của thương hiệu ${brand}. Sản phẩm giúp chăm sóc và bảo vệ làn da mỗi ngày với công thức tiên tiến, phù hợp cho nhiều loại da.`;
}

// Function to resolve ibb.co url to direct image link
async function resolveIbb(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  // Handle double urls in some cells like "https://ibb.co/abchttps://ibb.co/abc"
  if (url.includes("https://ibb.co/") && url.lastIndexOf("https://ibb.co/") > 0) {
    url = url.substring(0, url.indexOf("https", 8)).trim();
  }
  // If already direct image
  if (url.includes("i.ibb.co") || url.includes("susercontent.com")) return url;
  if (cache[url]) return cache[url];

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const ogMatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
      if (ogMatch && ogMatch[1]) {
        const direct = ogMatch[1];
        cache[url] = direct;
        return direct;
      }
      const directMatch = html.match(/(https:\/\/i\.ibb\.co\/[^\s"'>]+)/i);
      if (directMatch && directMatch[1]) {
        const direct = directMatch[1];
        cache[url] = direct;
        return direct;
      }
      console.warn(`[No og:image] ${url}`);
      return url;
    } catch (e) {
      if (attempt === 3) {
        console.error(`[Fail] ${url}: ${e.message}`);
        return url;
      }
      await new Promise(r => setTimeout(r, 600 * attempt));
    }
  }
  return url;
}

// Read all Excel files
function readExcelProducts() {
  const allExtracted = [];

  for (const source of EXCEL_SOURCES) {
    const filePath = path.join(DATA_EXE_DIR, source.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Không tìm thấy file: ${source.file}`);
      continue;
    }

    console.log(`📂 Đang đọc: ${source.file}...`);
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = xlsx.utils.decode_range(ws["!ref"]);

    let currentBrand = "";
    let count = 0;

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

      // Shopee link
      let shopeeLink = "";
      if (linkCell) {
        if (linkCell.l && linkCell.l.Target) shopeeLink = linkCell.l.Target;
        else if (typeof linkCell.v === "string" && linkCell.v.startsWith("http")) shopeeLink = linkCell.v.trim();
      }

      // Image link from Col 3 (D)
      let rawImg = "";
      if (imgCell) {
        if (imgCell.l && imgCell.l.Target) rawImg = imgCell.l.Target;
        else if (imgCell.v) rawImg = String(imgCell.v).trim();
      }

      if (!rawImg || !shopeeLink) continue;

      allExtracted.push({
        name,
        brand: currentBrand || "Khác",
        category: source.category,
        shopeeLink,
        rawImg
      });
      count++;
    }
    console.log(`   → ${count} sản phẩm hợp lệ từ ${source.file}`);
  }

  return allExtracted;
}

async function main() {
  console.log("🚀 BẮT ĐẦU IMPORT 100% ẢNH THẬT TỪ FILE EXCEL...\n");

  const items = readExcelProducts();
  console.log(`\n📊 Tổng sản phẩm trích xuất từ 8 file: ${items.length}`);

  // Collect unique image URLs that need resolution
  const uniqueUrls = new Set();
  items.forEach(it => {
    let u = it.rawImg.trim();
    if (u.includes("https://ibb.co/") && u.lastIndexOf("https://ibb.co/") > 0) {
      u = u.substring(0, u.indexOf("https", 8)).trim();
    }
    if (u && !cache[u] && !u.includes("i.ibb.co") && !u.includes("susercontent.com")) {
      uniqueUrls.add(u);
    }
  });

  const urlsToFetch = [...uniqueUrls];
  console.log(`🔗 Tổng link ảnh cần chuyển đổi sang direct URL: ${urlsToFetch.length} (Đã có sẵn trong cache: ${Object.keys(cache).length})`);

  // Concurrency pool with 8 workers
  const CONCURRENCY = 8;
  let idx = 0;
  let done = 0;
  const total = urlsToFetch.length;

  async function worker() {
    while (idx < urlsToFetch.length) {
      const cur = idx++;
      const url = urlsToFetch[cur];
      await resolveIbb(url);
      done++;
      if (done % 20 === 0 || done === total) {
        console.log(`[${done}/${total}] Đang tải link ảnh trực tiếp... (${Math.round(done/total*100)}%)`);
        fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
      }
      await new Promise(r => setTimeout(r, 80));
    }
  }

  if (urlsToFetch.length > 0) {
    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
    console.log("✅ Hoàn tất chuyển đổi tất cả link ảnh!");
  }

  // Build full products list
  const slugCount = {};
  const products = items.map((item, i) => {
    let baseSlug = `${item.category}-${slugify(item.name)}`;
    if (!baseSlug || baseSlug === `${item.category}-`) baseSlug = `${item.category}-${slugify(item.brand)}-${i}`;
    let slug = baseSlug;
    if (slugCount[slug]) { slugCount[slug]++; slug = `${baseSlug}-${slugCount[slug]}`; }
    else slugCount[slug] = 1;

    let cleanRaw = item.rawImg.trim();
    if (cleanRaw.includes("https://ibb.co/") && cleanRaw.lastIndexOf("https://ibb.co/") > 0) {
      cleanRaw = cleanRaw.substring(0, cleanRaw.indexOf("https", 8)).trim();
    }
    const finalImage = cache[cleanRaw] || cleanRaw;

    return {
      id: slug,
      name: item.name,
      brand: item.brand,
      category: item.category,
      price: estimatePrice(item.category, item.name, item.brand),
      rating: parseFloat((4.6 + Math.random() * 0.4).toFixed(1)),
      reviews: 20 + Math.floor(Math.random() * 300),
      skinTypes: detectSkinTypes(item.name),
      concerns: detectConcerns(item.name),
      ingredients: [],
      image: finalImage,
      hoverImage: finalImage,
      images: [finalImage],
      description: generateDescription(item.name, item.brand, item.category),
      stock: 50 + Math.floor(Math.random() * 100),
      link: item.shopeeLink,
    };
  });

  // Verify
  const directCount = products.filter(p => p.image.includes("i.ibb.co") || p.image.includes("susercontent.com")).length;
  console.log(`\n🎉 KẾT QUẢ: ${directCount}/${products.length} sản phẩm có link ảnh trực tiếp 100% từ Excel!`);

  // Write to files
  fs.writeFileSync(backendProductsPath, JSON.stringify(products, null, 2), "utf8");
  fs.writeFileSync(frontendProductsPath, JSON.stringify(products, null, 2), "utf8");
  console.log("✅ Đã ghi backend/data/products.json và fontend/src/data/products.json");

  // Sync to MongoDB
  console.log("\n🔗 Đang đồng bộ vào MongoDB...");
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
    });
    console.log("✅ Đã kết nối MongoDB");
    await Product.deleteMany({});
    console.log("🗑️  Đã làm sạch bảng products cũ");

    for (let i = 0; i < products.length; i += 200) {
      const chunk = products.slice(i, i + 200);
      await Product.insertMany(chunk);
      console.log(`   Đã import: ${Math.min(i + 200, products.length)}/${products.length}`);
    }
    console.log("🎉 Hoàn tất ghi vào MongoDB!");
  } catch (err) {
    console.error("❌ Lỗi sync MongoDB:", err.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n✨ HOÀN TẤT TOÀN BỘ!");
}

main().catch(console.error);
