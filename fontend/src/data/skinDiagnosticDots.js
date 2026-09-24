// Hệ thống điểm phân tích da vi thể (Micro-diagnostic Dots) chuẩn Y Khoa & AI Vision
// Chỉ hiển thị các ĐIỂM NỔI BẬT (2-3 điểm/vùng), không làm rối mặt khách.
// MÀU SẮC ĐIỂM CHẤM TỰ ĐỘNG KHỚP 100% VỚI MÀU PHÂN TÍCH VÙNG DA ĐÃ ĐƯỢC AI ĐÁNH GIÁ:
// 🟢 Xanh: Nền da khỏe, thông thoáng, hàng rào lipid ổn định
// 🟡 Vàng: Tăng tiết bã nhờn, sợi bã nhờn, mụn ẩn, bít tắc nang lông
// 🔴 Đỏ: Mụn viêm, mụn mủ, sưng đỏ, tổn thương thâm sau viêm (PIH)

export const DIAGNOSTIC_LEGEND = {
  all: {
    label: "Tất cả điểm nổi bật",
    shortLabel: "Tất cả",
    icon: "🔬",
  },
  green: {
    color: "#00e676",
    glow: "rgba(0, 230, 118, 0.85)",
    label: "Nền da khỏe & Thông thoáng",
    shortLabel: "Da sạch khỏe",
    icon: "🟢",
    description: "Lỗ chân lông thông thoáng, hàng rào lipid vững chắc, cân bằng độ ẩm tối ưu.",
    recommendation: "Duy trì bảo vệ với kem dưỡng ẩm phục hồi HA/Ceramide & kem chống nắng SPF 50+."
  },
  yellow: {
    color: "#ffcc00",
    glow: "rgba(255, 204, 0, 0.9)",
    label: "Tuyến bã nhờn & Bít tắc nang lông",
    shortLabel: "Bã nhờn",
    icon: "🟡",
    description: "Tăng tiết dầu nhờn, sợi bã nhờn rải rác hoặc mụn ẩn sừng hóa cổ nang lông.",
    recommendation: "Làm sạch sâu 2 bước, tẩy tế bào chết hóa học Salicylic Acid (BHA 2%) 2-3 lần/tuần."
  },
  red: {
    color: "#ff3b30",
    glow: "rgba(255, 59, 48, 0.85)",
    label: "Mụn viêm & Tổn thương sưng đỏ",
    shortLabel: "Mụn viêm",
    icon: "🔴",
    description: "Ổ viêm vi khuẩn P.acnes, mụn sưng đỏ hoặc vệt thâm đỏ sau tổn thương mụn cũ.",
    recommendation: "Kháng viêm & làm dịu: Chấm mụn BHA 2%, Azelaic Acid 20%, phục hồi màng bảo vệ da."
  }
};

// CÁC TỌA ĐỘ NEO NỔI BẬT THEO TỪNG VÙNG GIẢI PHẪU KHUÔN MẶT CHUẨN 4:5
const ZONE_ANCHORS = {
  forehead: [
    { subId: "c", relTitle: "Trán giữa", top: 24.0, left: 50.0, size: 9 },
    { subId: "l", relTitle: "Trán trái", top: 26.5, left: 35.0, size: 8 },
    { subId: "r", relTitle: "Trán phải", top: 26.5, left: 65.0, size: 8 },
  ],
  eyebrow: [
    { subId: "l", relTitle: "Đuôi mày & mắt trái", top: 37.0, left: 26.0, size: 8 },
    { subId: "r", relTitle: "Đuôi mày & mắt phải", top: 37.0, left: 74.0, size: 8 },
  ],
  nose: [
    { subId: "bridge", relTitle: "Sống mũi", top: 44.0, left: 50.0, size: 8 },
    { subId: "tip", relTitle: "Đầu mũi & cánh mũi", top: 52.0, left: 50.0, size: 9 },
  ],
  upper_cheek: [
    { subId: "l", relTitle: "Gò má trái", top: 55.0, left: 32.0, size: 9 },
    { subId: "r", relTitle: "Gò má phải", top: 55.0, left: 68.0, size: 9 },
    { subId: "m", relTitle: "Vùng má", top: 63.0, left: 36.0, size: 8 },
  ],
  chin_mouth: [
    { subId: "mt", relTitle: "Vùng quanh môi", top: 67.0, left: 50.0, size: 8 },
    { subId: "c", relTitle: "Cằm giữa", top: 76.5, left: 50.0, size: 9 },
    { subId: "l", relTitle: "Cằm trái", top: 74.0, left: 42.0, size: 8.5 },
    { subId: "r", relTitle: "Cằm phải", top: 74.0, left: 58.0, size: 8.5 },
  ],
  chin: [
    { subId: "c", relTitle: "Cằm giữa", top: 76.5, left: 50.0, size: 9 },
    { subId: "l", relTitle: "Cằm trái", top: 74.0, left: 42.0, size: 8.5 },
    { subId: "r", relTitle: "Cằm phải", top: 74.0, left: 58.0, size: 8.5 },
    { subId: "b", relTitle: "Đáy cằm", top: 81.0, left: 50.0, size: 8.5 },
  ],
  mouth: [
    { subId: "mt", relTitle: "Vùng quanh môi", top: 67.0, left: 50.0, size: 8 },
  ],
  jaw: [
    { subId: "l", relTitle: "Góc hàm trái", top: 76.0, left: 26.0, size: 8 },
    { subId: "r", relTitle: "Góc hàm phải", top: 76.0, left: 74.0, size: 8 },
  ]
};

function resolveZoneKey(zone) {
  const str = `${zone?.id || ""} ${zone?.title || ""}`.toLowerCase();
  if (str.includes("trán") || str.includes("forehead") || str.includes("tran")) return "forehead";
  if (str.includes("mày") || str.includes("mắt") || str.includes("eyebrow") || str.includes("eye") || str.includes("mat") || str.includes("long_may")) return "eyebrow";
  if (str.includes("mũi") || str.includes("nose") || str.includes("mui")) return "nose";
  if (str.includes("má") || str.includes("cheek") || str.includes("ma")) return "upper_cheek";
  if ((str.includes("môi") || str.includes("mouth") || str.includes("moi")) && (str.includes("cằm") || str.includes("chin") || str.includes("cam"))) return "chin_mouth";
  if (str.includes("cằm") || str.includes("chin") || str.includes("cam")) return "chin";
  if (str.includes("môi") || str.includes("mouth") || str.includes("moi")) return "mouth";
  if (str.includes("hàm") || str.includes("jaw") || str.includes("ham")) return "jaw";
  return null;
}

/**
 * TẠO TẬP HỢP CÁC ĐIỂM NỔI BẬT DỰA THEO KẾT QUẢ PHÂN TÍCH TỪNG VÙNG CỦA AI:
 * - Màu của từng điểm (type: "green" | "yellow" | "red") KHỚP 100% với status của vùng đó!
 * - Số lượng điểm được tinh chỉnh gọn gàng (chỉ 10-14 điểm nổi bật cho toàn khuôn mặt).
 */
export function generateDotsForZones(zones = []) {
  if (!zones || !zones.length) return [];

  const dots = [];
  const usedKeys = new Set();

  zones.forEach((zone, idx) => {
    let zoneKey = resolveZoneKey(zone);
    if (!zoneKey || usedKeys.has(zoneKey)) {
      // Nếu không khớp từ khóa thì dùng fallback theo thứ tự
      const fallbackKeys = ["forehead", "eyebrow", "nose", "upper_cheek", "chin_mouth", "jaw"];
      zoneKey = fallbackKeys[idx % fallbackKeys.length];
    }
    usedKeys.add(zoneKey);

    const anchors = ZONE_ANCHORS[zoneKey] || ZONE_ANCHORS.upper_cheek;
    // MÀU SẮC ĐỒNG BỘ TUYỆT ĐỐI VỚI VÙNG ĐÃ PHÂN TÍCH
    const status = (zone.status || "green").toLowerCase();
    const dotType = status === "red" ? "red" : status === "yellow" ? "yellow" : "green";

    anchors.forEach((anchor, aIdx) => {
      let titleLabel = "";
      if (dotType === "green") {
        titleLabel = `${zone.title || "Vùng da"} (${anchor.relTitle}) — Nền da khỏe`;
      } else if (dotType === "yellow") {
        titleLabel = `${zone.title || "Vùng da"} (${anchor.relTitle}) — Tuyến bã nhờn & bít tắc`;
      } else {
        titleLabel = `${zone.title || "Vùng da"} (${anchor.relTitle}) — Mụn sưng viêm`;
      }

      dots.push({
        id: `dot_${zone.id || zoneKey}_${anchor.subId}`,
        zoneId: zone.id,
        zoneTitle: zone.title || anchor.relTitle,
        top: anchor.top,
        left: anchor.left,
        type: dotType, // "green", "yellow", or "red"
        title: titleLabel,
        detail: zone.condition || (dotType === "green" ? "Nền da căng mịn, thông thoáng, hàng rào lipid ổn định." : dotType === "yellow" ? "Tăng tiết bã nhờn, lỗ chân lông bít tắc nhẹ." : "Phát hiện mụn sưng viêm đỏ, cần kháng khuẩn."),
        size: anchor.size || 8,
        pulseDelay: Number(((idx * 0.3 + aIdx * 0.2) % 1.5).toFixed(1))
      });
    });
  });

  return dots;
}
