import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/products.json"), "utf8"));

const moist = products.filter((p) => p.category === "moisturizer");
console.log(`Moisturizers (${moist.length}):`);
moist.forEach((p, idx) => {
  console.log(`[${idx + 1}] brand: ${p.brand} | name: ${p.name}`);
});
