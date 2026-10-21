import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/products.json"), "utf8"));

const sunscreens = products.filter((p) => p.category === "sunscreen");
const brokenSunscreens = sunscreens.filter((p) => !p.image.includes("i.ibb.co") && !p.image.includes("unsplash.com") && p.image.includes("ibb.co"));

console.log(`Broken sunscreens count: ${brokenSunscreens.length}`);
const brandCount = {};
brokenSunscreens.forEach((p, idx) => {
  brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
  console.log(`[${idx + 1}] Brand: ${p.brand} | Name: ${p.name.substring(0, 50)} | Link: ${p.link}`);
});
console.log("Broken sunscreen by brand:", brandCount);
