import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import dns from "dns";
import { fileURLToPath } from "url";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, "../data/products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

function checkUrl(url) {
  if (!url) return Promise.resolve({ ok: false, status: 0, reason: "empty" });
  return new Promise((resolve) => {
    try {
      const client = url.startsWith("https") ? https : http;
      const req = client.request(
        url,
        {
          method: "GET", // Some servers like ibb or unsplash reject HEAD
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Range: "bytes=0-1024",
          },
          timeout: 4000,
        },
        (res) => {
          const contentType = res.headers["content-type"] || "";
          const isImage = contentType.startsWith("image/");
          if (res.statusCode >= 200 && res.statusCode < 400 && isImage) {
            resolve({ ok: true, status: res.statusCode, contentType });
          } else {
            resolve({
              ok: false,
              status: res.statusCode,
              contentType,
              reason: !isImage ? "not_an_image" : `status_${res.statusCode}`,
            });
          }
          res.destroy();
        }
      );
      req.on("error", (e) => resolve({ ok: false, status: 0, reason: e.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ ok: false, status: 0, reason: "timeout" });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 0, reason: e.message });
    }
  });
}

async function testCategory(category) {
  const items = products.filter((p) => p.category === category);
  console.log(`\nTesting ${category} (${items.length} items)...`);
  let valid = 0;
  let invalid = 0;
  const badItems = [];

  const BATCH_SIZE = 15;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (p, idx) => {
        const res = await checkUrl(p.image);
        return { p, res, index: i + idx + 1 };
      })
    );

    for (const r of results) {
      if (r.res.ok) {
        valid++;
      } else {
        invalid++;
        badItems.push({
          index: r.index,
          id: r.p.id,
          name: r.p.name,
          image: r.p.image,
          reason: r.res.reason,
          status: r.res.status,
          ct: r.res.contentType,
        });
      }
    }
  }

  console.log(`Result for ${category}: ${valid} valid images, ${invalid} BROKEN/INVALID images.`);
  console.log(`All broken items (${badItems.length}):`);
  badItems.forEach((b) => {
    console.log(`- [#${b.index}] ${b.name.substring(0, 45)}... | URL: ${b.image} | Reason: ${b.reason} (Status: ${b.status})`);
  });
}

async function main() {
  await testCategory("moisturizer");
  await testCategory("sunscreen");
}

main();
