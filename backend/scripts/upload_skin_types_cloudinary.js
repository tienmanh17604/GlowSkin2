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

const skinImages = [
  {
    localName: "images/skin-types/dry.png",
    publicId: "skin_dry"
  },
  {
    localName: "images/skin-types/oily.png",
    publicId: "skin_oily"
  },
  {
    localName: "images/skin-types/combo_tzone.png",
    publicId: "skin_combo_tzone"
  },
  {
    localName: "images/skin-types/combo_cheeks.png",
    publicId: "skin_combo_cheeks"
  },
  {
    localName: "images/skin-types/model_base.jpg",
    publicId: "skin_model_base"
  }
];

const uploadImage = (image) => {
  const filePath = path.join(__dirname, "../../fontend/public", image.localName);
  console.log(`⏳ Đang upload ${image.localName} lên Cloudinary với public_id: ${image.publicId}...`);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        resource_type: "image",
        folder: "glowskin/skin-types",
        public_id: image.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error(`❌ Upload ${image.localName} thất bại:`, error.message);
          reject(error);
        } else {
          console.log(`✅ Upload thành công! URL: ${result.secure_url}`);
          resolve({ id: image.publicId, localName: image.localName, secureUrl: result.secure_url });
        }
      }
    );
  });
};

async function main() {
  try {
    const results = [];
    for (const image of skinImages) {
      const res = await uploadImage(image);
      results.push(res);
    }
    console.log("\n🎉 Đã upload thành công tất cả hình ảnh skin types lên Cloudinary!");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("❌ Có lỗi xảy ra trong quá trình upload:", error);
    process.exit(1);
  }
}

main();
