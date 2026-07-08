import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage cho ảnh sản phẩm
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "glowskin/products/images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  },
});

// Storage cho video sản phẩm
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "glowskin/products/videos",
    allowed_formats: ["mp4", "mov", "avi", "webm"],
    resource_type: "video",
  },
});

// Middleware upload
export const uploadImage = multer({ storage: imageStorage });
export const uploadVideo = multer({ storage: videoStorage });

// Hàm xóa file trên Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Lỗi khi xóa file trên Cloudinary:", error);
    throw error;
  }
};

export default cloudinary;
