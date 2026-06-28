import { PRODUCTS, SKIN_TYPES, CONCERNS, CATEGORIES } from "../data/products";

const SKIN_KEYWORDS = {
  oily: ["da dầu", "dầu", "oily", "nhờn", "bóng dầu"],
  dry: ["da khô", "khô", "dry", "bong tróc", " căng "],
  combination: ["hỗn hợp", "hon hop", "combination", "chữ t"],
  sensitive: ["nhạy cảm", "sensitive", "dễ kích ứng", "đỏ", "viêm"],
  normal: ["bình thường", "normal", "cân bằng"],
};

const CONCERN_KEYWORDS = {
  acne: ["mụn", "acne", "viêm", "đốm đỏ"],
  dark_spots: ["thâm", "sạm", "nám", "vết thâm", "dark spot", "hyperpigmentation"],
  pores: ["lỗ chân lông", "pore", "sợi dầu"],
  dehydration: ["thiếu ẩm", "mất nước", "dehydrat", "khô", "cấp ẩm"],
  aging: ["nếp nhăn", "wrinkle", "lão hóa", "chảy xệ"],
  dullness: ["xỉn màu", "dull", "thiếu sáng", "mệt mỏi"],
};

function detectFromText(text, keywordMap) {
  const lower = text.toLowerCase();
  return Object.entries(keywordMap)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([key]) => key);
}

function getSectionText(text, sectionNum, nextSectionNum) {
  if (!text) return "";
  // Find the current section index, e.g. "1." or "**1."
  const startRegex = new RegExp(`(?:^|\\n)(?:\\*\\*)?${sectionNum}\\.\\s*`, "i");
  const startIndex = text.search(startRegex);
  if (startIndex === -1) return "";

  // The rest of the text starting from that section heading
  const restText = text.substring(startIndex);
  
  // Find where the next section starts, e.g. "2." or "**2."
  const endRegex = new RegExp(`(?:^|\\n)(?:\\*\\*)?${nextSectionNum}\\.\\s*`, "i");
  // Search in restText, but offset to avoid matching the starting header itself
  const headerOffset = restText.search(/\.\s*/i) + 1; // move past the dot
  const nextMatch = restText.substring(headerOffset).match(endRegex);

  if (nextMatch) {
    // If next section found, return everything up to its starting index (relative to restText)
    const relativeEndIndex = restText.substring(headerOffset).search(endRegex) + headerOffset;
    return restText.substring(0, relativeEndIndex);
  }
  return restText;
}

export function extractSkinProfile(analysisText) {
  // Extract Section 1 (Loại da) and Section 2 (Tình trạng da) for precise keyword matching
  let skinTypeText = getSectionText(analysisText, 1, 2);
  let concernText = getSectionText(analysisText, 2, 3);

  // Fallback to the whole text if sections are not detected in the expected format
  if (!skinTypeText) skinTypeText = analysisText;
  if (!concernText) concernText = analysisText;

  const skinTypes = detectFromText(skinTypeText, SKIN_KEYWORDS);
  const concerns = detectFromText(concernText, CONCERN_KEYWORDS);

  if (skinTypes.length === 0) skinTypes.push("combination");
  if (concerns.length === 0) concerns.push("dehydration");

  return {
    skinTypes: [...new Set(skinTypes)],
    concerns: [...new Set(concerns)],
  };
}

function scoreProduct(product, profile) {
  let score = 0;
  const reasons = [];

  for (const type of profile.skinTypes) {
    if (product.skinTypes.includes(type)) {
      score += 3;
      reasons.push(`Phù hợp ${SKIN_TYPES[type]?.label || type}`);
    }
  }

  for (const concern of profile.concerns) {
    if (product.concerns.includes(concern)) {
      score += 2;
      reasons.push(`Hỗ trợ ${CONCERNS[concern]?.label || concern}`);
    }
  }

  score += product.rating * 0.5;

  const uniqueReasons = [...new Set(reasons)].slice(0, 2);

  return { score, reasons: uniqueReasons };
}

export function getRecommendedProducts(analysisText, limit = 6) {
  const profile = extractSkinProfile(analysisText);

  const scored = PRODUCTS.map((product) => {
    const { score, reasons } = scoreProduct(product, profile);
    return { ...product, matchScore: score, matchReasons: reasons };
  })
    .filter((p) => p.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  const picked = [];
  const usedCategories = new Set();

  for (const product of scored) {
    if (picked.length >= limit) break;
    if (!usedCategories.has(product.category) || picked.length >= limit - 2) {
      picked.push(product);
      usedCategories.add(product.category);
    }
  }

  if (picked.length < limit) {
    for (const product of scored) {
      if (picked.length >= limit) break;
      if (!picked.find((p) => p.id === product.id)) {
        picked.push(product);
      }
    }
  }

  return {
    profile,
    products: picked.slice(0, limit),
  };
}

export function filterProducts({ skinType, category, concern }) {
  return PRODUCTS.filter((product) => {
    if (skinType && !product.skinTypes.includes(skinType)) return false;
    if (category && product.category !== category) return false;
    if (concern && !product.concerns.includes(concern)) return false;
    return true;
  });
}

export { SKIN_TYPES, CONCERNS, CATEGORIES };
