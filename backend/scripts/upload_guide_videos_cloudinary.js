import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "../.env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const videos = [
  {
    localPath: path.join(__dirname, "../../fontend/public/guide_step_1.mp4"),
    publicId: "guide_step_1",
    name: "Cảnh 1: Không vật cản, không make up"
  },
  {
    localPath: path.join(__dirname, "../../fontend/public/guide_step_2.mp4"),
    publicId: "guide_step_2",
    name: "Cảnh 2: Chụp ảnh ở nơi đủ ánh sáng"
  },
  {
    localPath: path.join(__dirname, "../../fontend/public/guide_step_3.mp4"),
    publicId: "guide_step_3",
    name: "Cảnh 3: Chụp ảnh đúng khoảng cách"
  },
  {
    localPath: path.join(__dirname, "../../fontend/public/guide_full_scan.mp4"),
    publicId: "guide_full_scan",
    name: "Toàn bộ video hướng dẫn gốc"
  }
];

const uploadVideo = (item) => {
  console.log(`⏳ Đang tải lên Cloudinary: ${item.name} (${item.publicId})...`);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      item.localPath,
      {
        resource_type: "video",
        folder: "glowskin/guide-videos",
        public_id: item.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error(`❌ Tải lên ${item.publicId} thất bại:`, error.message);
          reject(error);
        } else {
          console.log(`✅ Thành công! URL: ${result.secure_url}`);
          resolve({
            id: item.publicId,
            name: item.name,
            secureUrl: result.secure_url,
          });
        }
      }
    );
  });
};

async function run() {
  console.log("🚀 Bắt đầu tải video hướng dẫn lên Cloudinary...");
  const results = [];
  for (const v of videos) {
    try {
      const res = await uploadVideo(v);
      results.push(res);
    } catch (err) {
      console.error(`Bỏ qua ${v.publicId} do lỗi:`, err.message);
    }
  }

  console.log("\n================ KẾT QUẢ UPLOAD ================");
  results.forEach((r) => {
    console.log(`- ${r.id}: ${r.secureUrl}`);
  });
  console.log("================================================");
}

run();
