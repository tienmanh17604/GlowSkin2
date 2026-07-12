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

const videos = [
  {
    localName: "5e4d90d4815e8a9dfe57a74765813f7b_720w.mp4",
    publicId: "main_scan_video"
  },
  {
    localName: "1783803007165_2300228154977227320_2246325885179876088.mp4",
    publicId: "float_vid1"
  },
  {
    localName: "caf63fbb6248ef1a8acf59fda2013771.mp4",
    publicId: "float_vid2"
  },
  {
    localName: "38b50784490fcec136862c47568078e5.mp4",
    publicId: "float_vid3"
  }
];

const uploadVideo = (video) => {
  const filePath = path.join(__dirname, "../../fontend/public", video.localName);
  console.log(`⏳ Đang upload ${video.localName} lên Cloudinary với public_id: ${video.publicId}...`);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        resource_type: "video",
        folder: "glowskin/showcase",
        public_id: video.publicId,
        overwrite: true,
        chunk_size: 6000000,
      },
      (error, result) => {
        if (error) {
          console.error(`❌ Upload ${video.localName} thất bại:`, error.message);
          reject(error);
        } else {
          console.log(`✅ Upload thành công! URL: ${result.secure_url}`);
          resolve({ localName: video.localName, secureUrl: result.secure_url });
        }
      }
    );
  });
};

async function main() {
  try {
    const results = [];
    for (const video of videos) {
      const res = await uploadVideo(video);
      results.push(res);
    }
    console.log("\n🎉 Đã upload thành công tất cả video lên Cloudinary!");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("❌ Có lỗi xảy ra trong quá trình upload:", error);
  }
}

main();
