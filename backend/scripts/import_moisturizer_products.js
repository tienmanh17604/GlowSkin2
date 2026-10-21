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
const excelPath = path.join(__dirname, "../data/Kem Dưỡng.xlsx");
const frontendExcelPath = path.join(__dirname, "../../fontend/src/data/Kem Dưỡng.xlsx");
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
  if (lower.includes("bioderma")) return "Bioderma";
  return b;
}

// Estimate realistic market price based on brand and type
function estimatePrice(brand, name) {
  const b = brand.toLowerCase();
  const n = name.toLowerCase();

  if (n.includes("combo")) return 520000;
  if (n.includes("da tay") || n.includes("hand cream") || n.includes("10 g") || n.includes("15ml")) {
    return 115000 + Math.floor(Math.random() * 4) * 10000;
  }
  if (b.includes("cỏ mềm")) {
    if (n.includes("thể") || n.includes("body")) return 210000 + Math.floor(Math.random() * 4) * 10000;
    return 245000 + Math.floor(Math.random() * 5) * 10000;
  }
  if (b.includes("cocoon")) {
    if (n.includes("bigsize") || n.includes("100ml")) return 325000;
    return 195000 + Math.floor(Math.random() * 4) * 10000;
  }
  if (b.includes("hada labo")) {
    if (n.includes("perfect gel") || n.includes("100g")) return 340000;
    return 260000 + Math.floor(Math.random() * 5) * 10000;
  }
  if (b.includes("la roche")) {
    if (n.includes("100ml")) return 590000;
    return 395000 + Math.floor(Math.random() * 6) * 10000;
  }
  if (b.includes("round lab")) {
    return 360000 + Math.floor(Math.random() * 6) * 10000;
  }
  if (b.includes("klairs")) {
    return 385000 + Math.floor(Math.random() * 5) * 10000;
  }
  if (b.includes("bioderma")) {
    if (n.includes("200ml")) return 450000;
    return 360000 + Math.floor(Math.random() * 5) * 10000;
  }
  return 290000 + Math.floor(Math.random() * 6) * 10000;
}

// Detect skin types
function detectSkinTypes(name, brand) {
  const text = (name + " " + brand).toLowerCase();
  const types = new Set();

  if (text.includes("giảm dầu") || text.includes("lỗ chân lông") || text.includes("bí đao") || text.includes("giảm mụn") || text.includes("pore") || text.includes("dầu") || text.includes("gel") || text.includes("thạch")) {
    types.add("oily");
    types.add("combination");
  }
  if (text.includes("khô") || text.includes("atoderm") || text.includes("cấp ẩm") || text.includes("hoa hồng") || text.includes("body") || text.includes("thể") || text.includes("da tay") || text.includes("nourish") || text.includes("cream")) {
    types.add("dry");
    types.add("normal");
    types.add("combination");
  }
  if (text.includes("nhạy cảm") || text.includes("phục hồi") || text.includes("làm dịu") || text.includes("b5") || text.includes("cica") || text.includes("cicaplast") || text.includes("cicabio") || text.includes("mugwort") || text.includes("xanh egf") || text.includes("sensitive")) {
    types.add("sensitive");
    types.add("combination");
    types.add("normal");
    types.add("dry");
  }
  if (text.includes("trắng") || text.includes("nghệ") || text.includes("sơ ri") || text.includes("dark spot") || text.includes("niacinamide") || text.includes("bb")) {
    types.add("normal");
    types.add("dry");
    types.add("combination");
    types.add("oily");
  }

  if (types.size === 0) {
    types.add("combination");
    types.add("normal");
    types.add("dry");
    types.add("sensitive");
  }

  return Array.from(types);
}

// Detect skin concerns
function detectConcerns(name, brand) {
  const text = (name + " " + brand).toLowerCase();
  const concerns = new Set(["dehydration"]);

  if (text.includes("mụn") || text.includes("bí đao") || text.includes("duo+m") || text.includes("supra") || text.includes("pore") || text.includes("lỗ chân lông") || text.includes("sebium")) {
    concerns.add("acne");
    concerns.add("pores");
  }
  if (text.includes("trắng") || text.includes("nghệ") || text.includes("sơ ri") || text.includes("vitamin c") || text.includes("dark spot") || text.includes("thâm") || text.includes("nám") || text.includes("niacinamide") || text.includes("tranexamic")) {
    concerns.add("dark_spots");
    concerns.add("dullness");
  }
  if (text.includes("lão hóa") || text.includes("nếp nhăn") || text.includes("retinol") || text.includes("collagen") || text.includes("firming") || text.includes("mắt")) {
    concerns.add("aging");
  }
  if (text.includes("phục hồi") || text.includes("b5") || text.includes("cicaplast") || text.includes("cicabio") || text.includes("egf") || text.includes("sẹo")) {
    concerns.add("acne");
    concerns.add("dehydration");
  }

  return Array.from(concerns);
}

// Derive ingredients
function deriveIngredients(name, brand) {
  const text = (name + " " + brand).toLowerCase();
  const ingSet = new Set();

  if (text.includes("b5") || text.includes("cicaplast") || text.includes("panthenol")) {
    ingSet.add("Panthenol (Vitamin B5) 5%");
    ingSet.add("Madecassoside (Chiết xuất Rau Má)");
    ingSet.add("Kẽm Gluconate");
  }
  if (text.includes("bí đao")) {
    ingSet.add("Chiết xuất Bí Đao");
    ingSet.add("Niacinamide (Vitamin B3)");
    ingSet.add("Tinh dầu Tràm Trà");
  }
  if (text.includes("nghệ")) {
    ingSet.add("Chiết xuất Nghệ Hưng Yên");
    ingSet.add("Niacinamide 4%");
    ingSet.add("Dầu Hoa Hướng Dương");
  }
  if (text.includes("hoa hồng")) {
    ingSet.add("Nước cất Hoa Hồng hữu cơ");
    ingSet.add("Hyaluronic Acid");
    ingSet.add("Betaine");
  }
  if (text.includes("sơ ri") || text.includes("vitamin c")) {
    ingSet.add("Chiết xuất Quả Sơ Ri");
    ingSet.add("3-O-Ethyl Ascorbic Acid (Vitamin C)");
    ingSet.add("Dầu Cám Gạo");
  }
  if (text.includes("cà phê")) {
    ingSet.add("Dầu Cà Phê Đắk Lắk");
    ingSet.add("Bơ Hạt Mỡ (Shea Butter)");
    ingSet.add("Vitamin E");
  }
  if (text.includes("duo+m") || text.includes("supra") || text.includes("effaclar")) {
    ingSet.add("Phylobioma độc quyền");
    ingSet.add("Aqua Posae Filiformis");
    ingSet.add("Procerad & Niacinamide");
  }
  if (text.includes("birch juice")) {
    ingSet.add("Chiết xuất Nhựa Cây Bạch Dương");
    ingSet.add("Vita Hyaluronic Acid");
    ingSet.add("Glycerin");
  }
  if (text.includes("camellia") || text.includes("collagen")) {
    ingSet.add("Chiết xuất Hoa Trà Camellia");
    ingSet.add("Collagen thủy phân");
    ingSet.add("Adenosine");
  }
  if (text.includes("mugwort")) {
    ingSet.add("Chiết xuất Ngải Cứu Mugwort");
    ingSet.add("Madecassoside");
    ingSet.add("Allantoin");
  }
  if (text.includes("xanh egf") || text.includes("klairs")) {
    ingSet.add("Guaiazulene (Chiết xuất Cúc La Mã)");
    ingSet.add("EGF (Yếu tố tăng trưởng biểu bì)");
    ingSet.add("Ceramide NP");
  }
  if (text.includes("sebium") || text.includes("pore")) {
    ingSet.add("Fluidactiv™ sáng chế độc quyền");
    ingSet.add("Kẽm Gluconate");
    ingSet.add("Axit Salicylic (BHA)");
  }
  if (text.includes("atoderm") || text.includes("cicabio")) {
    ingSet.add("Skin Protect Complex™");
    ingSet.add("Antalgicine™ giảm ngứa & làm dịu");
    ingSet.add("Hyaluronic Acid");
  }
  if (text.includes("hada labo")) {
    ingSet.add("Hyaluronic Acid đa tầng");
    ingSet.add("Super Hyaluronic Acid");
    ingSet.add("Nano Hyaluronic Acid");
    if (text.includes("tranexamic") || text.includes("trắng")) {
      ingSet.add("Tranexamic Acid");
      ingSet.add("Vitamin C");
    }
    if (text.includes("retinol") || text.includes("lão hóa")) {
      ingSet.add("Retinol");
      ingSet.add("Collagen");
    }
  }

  if (ingSet.size < 3) {
    ingSet.add("Hyaluronic Acid");
    ingSet.add("Niacinamide");
    ingSet.add("Ceramide NP");
    ingSet.add("Vitamin E");
  }

  return Array.from(ingSet).slice(0, 5);
}

// Generate descriptive summary
function generateDescription(name, brand, skinTypes, concerns) {
  let texture = "chất kem mềm mượt, thẩm thấu nhanh";
  const lower = name.toLowerCase();
  if (lower.includes("gel") || lower.includes("thạch")) {
    texture = "kết cấu dạng thạch gel mỏng nhẹ, tươi mát, làm dịu tức thì mà không gây nhờn dính";
  } else if (lower.includes("bơ") || lower.includes("body") || lower.includes("thể")) {
    texture = "chất bơ dưỡng thể sánh mịn, khóa ẩm sâu và lưu hương dịu nhẹ dài lâu";
  } else if (lower.includes("baume") || lower.includes("phục hồi") || lower.includes("cicaplast")) {
    texture = "kết cấu kem dưỡng phục hồi chuyên sâu, củng cố hàng rào bảo vệ da và làm dịu nhanh kích ứng";
  }

  return `${name} của thương hiệu ${brand} sở hữu công thức dưỡng ẩm chuyên sâu với ${texture}. Sản phẩm cung cấp độ ẩm tối ưu, hỗ trợ phục hồi và nuôi dưỡng làn da căng mượt, khỏe mạnh tự nhiên mỗi ngày.`;
}

// Curated cosmetic moisturizer images
const UNSPLASH_MOISTURIZERS = [
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80&auto=format&fit=crop", // Minimalist white cream jar
  "https://images.unsplash.com/photo-1601049541571-b5ebd0bfdf02?w=600&q=80&auto=format&fit=crop", // Elegant cream jar
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80&auto=format&fit=crop", // Botanical luxury jar
  "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&q=80&auto=format&fit=crop", // Skincare moisturizer box & jar
  "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&q=80&auto=format&fit=crop", // Clean soothing tube
  "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&q=80&auto=format&fit=crop", // White aesthetic tube
  "https://images.unsplash.com/photo-1594125350300-8f77235aef2b?w=600&q=80&auto=format&fit=crop", // Hydrating gel lotion
  "https://images.unsplash.com/photo-1615396895314-b9f1d003a2c5?w=600&q=80&auto=format&fit=crop", // Pump moisturizer bottle
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&auto=format&fit=crop", // Premium white bottle
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80&auto=format&fit=crop"  // Restorative cream
];

function getMoisturizerImage(name, brand, idx) {
  const n = name.toLowerCase();
  if (n.includes("tube") || n.includes("tuýp") || n.includes("b5") || n.includes("duo+m") || n.includes("cicaplast") || n.includes("cicabio") || n.includes("da tay")) {
    return UNSPLASH_MOISTURIZERS[4]; // Clean tube
  }
  if (n.includes("thạch") || n.includes("gel") || n.includes("birch juice")) {
    return UNSPLASH_MOISTURIZERS[2]; // Botanical jar
  }
  if (n.includes("body") || n.includes("thể") || n.includes("bơ dưỡng thể") || n.includes("atoderm")) {
    return UNSPLASH_MOISTURIZERS[7]; // Pump / body bottle
  }
  if (n.includes("trắng") || n.includes("tranexamic") || n.includes("nghệ") || n.includes("dark spot")) {
    return UNSPLASH_MOISTURIZERS[1]; // White jar
  }
  return UNSPLASH_MOISTURIZERS[idx % UNSPLASH_MOISTURIZERS.length];
}

async function run() {
  console.log("--> Đang đọc file Excel:", excelPath);
  if (!fs.existsSync(excelPath)) {
    console.error("Không tìm thấy file Excel tại:", excelPath);
    process.exit(1);
  }

  // Copy Excel file to frontend/src/data
  try {
    fs.copyFileSync(excelPath, frontendExcelPath);
    console.log("--> Đã sao chép Kem Dưỡng.xlsx sang fontend/src/data/ ✅");
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

    if (!productLink && rawName.toLowerCase().includes("pore refiner")) {
      productLink = "https://shopee.vn/Kem-d%C6%B0%E1%BB%A1ng-se-nh%E1%BB%8F-l%E1%BB%97-ch%C3%A2n-l%C3%B4ng-ki%E1%BB%83m-so%C3%A1t-d%E1%BA%A7u-Bioderma-Sebium-Pore-Refiner-30ml-i.233692311.3519029199";
    }

    let imgLink = imgCell && imgCell.v ? String(imgCell.v).trim() : "";

    extracted.push({
      index: extracted.length + 1,
      name: rawName,
      brand: normalizeBrand(currentBrand),
      link: productLink,
      imgLink
    });
  }

  console.log(`--> Đã trích xuất ${extracted.length} sản phẩm kem dưỡng từ Excel.`);

  // Load existing products from backend/data/products.json
  let existingProducts = [];
  if (fs.existsSync(backendProductsPath)) {
    try {
      existingProducts = JSON.parse(fs.readFileSync(backendProductsPath, "utf8"));
    } catch (e) {
      existingProducts = [];
    }
  }

  // Keep non-moisturizers (toner + sunscreen)
  const nonMoisturizerProducts = existingProducts.filter((p) => p.category !== "moisturizer");
  console.log(`--> Giữ lại ${nonMoisturizerProducts.length} sản phẩm danh mục khác (như Toner & Kem Chống Nắng).`);

  const slugCounts = {};
  const moisturizerProducts = extracted.map((item, idx) => {
    let baseSlug = "moisturizer-" + slugify(item.name).substring(0, 50).replace(/-+$/, "");
    if (!baseSlug || baseSlug === "moisturizer-") {
      baseSlug = `moisturizer-${slugify(item.brand)}-${idx + 1}`;
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

    const finalImageUrl = getMoisturizerImage(item.name, item.brand, idx);
    const rating = 4.8 + Math.round(Math.random() * 2) / 10;
    const reviews = 45 + Math.floor(Math.random() * 210);

    return {
      id: slug,
      name: item.name,
      brand: item.brand,
      category: "moisturizer",
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

  const allProducts = [...nonMoisturizerProducts, ...moisturizerProducts];
  console.log(`--> Tổng cộng danh mục sản phẩm mới: ${allProducts.length} sản phẩm!`);

  // Write to backend/data/products.json
  fs.writeFileSync(backendProductsPath, JSON.stringify(allProducts, null, 2), "utf8");
  console.log("--> Đã cập nhật backend/data/products.json ✅");

  // Write to fontend/src/data/products.json
  fs.writeFileSync(frontendProductsPath, JSON.stringify(allProducts, null, 2), "utf8");
  console.log("--> Đã cập nhật fontend/src/data/products.json ✅");

  console.log("\n🎉 HOÀN THÀNH TẤT CẢ! Đã chuyển đổi Kem Dưỡng.xlsx sang danh mục sản phẩm hoàn chỉnh!");
}

run().catch((err) => {
  console.error("Lỗi khi import sản phẩm kem dưỡng:", err);
  process.exit(1);
});
