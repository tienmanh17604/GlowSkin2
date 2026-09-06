const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SYSTEM_PROMPT = `Bạn là chuyên gia skincare AI của GlowSkin. Nhiệm vụ: phân tích da mặt từ ảnh người dùng gửi và tư vấn dựa trên Hướng dẫn Chẩn đoán & Điều trị các bệnh Da liễu của Bộ Y Tế (Quyết định 4416/QĐ-BYT).

Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
Bạn PHẢI trình bày kết quả phân tích theo đúng cấu trúc và sử dụng các thẻ phân chia chính xác như sau:

===OVERVIEW===
## Kết quả phân tích da mặt ✨
1. **Loại da** (dầu/khô/hỗn hợp/nhạy cảm/bình thường)
2. **Tình trạng da** (mụn, thâm, lỗ chân lông, nếp nhăn, mất nước...) CĂN CỨ VÀO QUYẾT ĐỊNH 4416/QĐ-BYT BỘ Y TẾ.
3. **Điểm mạnh** của làn da

===ROUTINE===
4. **Routine gợi ý** (sáng/tối, từng bước cụ thể)

===INGREDIENTS===
5. **Thành phần nên dùng** và nên tránh

===WARNING===
6. **Thành phần dễ gây kích ứng** đối với làn da này (nếu có) và lý do tại sao nên tránh

===JSON_DATA===
{
  "score": 75,
  "scoreLabel": "Phân tích Y Khoa & AI Vision",
  "medicalReference": "Quyết định 4416/QĐ-BYT Bộ Y Tế",
  "summary": [
    { "title": "Phân tích AI Vision", "en": "(AI Vision Diagnosis)", "desc": "Nhận diện tình trạng thực tế từ ảnh người dùng." }
  ],
  "zones": [
    { "id": "forehead", "title": "Vùng Trán", "condition": "Chẩn đoán cụ thể từ ảnh...", "detail": "Mô tả chi tiết từ ảnh..." },
    { "id": "eyebrow", "title": "Vùng Lông Mày", "condition": "Chẩn đoán cụ thể...", "detail": "Mô tả chi tiết..." },
    { "id": "upper_cheek", "title": "Vùng Má", "condition": "Chẩn đoán cụ thể...", "detail": "Mô tả chi tiết..." },
    { "id": "chin", "title": "Vùng Cằm", "condition": "Chẩn đoán cụ thể...", "detail": "Mô tả chi tiết..." },
    { "id": "mouth", "title": "Vùng Môi", "condition": "Chẩn đoán cụ thể...", "detail": "Mô tả chi tiết..." },
    { "id": "jaw", "title": "Vùng Hàm", "condition": "Chẩn đoán cụ thể...", "detail": "Mô tả chi tiết..." }
  ]
}

Chú ý: Giữ nguyên các thẻ ===OVERVIEW===, ===ROUTINE===, ===INGREDIENTS===, ===WARNING===, và ===JSON_DATA=== viết hoa chính xác. Thẻ ===JSON_DATA=== phải chứa duy nhất 1 chuỗi JSON hợp lệ.`;

const DEMO_ANALYSIS = `===OVERVIEW===
## Kết quả phân tích da mặt ✨

**1. Loại da:** Da hỗn hợp thiên dầu — vùng chữ T tăng tiết bã nhờn, hai bên má nhẹ dịu.

**2. Tình trạng da (Căn cứ Quyết định 4416/QĐ-BYT Bộ Y Tế):**
- **Trán & Mũi:** Lỗ chân lông bít tắc, có mụn đầu đen và mụn viêm rải rác.
- **Má & Cằm:** Dấu hiệu thâm sau viêm (PIH) nhẹ và thiếu ẩm bề mặt.

**3. Điểm mạnh:** Da có khả năng phục hồi tốt, cấu trúc elastin đồng đều.

===ROUTINE===
**Routine gợi ý (Chuẩn Hướng dẫn Bộ Y Tế 4416/QĐ-BYT):**
- *Sáng:* Sữa rửa mặt dịu nhẹ → Toner cân bằng → Serum Vitamin C / Niacinamide → Kem dưỡng ẩm → Kem chống nắng SPF 50
- *Tối:* Tẩy trang → Sữa rửa mặt → Toner → Serum BHA / Azelaic Acid (3x/tuần) → Kem dưỡng phục hồi

===INGREDIENTS===
**Thành phần nên dùng:** Niacinamide, Salicylic Acid (BHA), Azelaic Acid, Hyaluronic Acid, Ceramide

**Nên tránh:** Cồn khô nồng độ cao, hương liệu nhân tạo mạnh

===WARNING===
**Các thành phần dễ gây kích ứng với làn da của bạn:**
- **Cồn khô (Alcohol Denat / Ethanol):** Dễ làm mất đi lớp màng bảo vệ tự nhiên, khiến da khô rát.
- **Hương liệu nhân tạo (Fragrance):** Có thể làm tăng nguy cơ kích ứng cho các nốt mụn sẵn có.
- **Dầu khoáng (Mineral Oil):** Rất dễ gây bít tắc thêm vùng lỗ chân lông to ở cánh mũi và trán.

===JSON_DATA===
{
  "score": 72,
  "scoreLabel": "Phân tích Y Khoa & AI Vision",
  "medicalReference": "Quyết định 4416/QĐ-BYT Bộ Y Tế",
  "summary": [
    { "title": "Bít tắc lỗ chân lông", "en": "(Enlarged Pores)", "desc": "Tập trung vùng chữ T (Trán & Mũi)" },
    { "title": "Mụn viêm rải rác", "en": "(Inflammatory Acne)", "desc": "Căn cứ bài Trứng cá QĐ 4416/QĐ-BYT" },
    { "title": "Thâm mụn sau viêm", "en": "(Post-inflammatory Hyperpigmentation)", "desc": "Cần sử dụng Niacinamide / Vitamin C" }
  ],
  "zones": [
    { "id": "forehead", "title": "Vùng Trán", "condition": "Mụn viêm & Thâm dai dẳng", "detail": "Có mụn sưng đỏ rải rác và lỗ chân lông bít tắc theo hướng dẫn QĐ 4416.", "angle": -90 },
    { "id": "eyebrow", "title": "Vùng Lông Mày", "condition": "Da bình thường, ít tổn thương", "detail": "Bề mặt da mịn màng, không có mụn ẩn hay viêm.", "angle": -30 },
    { "id": "upper_cheek", "title": "Vùng Má", "condition": "Vết thâm mụn nhẹ & Thiếu ẩm", "detail": "Xuất hiện vảy sừng nhẹ và vết thâm mờ sau viêm.", "angle": 30 },
    { "id": "chin", "title": "Vùng Cằm", "condition": "Mụn đầu đen & Mụn ẩn", "detail": "Nhiều sợi bã nhờn và mụn ẩn dưới da.", "angle": 90 },
    { "id": "mouth", "title": "Vùng Môi", "condition": "Khô nhẹ xung quanh", "detail": "Cần cấp ẩm và dùng son dưỡng chống nắng.", "angle": 150 },
    { "id": "jaw", "title": "Vùng Hàm", "condition": "Bình thường - Cần duy trì làm sạch", "detail": "Nền da ổn định, không phát hiện ổ viêm lớn.", "angle": 210 }
  ]
}
`;

function hasApiKey() {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}

async function fetchMedicalContext(query = "mụn trứng cá thâm nám lão hóa") {
  try {
    const queries = ["mụn trứng cá viêm mủ ẩn", "sắc tố thâm mụn nám tàn nhang", "lão hóa nếp nhăn căng bóng"];
    if (query && !queries.includes(query)) {
      queries.unshift(query);
    }

    const fetchedItems = [];
    for (const q of queries.slice(0, 3)) {
      const res = await fetch(`${API_URL}/medical/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length) {
          fetchedItems.push(...data.results);
        }
      }
    }

    // Deduplicate by ID or title
    const uniqueMap = new Map();
    for (const item of fetchedItems) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }

    const uniqueResults = Array.from(uniqueMap.values()).slice(0, 5);
    if (uniqueResults.length) {
      return uniqueResults.map(r => `--- [Nguồn: ${r.source || 'Bộ Y Tế / DATA AI'}] ${r.title} ---\n${r.content}`).join("\n\n");
    }
  } catch (err) {
    console.warn("Không thể tải tài liệu Y tế từ backend:", err);
  }
  return "";
}

async function callOpenAI(messages) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      max_tokens: 4096,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API lỗi (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function buildVisionMessages(chatHistory, imageDataUrl, medicalContext = "") {
  let promptText = SYSTEM_PROMPT;
  if (medicalContext) {
    promptText += `\n\nDƯỚI ĐÂY LÀ HƯỚNG DẪN CHẨN ĐOÁN VÀ ĐIỀU TRỊ CHUẨN CỦA BỘ Y TẾ (QUYẾT ĐỊNH 4416/QĐ-BYT):\n${medicalContext}\n\nHãy căn cứ vào hướng dẫn Y khoa trên để đưa ra chẩn đoán và lời khuyên chuẩn xác nhất.`;
  }

  const apiMessages = [{ role: "system", content: promptText }];

  for (const msg of chatHistory) {
    if (msg.role === "user") {
      if (msg.image) {
        apiMessages.push({
          role: "user",
          content: [
            { type: "text", text: msg.content || "Phân tích da mặt giúp tôi." },
            { type: "image_url", image_url: { url: msg.image } },
          ],
        });
      } else {
        apiMessages.push({ role: "user", content: msg.content });
      }
    } else if (msg.role === "assistant") {
      apiMessages.push({ role: "assistant", content: msg.content });
    }
  }

  if (imageDataUrl && !chatHistory.some((m) => m.image === imageDataUrl)) {
    apiMessages.push({
      role: "user",
      content: [
        { type: "text", text: "Phân tích da mặt giúp tôi." },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    });
  }

  return apiMessages;
}

export async function analyzeSkinImage(imageDataUrl) {
  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 1800));
    return { content: DEMO_ANALYSIS, isDemo: true };
  }

  const medicalContext = await fetchMedicalContext("mụn trứng cá viêm da");
  const messages = buildVisionMessages([], imageDataUrl, medicalContext);
  const content = await callOpenAI(messages);
  return { content, isDemo: false };
}

export async function sendFollowUp(chatHistory) {
  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 1200));
    return {
      content:
        "Cảm ơn bạn đã hỏi thêm! Ở chế độ demo, tôi chưa thể trả lời chi tiết. Hãy thêm **VITE_GEMINI_API_KEY** vào file `.env` và khởi động lại server để chat AI hoạt động đầy đủ.",
      isDemo: true,
    };
  }

  const lastUserMsg = [...chatHistory].reverse().find(m => m.role === "user")?.content || "";
  const medicalContext = await fetchMedicalContext(lastUserMsg);
  const messages = buildVisionMessages(chatHistory, null, medicalContext);
  const content = await callOpenAI(messages);
  return { content, isDemo: false };
}

export function isUsingDemoMode() {
  return !hasApiKey();
}

