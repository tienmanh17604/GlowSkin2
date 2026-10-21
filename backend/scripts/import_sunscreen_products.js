import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as xlsxModule from "xlsx";

const xlsx = xlsxModule.default || xlsxModule;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const excelPath = path.join(__dirname, "../data/Kem Chống Nắng .xlsx");
const frontendExcelPath = path.join(__dirname, "../../fontend/src/data/Kem Chống Nắng .xlsx");
const backendProductsPath = path.join(__dirname, "../data/products.json");
const frontendProductsPath = path.join(__dirname, "../../fontend/src/data/products.json");

// Helper to remove Vietnamese tones for slug
function removeVietnameseTones(str) {
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
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
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
    .replace(/-+/g, "-");
}

// Brand normalizer
function normalizeBrand(raw) {
  if (!raw) return "Khác";
  const b = raw.trim();
  const lower = b.toLowerCase();
  if (lower.includes("hada labo")) return "Hada Labo";
  if (lower.includes("cỏ mềm")) return "Cỏ Mềm";
  if (lower.includes("cocoon")) return "Cocoon";
  if (lower.includes("la roche")) return "La Roche-Posay";
  if (lower.includes("round lab")) return "Round Lab";
  if (lower.includes("klairs")) return "Klairs";
  if (lower.includes("ma:nyo") || lower.includes("manyo")) return "Ma:nyo";
  if (lower.includes("bioderma")) return "Bioderma";
  if (lower.includes("garnier")) return "Garnier";
  if (lower.includes("simple")) return "Simple";
  if (lower.includes("cerave")) return "CeraVe";
  if (lower.includes("svr")) return "SVR";
  if (lower.includes("jmsolution")) return "JMsolution";
  if (lower.includes("hatomugi")) return "Hatomugi";
  if (lower.includes("torriden")) return "Torriden";
  if (lower.includes("drceutics")) return "DrCeutics";
  if (lower.includes("skin1004")) return "SKIN1004";
  if (lower.includes("purito")) return "Purito";
  if (lower.includes("beplain")) return "Beplain";
  if (lower.includes("kiehl")) return "Kiehl's";
  if (lower.includes("dermarium")) return "Dermarium";
  if (lower.includes("compliment")) return "Compliment";
  if (lower.includes("decumar")) return "Decumar";
  if (lower.includes("eucerin")) return "Eucerin";
  if (lower.includes("vichy")) return "Vichy";
  if (lower.includes("l’oréal") || lower.includes("l'oreal")) return "L'Oréal";
  if (lower.includes("sunplay")) return "Sunplay";
  if (lower.includes("anessa")) return "Anessa";
  if (lower.includes("centaphil") || lower.includes("cetaphil")) return "Cetaphil";
  if (lower.includes("sulwhasoo")) return "Sulwhasoo";
  if (lower.includes("d’ alba") || lower.includes("d'alba")) return "d'Alba";
  if (lower.includes("carophy") || lower.includes("caryophy")) return "Caryophy";
  if (lower.includes("dr.pepti") || lower.includes("pepti")) return "Dr.Pepti";
  if (lower.includes("neutrogena")) return "Neutrogena";
  if (lower.includes("embryolisse")) return "Embryolisse";
  if (lower.includes("curél") || lower.includes("curel")) return "Curél";
  if (lower.includes("dr.g")) return "Dr.G";
  return b;
}

// Estimate realistic market price based on brand and size
function estimatePrice(brand, name) {
  const b = brand.toLowerCase();
  const n = name.toLowerCase();

  if (n.includes("mini") || n.includes("15ml") || n.includes("7.5ml") || n.includes("10ml")) {
    return 79000 + Math.floor(Math.random() * 4) * 10000;
  }
  if (b.includes("sunplay")) return 145000 + Math.floor(Math.random() * 6) * 10000;
  if (b.includes("cỏ mềm")) {
    if (n.includes("sâm 1700")) return 395000;
    return 220000 + Math.floor(Math.random() * 5) * 10000;
  }
  if (b.includes("cocoon")) return 295000 + Math.floor(Math.random() * 5) * 10000;
  if (b.includes("hada labo")) return 260000 + Math.floor(Math.random() * 4) * 10000;
  if (b.includes("la roche")) return 465000 + Math.floor(Math.random() * 5) * 10000;
  if (b.includes("anessa")) return 525000 + Math.floor(Math.random() * 6) * 10000;
  if (b.includes("eucerin") || b.includes("vichy") || b.includes("svr")) return 420000 + Math.floor(Math.random() * 6) * 10000;
  if (b.includes("round lab") || b.includes("torriden") || b.includes("skin1004") || b.includes("beplain") || b.includes("purito") || b.includes("klairs")) {
    return 345000 + Math.floor(Math.random() * 6) * 10000;
  }
  if (b.includes("d'alba") || b.includes("sulwhasoo") || b.includes("kiehl")) return 680000 + Math.floor(Math.random() * 8) * 10000;
  if (b.includes("hatomugi") || b.includes("garnier") || b.includes("decumar")) return 165000 + Math.floor(Math.random() * 4) * 10000;
  if (b.includes("simple") || b.includes("drceutics")) return 210000 + Math.floor(Math.random() * 5) * 10000;
  return 280000 + Math.floor(Math.random() * 6) * 10000;
}

// Detect skin types
function detectSkinTypes(name, brand) {
  const text = (name + " " + brand).toLowerCase();
  const types = new Set();

  if (text.includes("kiềm dầu") || text.includes("dầu mụn") || text.includes("dầu") || text.includes("oily") || text.includes("matte") || text.includes("ráo mịn") || text.includes("nhờn") || text.includes("bí đao")) {
    types.add("oily");
    types.add("combination");
  }
  if (text.includes("ẩm") || text.includes("khô") || text.includes("dry") || text.includes("nước") || text.includes("water") || text.includes("aqua") || text.includes("hyaluron")) {
    types.add("dry");
    types.add("normal");
    types.add("combination");
  }
  if (text.includes("nhạy cảm") || text.includes("mẹ và bé") || text.includes("vật lý") || text.includes("cica") || text.includes("dịu") || text.includes("rau má") || text.includes("khoáng") || text.includes("sensitive") || text.includes("gentle")) {
    types.add("sensitive");
    types.add("normal");
    types.add("combination");
  }
  if (text.includes("mọi loại da") || text.includes("all skin") || text.includes("nâng tone") || text.includes("tone up") || text.includes("sáng da")) {
    types.add("combination");
    types.add("normal");
    types.add("dry");
    types.add("oily");
  }

  if (types.size === 0) {
    types.add("combination");
    types.add("normal");
    types.add("oily");
    types.add("sensitive");
  }

  return Array.from(types);
}

// Detect skin concerns
function detectConcerns(name, brand) {
  const text = (name + " " + brand).toLowerCase();
  const concerns = new Set(["dark_spots", "aging"]); // Standard UV protection concerns

  if (text.includes("mụn") || text.includes("rau má") || text.includes("tràm trà") || text.includes("kiềm dầu") || text.includes("bí đao")) {
    concerns.add("acne");
    concerns.add("pores");
  }
  if (text.includes("nâng tone") || text.includes("tone up") || text.includes("trắng") || text.includes("sáng") || text.includes("sơ ri") || text.includes("vitamin c") || text.includes("mờ nám")) {
    concerns.add("dullness");
    concerns.add("dark_spots");
  }
  if (text.includes("ẩm") || text.includes("cấp nước") || text.includes("hyaluron") || text.includes("nước") || text.includes("dưỡng ẩm")) {
    concerns.add("dehydration");
  }
  if (text.includes("sâm") || text.includes("lão hóa") || text.includes("nếp nhăn") || text.includes("chống nhăn") || text.includes("collagen")) {
    concerns.add("aging");
  }

  return Array.from(concerns);
}

// Derive ingredients
function deriveIngredients(name, brand) {
  const text = (name + " " + brand).toLowerCase();
  const ingSet = new Set();

  if (text.includes("vật lý") || text.includes("khoáng") || text.includes("mẹ và bé")) {
    ingSet.add("Zinc Oxide");
    ingSet.add("Titanium Dioxide");
  } else {
    ingSet.add("Tinosorb S");
    ingSet.add("Mexoryl SX/XL");
    ingSet.add("Zinc Oxide");
  }

  if (text.includes("rau má") || text.includes("cica") || text.includes("centella")) {
    ingSet.add("Chiết xuất Rau Má (Centella Asiatica)");
    ingSet.add("Niacinamide (Vitamin B3)");
  }
  if (text.includes("sâm")) {
    ingSet.add("Chiết xuất Sâm 1700");
    ingSet.add("Niacinamide");
    ingSet.add("Adenosine");
  }
  if (text.includes("sơ ri") || text.includes("vitamin c")) {
    ingSet.add("Chiết xuất Quả Sơ Ri");
    ingSet.add("Vitamin C (3-O-Ethyl Ascorbic Acid)");
  }
  if (text.includes("bí đao")) {
    ingSet.add("Chiết xuất Bí Đao");
    ingSet.add("Tinh dầu Tràm Trà");
    ingSet.add("Niacinamide 7%");
  }
  if (text.includes("sen")) {
    ingSet.add("Chiết xuất Hoa Sen Hậu Giang");
    ingSet.add("Vitamin E");
  }
  if (text.includes("trà xanh") || text.includes("green tea")) {
    ingSet.add("Chiết xuất Trà Xanh (Green Tea Extract)");
  }
  if (text.includes("d'alba") || text.includes("alba")) {
    ingSet.add("White Truffle (Nấm Truffle Trắng)");
    ingSet.add("Tocopherol (Vitamin E)");
  }
  if (text.includes("torriden") || text.includes("round lab") || text.includes("ẩm") || text.includes("aqua")) {
    ingSet.add("Hyaluronic Acid đa tầng");
    ingSet.add("Panthenol (Vitamin B5)");
  }
  if (text.includes("hatomugi")) {
    ingSet.add("Chiết xuất Ý Dĩ (Hatomugi)");
    ingSet.add("Hyaluronic Acid");
  }

  if (ingSet.size < 3) {
    ingSet.add("Niacinamide");
    ingSet.add("Vitamin E");
    ingSet.add("Hyaluronic Acid");
  }

  return Array.from(ingSet).slice(0, 5);
}

// Generate descriptive summary
function generateDescription(name, brand, skinTypes, concerns) {
  let finish = "lớp màng chắn mỏng nhẹ, thoáng mịn, không gây bết dính";
  const lower = name.toLowerCase();
  if (lower.includes("kiềm dầu") || lower.includes("ráo mịn") || lower.includes("matte")) {
    finish = "hiệu ứng ráo mịn kiềm dầu bền bỉ suốt cả ngày dài";
  } else if (lower.includes("nâng tone") || lower.includes("tone up") || lower.includes("sáng da")) {
    finish = "lớp nền nâng tone trắng hồng tự nhiên, rạng rỡ và đều màu";
  } else if (lower.includes("ẩm") || lower.includes("water") || lower.includes("aqua")) {
    finish = "lớp finish căng bóng ẩm mượt, ngậm nước tự nhiên";
  }

  return `${name} đến từ thương hiệu ${brand} sở hữu màng lọc chống nắng quang phổ rộng tiên tiến, bảo vệ da tối ưu trước tác hại của tia UVA, UVB và ánh sáng xanh. Kết cấu tạo ${finish}, an toàn lành tính cho làn da người dùng.`;
}

// Function to resolve ibb.co link via https.get with family 4
function resolveIbbUrl(url) {
  if (!url || !url.includes("ibb.co")) return Promise.resolve("");
  return new Promise((resolve) => {
    const cleanUrl = url.trim();
    const req = https.get(cleanUrl, { family: 4, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        const m = data.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
        resolve(m ? m[1] : "");
      });
      res.on("error", () => resolve(""));
    });
    req.on("error", () => resolve(""));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve("");
    });
  });
}

async function run() {
  console.log("--> Đang đọc file Excel:", excelPath);
  if (!fs.existsSync(excelPath)) {
    console.error("Không tìm thấy file Excel tại:", excelPath);
    process.exit(1);
  }

  // Also copy Excel file to frontend/src/data for parity with Toner.xlsx
  try {
    fs.copyFileSync(excelPath, frontendExcelPath);
    console.log("--> Đã sao chép Kem Chống Nắng .xlsx sang fontend/src/data/ ✅");
  } catch (err) {
    console.warn("Không thể sao chép Excel sang frontend:", err.message);
  }

  const wb = xlsx.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = xlsx.utils.decode_range(ws['!ref']);

  const extracted = [];
  let currentBrand = "";

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const nameCell = ws[xlsx.utils.encode_cell({ r: R, c: 0 })];
    const brandCell = ws[xlsx.utils.encode_cell({ r: R, c: 1 })];
    const linkCell = ws[xlsx.utils.encode_cell({ r: R, c: 2 })];
    const imgCell = ws[xlsx.utils.encode_cell({ r: R, c: 3 })];

    if (!nameCell || !nameCell.v) continue;

    let rawName = String(nameCell.v).trim();
    // Clean up " | Shopee Việt Nam" or "| Shopee"
    rawName = rawName.replace(/\s*\|\s*Shopee\s*(Việt Nam|Viet Nam)?/gi, "").trim();

    const rawBrand = brandCell && brandCell.v ? String(brandCell.v).trim() : "";
    if (rawBrand) {
      currentBrand = rawBrand;
    }

    let productLink = "";
    if (linkCell) {
      if (linkCell.l && linkCell.l.Target) {
        productLink = linkCell.l.Target;
      } else if (typeof linkCell.v === 'string' && linkCell.v.startsWith('http')) {
        productLink = linkCell.v.trim();
      }
    }

    const imgLink = imgCell && imgCell.v ? String(imgCell.v).trim() : "";

    extracted.push({
      index: extracted.length + 1,
      name: rawName,
      brand: normalizeBrand(currentBrand),
      link: productLink,
      imgLink
    });
  }

  console.log(`--> Đã trích xuất ${extracted.length} sản phẩm kem chống nắng từ Excel.`);

  // Load existing products from backend/data/products.json
  let existingProducts = [];
  if (fs.existsSync(backendProductsPath)) {
    try {
      existingProducts = JSON.parse(fs.readFileSync(backendProductsPath, "utf8"));
    } catch (e) {
      existingProducts = [];
    }
  }

  // Keep existing non-sunscreen products (like toner)
  const nonSunscreenProducts = existingProducts.filter((p) => p.category !== "sunscreen");
  console.log(`--> Giữ lại ${nonSunscreenProducts.length} sản phẩm danh mục khác (như Toner).`);

  // Batch resolve ibb image links with concurrency pool of 10
  console.log("--> Bắt đầu phân giải link ảnh trực tiếp từ ibb.co...");
  const CONCURRENCY = 10;
  const directImageUrls = new Array(extracted.length).fill("");

  for (let i = 0; i < extracted.length; i += CONCURRENCY) {
    const chunk = extracted.slice(i, i + CONCURRENCY);
    const promises = chunk.map((item, idx) =>
      resolveIbbUrl(item.imgLink).then((url) => {
        directImageUrls[i + idx] = url;
      })
    );
    await Promise.all(promises);
    process.stdout.write(`\r    Tiến độ tải link ảnh: ${Math.min(i + CONCURRENCY, extracted.length)}/${extracted.length}`);
  }
  console.log("\n--> Hoàn tất phân giải link ảnh!");

  const slugCounts = {};
  const sunscreenProducts = extracted.map((item, idx) => {
    let baseSlug = "sunscreen-" + slugify(item.name).substring(0, 50).replace(/-+$/, "");
    if (!baseSlug || baseSlug === "sunscreen-") {
      baseSlug = `sunscreen-${slugify(item.brand)}-${idx + 1}`;
    }
    let slug = baseSlug;
    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug = `${baseSlug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }

    const skinTypes = detectSkinTypes(item.name, item.brand);
    const concerns = detectConcerns(item.name, item.brand);
    const ingredients = deriveIngredients(item.name, item.brand);
    const price = estimatePrice(item.brand, item.name);
    const description = generateDescription(item.name, item.brand, skinTypes, concerns);

    // Fallback image if resolution failed
    let finalImageUrl = directImageUrls[idx];
    if (!finalImageUrl) {
      if (item.imgLink && item.imgLink.startsWith("http")) {
        finalImageUrl = item.imgLink;
      } else {
        finalImageUrl = "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&q=80";
      }
    }

    const rating = 4.8 + Math.round(Math.random() * 2) / 10; // 4.8, 4.9, or 5.0
    const reviews = 50 + Math.floor(Math.random() * 220); // 50 to 270

    return {
      id: slug,
      name: item.name,
      brand: item.brand,
      category: "sunscreen",
      price,
      rating,
      reviews,
      skinTypes,
      concerns,
      ingredients,
      image: finalImageUrl,
      hoverImage: finalImageUrl,
      images: [finalImageUrl],
      description,
      stock: 100,
      link: item.link || "https://shopee.vn",
      cloudinaryImage: finalImageUrl
    };
  });

  const allProducts = [...nonSunscreenProducts, ...sunscreenProducts];
  console.log(`--> Tổng cộng danh mục sản phẩm mới: ${allProducts.length} sản phẩm (${nonSunscreenProducts.length} Toner + ${sunscreenProducts.length} Kem Chống Nắng)!`);

  // Write to backend/data/products.json
  fs.writeFileSync(backendProductsPath, JSON.stringify(allProducts, null, 2), "utf8");
  console.log("--> Đã cập nhật backend/data/products.json ✅");

  // Write to fontend/src/data/products.json
  fs.writeFileSync(frontendProductsPath, JSON.stringify(allProducts, null, 2), "utf8");
  console.log("--> Đã cập nhật fontend/src/data/products.json ✅");

  console.log("\n🎉 HOÀN THÀNH TẤT CẢ! Đã chuyển đổi Kem Chống Nắng .xlsx sang danh mục sản phẩm tương tự như Toner!");
}

run().catch((err) => {
  console.error("Lỗi khi import sản phẩm kem chống nắng:", err);
  process.exit(1);
});
