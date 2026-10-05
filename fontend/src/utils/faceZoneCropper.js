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
      x: 0.22,
      y: 0.14,
      w: 0.56,
      h: 0.22
    }
  ],
  nose: [
    {
      label: "Vùng Mũi",
      subLabel: "Sống mũi, đầu mũi & lỗ chân lông",
      x: 0.34,
      y: 0.36,
      w: 0.32,
      h: 0.22
    }
  ],
  cheek: [
    {
      label: "Vùng Má Trái",
      subLabel: "Gò má trái & thâm sau mụn",
      x: 0.14,
      y: 0.40,
      w: 0.30,
      h: 0.24
    },
    {
      label: "Vùng Má Phải",
      subLabel: "Gò má phải & lỗ chân lông",
      x: 0.56,
      y: 0.40,
      w: 0.30,
      h: 0.24
    }
  ],
  chin: [
    {
      label: "Vùng Cằm",
      subLabel: "Cận cảnh cằm & dưới môi",
      x: 0.32,
      y: 0.60,
      w: 0.36,
      h: 0.17
    }
  ],
  eyebrow: [
    {
      label: "Vùng Mắt & Lông Mày",
      subLabel: "Đuôi mắt, quầng thâm & chân mày",
      x: 0.18,
      y: 0.26,
      w: 0.64,
      h: 0.18
    }
  ]
};

/**
 * Cắt ảnh cận cảnh chuẩn xác quanh từng điểm tổn thương cụ thể (top %, left %)
 * Đảm bảo lấy đúng vị trí mụn viêm / vết thâm thực tế của người dùng
 */
export async function cropPoints(imageSrc, points = [], defaultLabel = "Điểm tổn thương") {
  if (!imageSrc || !points || !points.length) return [];

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const boxSize = Math.max(120, Math.round(naturalW * 0.24));

        const results = points.map((p, idx) => {
          const cx = ((p.left || 50) / 100) * naturalW;
          const cy = ((p.top || 50) / 100) * naturalH;

          const sx = Math.max(0, Math.min(naturalW - boxSize, Math.round(cx - boxSize / 2)));
          const sy = Math.max(0, Math.min(naturalH - boxSize, Math.round(cy - boxSize / 2)));
          const sw = Math.min(naturalW - sx, boxSize);
          const sh = Math.min(naturalH - sy, boxSize);

          const canvas = document.createElement("canvas");
          const outSize = 480;
          canvas.width = outSize;
          canvas.height = outSize;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outSize, outSize);

          // Nhận diện tên vùng theo tọa độ điểm
          let locName = defaultLabel;
          const topPct = p.top || 50;
          const leftPct = p.left || 50;
          if (topPct < 34) locName = "Vùng Trán";
          else if (topPct > 58 && topPct < 78) locName = "Vùng Cằm";
          else if (leftPct < 40) locName = "Vùng Má Trái";
          else if (leftPct > 60) locName = "Vùng Má Phải";
          else if (topPct >= 34 && topPct <= 58) locName = "Vùng Mũi & Trung tâm";

          return {
            label: `${locName}`,
            subLabel: `Nốt tổn thương #${idx + 1}`,
            url: canvas.toDataURL("image/jpeg", 0.95)
          };
        });

        resolve(results);
      } catch (err) {
        console.warn("Lỗi khi cắt ảnh điểm tổn thương:", err);
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = imageSrc;
  });
}

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
