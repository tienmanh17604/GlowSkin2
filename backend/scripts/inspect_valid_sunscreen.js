import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, "../data/products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

const sunscreens = products.filter((p) => p.category === "sunscreen");
const valid = sunscreens.filter((p) => p.image.includes("i.ibb.co"));

console.log("Valid sunscreen images count:", valid.length);
valid.slice(0, 15).forEach((p) => {
  console.log(`- [${p.brand}] ${p.name.substring(0, 40)} -> ${p.image}`);
});
