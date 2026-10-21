import https from "https";
import http from "http";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

function checkUrl(url) {
  if (!url) return Promise.resolve({ ok: false, url, status: 0 });
  return new Promise((resolve) => {
    try {
      const client = url.startsWith("https") ? https : http;
      const req = client.request(
        url,
        {
          method: "GET",
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
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400 && isImage, status: res.statusCode, contentType, url });
          res.destroy();
        }
      );
      req.on("error", (e) => resolve({ ok: false, status: 0, error: e.message, url }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ ok: false, status: 0, error: "timeout", url });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 0, error: e.message, url });
    }
  });
}

// Test curated aesthetic skincare URLs
const testList = [
  // White jar / clean aesthetic creams
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556228722-d0b71946804a?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80&auto=format&fit=crop"
];

async function run() {
  const res = await Promise.all(testList.map(checkUrl));
  const valid = res.filter((r) => r.ok);
  const invalid = res.filter((r) => !r.ok);
  console.log(`Tested ${testList.length}: ${valid.length} valid, ${invalid.length} invalid.`);
  valid.forEach((r, idx) => console.log(`[VALID ${idx + 1}] ${r.url}`));
  invalid.forEach((r) => console.log(`[INVALID] ${r.url} -> status: ${r.status}`));
}

run();
