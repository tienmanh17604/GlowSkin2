import https from "https";

https.get(
  "https://shopee.vn/api/v4/item/get?itemid=5390179316&shopid=219269566",
  {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "x-api-source": "pc",
    },
  },
  (res) => {
    console.log("Shopee API status:", res.statusCode);
    let data = "";
    res.on("data", (c) => (data += c));
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        console.log("Data keys:", Object.keys(json));
        if (json.data) {
          console.log("image id:", json.data.image);
          console.log("images:", json.data.images);
        } else {
          console.log("Error or anti-crawl:", json.error || data.substring(0, 150));
        }
      } catch (e) {
        console.log("Parse error:", data.substring(0, 150));
      }
    });
  }
);
