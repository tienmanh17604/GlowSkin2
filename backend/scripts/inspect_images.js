import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, "../data/products.json");

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
console.log("Total products in products.json:", products.length);

const categories = {};
products.forEach((p) => {
  categories[p.category] = (categories[p.category] || 0) + 1;
});
console.log("Categories distribution:", categories);

const sunscreens = products.filter((p) => p.category === "sunscreen");
const moisturizers = products.filter((p) => p.category === "moisturizer");

console.log(`\n--- KEM CHỐNG NẮNG (${sunscreens.length}) ---`);
const badSunscreen = sunscreens.filter((p) => !p.image || !p.image.startsWith("http"));
console.log(`Bad/Missing image count in sunscreen: ${badSunscreen.length}`);
sunscreens.forEach((p, idx) => {
  console.log(`[${idx + 1}] id: ${p.id} | image: ${p.image?.substring(0, 60)}...`);
});

console.log(`\n--- KEM DƯỠNG (${moisturizers.length}) ---`);
const badMoisturizer = moisturizers.filter((p) => !p.image || !p.image.startsWith("http"));
console.log(`Bad/Missing image count in moisturizer: ${badMoisturizer.length}`);
moisturizers.forEach((p, idx) => {
  console.log(`[${idx + 1}] id: ${p.id} | image: ${p.image?.substring(0, 60)}...`);
});
