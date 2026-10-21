import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/products.json"), "utf8"));

const sunscreens = products.filter((p) => p.category === "sunscreen");
const valid = sunscreens.filter((p) => p.image.includes("i.ibb.co"));

const byBrand = {};
valid.forEach((p) => {
  if (!byBrand[p.brand]) byBrand[p.brand] = [];
  byBrand[p.brand].push({ name: p.name, image: p.image });
});

console.log("Valid images by brand:");
Object.keys(byBrand).forEach((b) => {
  console.log(`\n=== ${b} (${byBrand[b].length} valid images) ===`);
  byBrand[b].forEach((item) => {
    console.log(`- ${item.name.substring(0, 50)} : ${item.image}`);
  });
});
