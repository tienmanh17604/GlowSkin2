import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const videoPath = path.join(__dirname, "../../fontend/public/skincare_video.mp4");

console.log("⏳ Đang upload video lên Cloudinary...");
console.log("📁 File:", videoPath);

cloudinary.uploader.upload(
  videoPath,
  {
    resource_type: "video",
    folder: "glowskin/hero",
    public_id: "skincare_hero_video",
    overwrite: true,
    chunk_size: 6000000, // upload theo từng chunk 6MB
  },
  (error, result) => {
    if (error) {
      console.error("❌ Upload thất bại:", error.message);
      process.exit(1);
    }
    console.log("\n✅ Upload thành công!");
    console.log("🔗 URL:", result.secure_url);
    console.log("📌 Public ID:", result.public_id);
    console.log("\n👉 Copy URL này vào Home.jsx:\n");
    console.log(`src="${result.secure_url}"`);
  }
);
