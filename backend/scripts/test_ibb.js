import https from "https";

https.get("https://ibb.co/1GrmGtQn", (res) => {
  console.log("Status:", res.statusCode);
  console.log("Content-Type:", res.headers["content-type"]);
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    const match = data.match(/<meta property="og:image" content="([^"]+)"/);
    console.log("og:image:", match ? match[1] : "not found");
  });
});
