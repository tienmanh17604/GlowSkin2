import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as xlsxModule from "xlsx";

const xlsx = xlsxModule.default || xlsxModule;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const moistWb = xlsx.readFile(path.join(__dirname, "../data/Kem Dưỡng.xlsx"));
const moistWs = moistWb.Sheets[moistWb.SheetNames[0]];
const moistData = xlsx.utils.sheet_to_json(moistWs, { header: 1 });

console.log("Checking Kem Dưỡng.xlsx col 3 links...");

function fetchUrl(url) {
  return new Promise((resolve) => {
    try {
      const cleanUrl = url.trim();
      const req = https.get(cleanUrl, { timeout: 4000, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const og = data.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
          resolve({ status: res.statusCode, og: og ? og[1] : null });
        });
      });
      req.on("error", (e) => resolve({ status: 0, error: e.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ status: 0, error: "timeout" });
      });
    } catch (e) {
      resolve({ status: 0, error: e.message });
    }
  });
}

async function testMoistExcel() {
  for (let i = 1; i < Math.min(moistData.length, 10); i++) {
    const row = moistData[i];
    if (row && row[3]) {
      const link = String(row[3]).trim();
      const res = await fetchUrl(link);
      console.log(`[${i}] ${row[0]?.substring(0, 30)} | link: ${link} -> status: ${res.status}, og:image: ${res.og}`);
    }
  }
}

testMoistExcel();
