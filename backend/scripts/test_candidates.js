import https from "https";

// Test a curated set of reliable Unsplash and cosmetic image URLs
const candidateUrls = [
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1567928815104-b63004bb9d79?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512290900672-1f55b9e07d08?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556228722-d0b71946804a?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&auto=format&fit=crop"
];

function check(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode === 200 });
      res.destroy();
    }).on("error", () => resolve({ url, status: 0, ok: false }));
  });
}

Promise.all(candidateUrls.map(check)).then((results) => {
  results.forEach((r, idx) => {
    console.log(`[${idx}] ${r.ok ? "✅ 200 OK" : "❌ " + r.status} -> ${r.url.split("?")[0]}`);
  });
});
