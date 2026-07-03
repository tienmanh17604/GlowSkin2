const img = (id, w = 400) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

export const SKIN_TYPES = {
  oily: { label: "Da dầu", emoji: "💧" },
  dry: { label: "Da khô", emoji: "🌵" },
  combination: { label: "Da hỗn hợp", emoji: "⚖️" },
  sensitive: { label: "Da nhạy cảm", emoji: "🌸" },
  normal: { label: "Da bình thường", emoji: "✨" },
};

export const CONCERNS = {
  acne: { label: "Mụn", emoji: "🔴" },
  dark_spots: { label: "Thâm sạm", emoji: "🟤" },
  pores: { label: "Lỗ chân lông", emoji: "🔍" },
  dehydration: { label: "Thiếu ẩm", emoji: "💦" },
  aging: { label: "Lão hóa", emoji: "⏳" },
  dullness: { label: "Da xỉn màu", emoji: "🌫️" },
};

export const CATEGORIES = {
  cleanser: "Sữa rửa mặt",
  toner: "Toner",
  serum: "Serum",
  moisturizer: "Kem dưỡng",
  sunscreen: "Kem chống nắng",
  treatment: "Điều trị",
};

export function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
