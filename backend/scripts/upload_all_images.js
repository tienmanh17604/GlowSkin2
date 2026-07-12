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

const images = [
  {
    localName: "Thẻ page 2/Phân tích da.jpg",
    publicId: "card_phan_tich_da"
  },
  {
    localName: "Thẻ page 2/Đánh Giá Mỹ Phẩm.jpg",
    publicId: "card_danh_gia_my_pham"
  },
  {
    localName: "Thẻ page 2/Gợi Ý Thông Minh.jpg",
    publicId: "card_goi_y_thong_minh"
  },
  {
    localName: "Thẻ page 2/Lộ Trình SkinCare.jpg",
    publicId: "card_lo_trinh_skincare"
  },
  {
    localName: "Yoga and Facial Exercises for Glowing Skin.jpg",
    publicId: "float_img4"
  },
  {
    localName: "Midjourney_  Close-up of face, dropper with liquid near nose, skincare product_.jpg",
    publicId: "float_img1"
  },
  {
    localName: "IG_ @loverska_officiel.jpg",
    publicId: "float_img2"
  },
  {
    localName: "A simple skincare pack.jpg",
    publicId: "float_img3"
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
        folder: "glowskin/showcase",
        public_id: image.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error(`❌ Upload ${image.localName} thất bại:`, error.message);
          reject(error);
        } else {
          console.log(`✅ Upload thành công! URL: ${result.secure_url}`);
          resolve({ localName: image.localName, secureUrl: result.secure_url });
        }
      }
    );
  });
};

async function main() {
  try {
    const results = [];
    for (const image of images) {
      const res = await uploadImage(image);
      results.push(res);
    }
    console.log("\n🎉 Đã upload thành công tất cả hình ảnh lên Cloudinary!");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("❌ Có lỗi xảy ra trong quá trình upload:", error);
  }
}

main();
