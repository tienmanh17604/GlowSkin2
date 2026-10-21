import https from "https";

https.get(
  "https://shopee.vn/Kem-Ch%E1%BB%91ng-N%E1%BA%AFng-CARYOPHY-50ml-(CARYOPHY-Smart-Tone-up-Sunscreen)-i.219269566.5390179316",
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  },
  (res) => {
    console.log("Shopee status:", res.statusCode);
    let data = "";
    res.on("data", (c) => (data += c));
    res.on("end", () => {
      const og = data.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
      console.log("og:image:", og ? og[1] : "none");
    });
  }
);
