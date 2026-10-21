import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, "../data/products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

const toners = products.filter((p) => p.category === "toner");
console.log(`Checking ${toners.length} toners...`);
toners.forEach((t) => {
  console.log(`- ${t.name.substring(0, 35)} | img: ${t.image?.substring(0, 60)}`);
});
