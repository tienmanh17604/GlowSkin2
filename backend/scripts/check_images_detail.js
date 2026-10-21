import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as xlsxModule from "xlsx";

const xlsx = xlsxModule.default || xlsxModule;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const productsPath = path.join(__dirname, "../data/products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

console.log("=== CHECK PRODUCTS.JSON ===");
const sunscreens = products.filter((p) => p.category === "sunscreen");
const moisturizers = products.filter((p) => p.category === "moisturizer");
const toners = products.filter((p) => p.category === "toner");

function analyzeImages(list, name) {
  console.log(`\n--- ${name} (Total: ${list.length}) ---`);
  let ibbCount = 0;
  let unsplashCount = 0;
  let cloudinaryCount = 0;
  let otherCount = 0;
  let emptyCount = 0;
  let ibbExamples = [];

  list.forEach((p) => {
    const img = p.image || "";
    if (!img) emptyCount++;
    else if (img.includes("ibb.co")) {
      ibbCount++;
      if (ibbExamples.length < 5) ibbExamples.push({ id: p.id, name: p.name, img });
    } else if (img.includes("unsplash.com")) unsplashCount++;
    else if (img.includes("cloudinary.com")) cloudinaryCount++;
    else otherCount++;
  });

  console.log({ emptyCount, ibbCount, unsplashCount, cloudinaryCount, otherCount });
  if (ibbExamples.length) {
    console.log("ibb examples:", ibbExamples);
  }
}

analyzeImages(sunscreens, "Sunscreen");
analyzeImages(moisturizers, "Moisturizer");
analyzeImages(toners, "Toner");

// Now check Kem Chống Nắng .xlsx
console.log("\n=== CHECK Kem Chống Nắng .xlsx ===");
const sunExcelPath = path.join(__dirname, "../data/Kem Chống Nắng .xlsx");
if (fs.existsSync(sunExcelPath)) {
  const wb = xlsx.readFile(sunExcelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log("Sunscreen Excel total rows:", data.length);
  console.log("Row 0 (headers):", data[0]);
  console.log("Row 1 sample:", data[1]);
  console.log("Row 2 sample:", data[2]);
  
  // Count how many have image in column 3 (index 3)
  let countWithImg = 0;
  let sampleImgs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[3]) {
      countWithImg++;
      if (sampleImgs.length < 5) sampleImgs.push(row[3]);
    }
  }
  console.log(`Rows with img in col 3: ${countWithImg} / ${data.length - 1}`);
  console.log("Sample col 3 values:", sampleImgs);
}

// Now check Kem Dưỡng.xlsx
console.log("\n=== CHECK Kem Dưỡng.xlsx ===");
const moistExcelPath = path.join(__dirname, "../data/Kem Dưỡng.xlsx");
if (fs.existsSync(moistExcelPath)) {
  const wb = xlsx.readFile(moistExcelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log("Moisturizer Excel total rows:", data.length);
  console.log("Row 0 (headers):", data[0]);
  console.log("Row 1 sample:", data[1]);
  console.log("Row 2 sample:", data[2]);
  let countWithImg = 0;
  let sampleImgs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[3]) {
      countWithImg++;
      if (sampleImgs.length < 5) sampleImgs.push(row[3]);
    }
  }
  console.log(`Rows with img in col 3: ${countWithImg} / ${data.length - 1}`);
  console.log("Sample col 3 values:", sampleImgs);
}
