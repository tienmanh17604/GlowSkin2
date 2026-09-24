// faceZoneCropper.js - Trích xuất ảnh cận cảnh từng vùng da mặt (Trán, Mũi, Má, Cằm, Mắt/Mày)
// Tự động cắt ảnh từ chân dung khách hàng để hiển thị trực quan cạnh chẩn đoán Y khoa

const cropCache = new Map();

/**
 * Xác định loại vùng giải phẫu từ thông tin zone
 */
export function resolveZoneKey(zone) {
  const str = `${zone?.id || ""} ${zone?.title || ""}`.toLowerCase();
  if (str.includes("trán") || str.includes("forehead") || str.includes("tran")) return "forehead";
  if (str.includes("mũi") || str.includes("nose") || str.includes("mui")) return "nose";
  if (str.includes("má") || str.includes("cheek") || str.includes("ma")) return "cheek";
  if (str.includes("cằm") || str.includes("chin") || str.includes("cam")) return "chin";
  if (str.includes("mày") || str.includes("mắt") || str.includes("eyebrow") || str.includes("eye") || str.includes("long_may")) return "eyebrow";
  if (str.includes("môi") || str.includes("mouth") || str.includes("moi")) return "chin";
  if (str.includes("hàm") || str.includes("jaw") || str.includes("ham")) return "chin";
  return "forehead";
}

/**
 * Tỉ lệ tọa độ cắt vùng trên chân dung khuôn mặt chuẩn 4:5
 * Căn cứ theo khuôn mặt bầu dục Face ID
 */
const ZONE_CROP_BOUNDS = {
  forehead: [
    {
      label: "Vùng Trán",
      subLabel: "Cận cảnh da trán & nếp nhăn vi thể",
      x: 0.24,
      y: 0.12,
      w: 0.52,
      h: 0.24
    }
  ],
  nose: [
    {
      label: "Vùng Mũi",
      subLabel: "Sống mũi, đầu mũi & lỗ chân lông",
      x: 0.34,
      y: 0.38,
      w: 0.32,
      h: 0.24
    }
  ],
  cheek: [
    {
      label: "Vùng Má Trái",
      subLabel: "Gò má trái & thâm sau mụn",
      x: 0.16,
      y: 0.46,
      w: 0.28,
      h: 0.23
    },
    {
      label: "Vùng Má Phải",
      subLabel: "Gò má phải & lỗ chân lông",
      x: 0.56,
      y: 0.46,
      w: 0.28,
      h: 0.23
    }
  ],
  chin: [
    {
      label: "Vùng Cằm",
      subLabel: "Cận cảnh cằm & ổ mụn viêm sưng",
      x: 0.28,
      y: 0.66,
      w: 0.44,
      h: 0.23
    }
  ],
  eyebrow: [
    {
      label: "Vùng Mắt & Lông Mày",
      subLabel: "Đuôi mắt, quầng thâm & chân mày",
      x: 0.18,
      y: 0.28,
      w: 0.64,
      h: 0.19
    }
  ]
};

/**
 * Trích xuất ảnh cắt từng vùng khuôn mặt từ ảnh gốc của khách hàng
 * @param {string} imageSrc - Data URL hoặc URL ảnh khuôn mặt
 * @param {object|string} zoneOrKey - Đối tượng zone hoặc key vùng
 * @returns {Promise<Array<{ label: string, subLabel: string, url: string }>>}
 */
export async function cropFaceZones(imageSrc, zoneOrKey) {
  if (!imageSrc) return [];

  const zoneKey = typeof zoneOrKey === "string" ? zoneOrKey : resolveZoneKey(zoneOrKey);
  const cacheKey = `${imageSrc.slice(-50)}_${zoneKey}`;

  if (cropCache.has(cacheKey)) {
    return cropCache.get(cacheKey);
  }

  const bounds = ZONE_CROP_BOUNDS[zoneKey] || ZONE_CROP_BOUNDS.forehead;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        const results = bounds.map((b) => {
          const sx = Math.max(0, Math.floor(b.x * naturalW));
          const sy = Math.max(0, Math.floor(b.y * naturalH));
          const sw = Math.min(naturalW - sx, Math.floor(b.w * naturalW));
          const sh = Math.min(naturalH - sy, Math.floor(b.h * naturalH));

          const canvas = document.createElement("canvas");
          // Kích thước xuất bản chất lượng cao sắc nét
          const outW = 480;
          const outH = Math.round((outW * sh) / sw);
          canvas.width = outW;
          canvas.height = outH;

          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

          const url = canvas.toDataURL("image/jpeg", 0.95);
          return {
            label: b.label,
            subLabel: b.subLabel,
            url
          };
        });

        cropCache.set(cacheKey, results);
        resolve(results);
      } catch (err) {
        console.warn("Lỗi khi cắt ảnh vùng da:", err);
        resolve([{ label: "Khuôn mặt", subLabel: "Ảnh tổng thể", url: imageSrc }]);
      }
    };

    img.onerror = () => {
      // Fallback nếu ảnh không tải được với CORS
      resolve([{ label: "Khuôn mặt", subLabel: "Ảnh tổng thể", url: imageSrc }]);
    };

    img.src = imageSrc;
  });
}
