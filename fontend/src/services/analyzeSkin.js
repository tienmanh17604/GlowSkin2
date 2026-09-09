const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SYSTEM_PROMPT = `Bạn là Bác sĩ Chuyên gia Da liễu AI của GlowSkin. Nhiệm vụ: Phân tích chi tiết từng góc da mặt từ ảnh người dùng gửi và đưa ra chẩn đoán Y khoa chuẩn xác dựa trên 360 Hướng dẫn Y Khoa & Quyết định 4416/QĐ-BYT Bộ Y Tế.

QUY TẮC PHÂN TÍCH Y KHOA VÀ NHẬN DIỆN KHUÔN MẶT QUAN TRỌNG:

1. NHẬN DIỆN GÓC CHỤP & VÙNG KHUÔN MẶT CÓ TRONG ẢNH (NGUYÊN TẮC BẮT BUỘC):
   - Hãy quan sát thật kỹ bức ảnh người dùng tải lên.
   - NẾU ẢNH BỊ CẮT XÉN (ví dụ chỉ thấy nửa trên khuôn mặt: Trán, Lông mày, Mắt, Má mà KHÔNG THẤY Môi, Cằm hay Hàm), bạn CHỈ ĐƯỢC TRẢ VỀ CÁC VÙNG CÓ TRONG ẢNH trong mảng "zones".
   - TUYỆT ĐỐI KHÔNG ĐƯỢC BỊA ĐẶT HOẶC TRẢ VỀ VÙNG MÔI, VÙNG CẰM, VÙNG HÀM NẾU TRONG ẢNH KHÔNG CÓ NHỮNG VÙNG NÀY.

2. NỘI DUNG CHẨN ĐOÁN CHI TIẾT CHUẨN Y KHOA (KHÔNG VIẾT CHUNG CHUNG):
   - Với mỗi vùng xuất hiện trong ảnh, hãy viết chẩn đoán Y khoa cụ thể, nêu rõ đặc điểm tổn thương quan sát được (ví dụ: "Sẩn đỏ vi mụn 1-2mm rải rác, bít tắc tuyến bã nhờn", "Dấu hiệu thâm sau viêm PIH kèm tăng sắc tố mờ", "Bề mặt da thiếu ẩm gây vảy sừng nhẹ").
   - Căn cứ trực tiếp vào các điều khoản Hướng dẫn Da liễu Bộ Y Tế (QĐ 4416/QĐ-BYT) và tư vấn hoạt chất điều trị chuẩn y khoa (Niacinamide, BHA, Azelaic Acid, Tretinoin, Vitamin C, Ceramide...).

===OVERVIEW===
## Báo cáo Phân tích Da Y Khoa ✨
1. **Loại da:** (Dầu / Khô / Hỗn hợp / Nhạy cảm / Bình thường)
2. **Chẩn đoán y khoa chuyên sâu:** (Căn cứ Quyết định 4416/QĐ-BYT Bộ Y Tế)
3. **Đánh giá điểm mạnh và hàng rào bảo vệ da**

===ROUTINE===
4. **Lộ trình Routine khuyến nghị chuẩn Bộ Y Tế** (Sáng & Tối từng bước)

===INGREDIENTS===
5. **Hoạt chất Y khoa nên dùng & Thành phần nên tránh**

===WARNING===
6. **Lưu ý kích ứng & Thành phần chống chỉ định**

===JSON_DATA===
{
  "score": 75,
  "scoreLabel": "Phân tích Y Khoa & AI Vision",
  "medicalReference": "Quyết định 4416/QĐ-BYT Bộ Y Tế",
  "summary": [
    { "title": "Chẩn đoán y khoa AI Vision", "en": "(AI Medical Diagnosis)", "desc": "Đối chiếu 360 bài Y khoa Bộ Y Tế" }
  ],
  "zones": [
    { 
      "id": "forehead", 
      "title": "Vùng Trán", 
      "condition": "Mụn sẩn đỏ 1-2mm & bít tắc tuyến bã nhờn", 
      "detail": "Quan sát kỹ ảnh thấy bề mặt vùng trán xuất hiện mụn ẩn dạng sẩn nhỏ, lỗ chân lông bít tắc nhẹ. Căn cứ bài Trứng cá QĐ 4416/QĐ-BYT, khuyến nghị dùng BHA 2% làm sạch sâu.", 
      "status": "yellow" 
    },
    { 
      "id": "eyebrow", 
      "title": "Vùng Lông Mày", 
      "condition": "Nền da ổn định, ít tổn thương", 
      "detail": "Cấu trúc da vùng chân mày khỏe mạnh, màng lipid bảo vệ tốt, không phát hiện ổ viêm.", 
      "status": "green" 
    },
    { 
      "id": "upper_cheek", 
      "title": "Vùng Má", 
      "condition": "Thâm mụn sau viêm (PIH) & lỗ chân lông hơi giãn", 
      "detail": "Dấu hiệu tăng sắc tố sau viêm mụn. Khuyến nghị phối hợp Niacinamide 5% + Vitamin C để mờ thâm sáng da.", 
      "status": "yellow" 
    }
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

export function parseAnalysisResponse(text) {
  const sections = {
    overview: "",
    routine: "",
    ingredients: "",
    warning: "",
    jsonData: null,
  };
  
  if (!text) return sections;

  let mainText = text;
  const jsonIndex = text.indexOf("===JSON_DATA===");
  if (jsonIndex !== -1) {
    mainText = text.slice(0, jsonIndex).trim();
    const jsonStr = text.slice(jsonIndex + "===JSON_DATA===".length).trim();
    try {
      const cleanJson = jsonStr.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
      sections.jsonData = JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Không thể parse JSON_DATA từ Gemini AI:", e);
    }
  }
  
  const overviewIndex = mainText.indexOf("===OVERVIEW===");
  const routineIndex = mainText.indexOf("===ROUTINE===");
  const ingredientsIndex = mainText.indexOf("===INGREDIENTS===");
  const warningIndex = mainText.indexOf("===WARNING===");
  
  if (overviewIndex !== -1) {
    const start = overviewIndex + "===OVERVIEW===".length;
    const end = routineIndex !== -1 ? routineIndex : (ingredientsIndex !== -1 ? ingredientsIndex : (warningIndex !== -1 ? warningIndex : mainText.length));
    sections.overview = mainText.slice(start, end).trim();
  } else {
    const end = routineIndex !== -1 ? routineIndex : (ingredientsIndex !== -1 ? ingredientsIndex : (warningIndex !== -1 ? warningIndex : mainText.length));
    sections.overview = mainText.slice(0, end).trim();
  }
  
  if (routineIndex !== -1) {
    const start = routineIndex + "===ROUTINE===".length;
    const end = ingredientsIndex !== -1 ? ingredientsIndex : (warningIndex !== -1 ? warningIndex : mainText.length);
    sections.routine = mainText.slice(start, end).trim();
  }
  
  if (ingredientsIndex !== -1) {
    const start = ingredientsIndex + "===INGREDIENTS===".length;
    const end = warningIndex !== -1 ? warningIndex : mainText.length;
    sections.ingredients = mainText.slice(start, end).trim();
  }

  if (warningIndex !== -1) {
    const start = warningIndex + "===WARNING===".length;
    sections.warning = mainText.slice(start).trim();
  }

  return sections;
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

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash"
];

async function callOpenAI(messages) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  let lastErrorMessage = "";

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      }

      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || response.statusText;
      console.warn(`[Gemini API] Model ${model} returned status ${response.status}:`, msg);

      if (response.status === 429) {
        lastErrorMessage = "Tài khoản Gemini API tạm thời hết hạn ngạch miễn phí trong ngày (Lỗi 429 Rate Limit/Quota). Vui lòng thử lại sau ít phút.";
      } else {
        lastErrorMessage = msg || `API lỗi (${response.status})`;
      }
    } catch (err) {
      console.warn(`[Gemini API] Failed to call model ${model}:`, err.message);
      lastErrorMessage = err.message;
    }
  }

  throw new Error(lastErrorMessage || "Không thể kết nối đến Gemini AI.");
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

export function cleanAiText(text) {
  if (!text) return "";
  let clean = text;
  
  // Cut off ===JSON_DATA=== and any JSON block
  const jsonIdx = clean.indexOf("===JSON_DATA===");
  if (jsonIdx !== -1) {
    clean = clean.slice(0, jsonIdx);
  }
  
  // Remove any raw JSON objects or code blocks
  clean = clean.replace(/```json[\s\S]*?```/g, "");
  clean = clean.replace(/```[\s\S]*?```/g, "");
  clean = clean.replace(/\{[\s\S]*?"zones"[\s\S]*?\}/g, "");
  clean = clean.replace(/===(OVERVIEW|ROUTINE|INGREDIENTS|WARNING|JSON_DATA)===/g, "");
  
  return clean.trim();
}

const CHAT_SYSTEM_PROMPT = `Bạn là Bác sĩ Chuyên gia Skincare AI của GlowSkin. Nhiệm vụ: Giải đáp thắc mắc, phân tích hình ảnh mỹ phẩm/tuýp thuốc/bảng thành phần và tư vấn chuyên sâu về làn da cho người dùng dựa trên 360 Hướng dẫn Y Khoa & Quyết định 4416/QĐ-BYT Bộ Y Tế.

QUY TẮC QUÉT HÌNH ẢNH SẢN PHẨM & ĐỌC HOẠT CHẤT (KHI CÓ ẢNH ĐÍNH KÈM):
1. NHẬN DIỆN VÀ ĐỌC HOẠT CHẤT TRÊN BAO BÌ/TUÝP THUỐC:
   - Hãy sử dụng AI Vision quan sát kỹ hình ảnh nhãn hiệu, tuýp cream/gel, bao bì hoặc bảng thành phần (ingredients) trong ảnh người dùng gửi.
   - Đọc chính xác tên sản phẩm và các hoạt chất active chính xuất hiện trong ảnh (ví dụ: Klenzit MS / Klenzit-C / Derma Forte / Megaduo / Differin / BHA / Niacinamide / Benzoyl Peroxide / Azelaic Acid / Hydroquinone / Tretinoin / Adapalene / Retinol...).

2. ĐỐI CHIẾU VỚI NỀN DỮ LIỆU Y KHOA (QĐ 4416/QĐ-BYT):
   - Nêu rõ công dụng tác dụng y khoa của các hoạt chất vừa nhận diện được.
   - Đánh giá xem sản phẩm/hoạt chất này CÓ PHÙ HỢP với tình trạng da người dùng (mụn ẩn, mụn viêm, thâm mụn PIH, da dầu/khô/nhạy cảm...) theo hướng dẫn chuẩn Bộ Y Tế hay không.

3. KHUYẾN NGHỊ VÀ HƯỚNG DẪN SỬ DỤNG CHI TIẾT:
   - Xác nhận rõ ràng: "Sản phẩm trong ảnh của bạn là **[Tên sản phẩm/Hoạt chất]**".
   - Cho biết CÓ NÊN DÙNG KHÔNG và lý do y khoa.
   - Hướng dẫn cách dùng: Tần suất (số lần/tuần), thứ tự thoa trong Routine, và các lưu ý chống chỉ định/kích ứng nếu có.

- Trả lời bằng tiếng Việt tự nhiên, chuyên nghiệp, rõ ràng và mạch lạc.
- Trình bày dạng Markdown đẹp mắt (dùng **in đậm**, gạch đầu dòng ngắn gọn).
- TUYỆT ĐỐI KHÔNG BAO GỒM BẤT KỲ CẤU TRÚC LẬP TRÌNH HOẶC CHUỖI JSON TRONG CÂU TRẢ LỜI.`;

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

  const apiMessages = [
    { role: "system", content: CHAT_SYSTEM_PROMPT + (medicalContext ? `\n\nCĂN CỨ TÀI LIỆU Y KHOA BỘ Y TẾ:\n${medicalContext}` : "") }
  ];

  for (const msg of chatHistory) {
    if (msg.role === "user") {
      const imgList = msg.images || (msg.image ? [msg.image] : []);
      if (imgList.length > 0) {
        const contentParts = [
          {
            type: "text",
            text: msg.content || "Hãy đọc thông tin sản phẩm, hoạt chất trong các ảnh đính kèm và phân tích xem tôi có nên dùng không."
          }
        ];
        for (const imgSrc of imgList) {
          contentParts.push({
            type: "image_url",
            image_url: { url: imgSrc }
          });
        }
        apiMessages.push({ role: "user", content: contentParts });
      } else {
        apiMessages.push({ role: "user", content: msg.content || "" });
      }
    } else if (msg.role === "assistant") {
      const cleanMsg = cleanAiText(msg.content);
      if (cleanMsg) {
        apiMessages.push({ role: "assistant", content: cleanMsg });
      }
    }
  }

  const rawContent = await callOpenAI(apiMessages);
  const cleanContent = cleanAiText(rawContent);
  return { content: cleanContent, isDemo: false };
}

export function isUsingDemoMode() {
  return !hasApiKey();
}

