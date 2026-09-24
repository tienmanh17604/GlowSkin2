const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SYSTEM_PROMPT = `Bạn là Bác sĩ Chuyên gia Da liễu AI của GlowSkin. Nhiệm vụ: Quan sát cực kỳ kỹ lưỡng và khách quan hình ảnh khuôn mặt thực tế của người dùng để đưa ra chẩn đoán Y khoa chính xác 100% theo đúng những gì nhìn thấy trên ảnh.

QUY TẮC QUAN SÁT THỰC TẾ & CHẨN ĐOÁN TRUNG THỰC (BẮT BUỘC TUÂN THỦ):
1. ĐÁNH GIÁ CHÍNH XÁC TỪNG VÙNG DỰA TRÊN ẢNH THẬT (KHÔNG ĐƯỢC TỰ BỊA ĐẶT TỔN THƯƠNG):
   - Hãy kiểm tra chi tiết 5 vùng giải phẫu chính:
     * Vùng Trán ("forehead"): Có mụn ẩn, mụn sưng đỏ, hay nền da trán sáng mịn, sạch dầu?
     * Vùng Mắt & Lông mày ("eyebrow"): Quầng thâm, nếp nhăn đuôi mắt hay vùng da quanh mắt khỏe mạnh?
     * Vùng Mũi ("nose"): Có sợi bã nhờn, mụn đầu đen, bít tắc lỗ chân lông hay mũi sạch?
     * Vùng Má ("upper_cheek"): Có vết thâm mụn (PIH), mụn viêm đỏ, hay bề mặt má căng bóng, mịn màng?
     * Vùng Cằm ("chin"): Quan sát THỰC TẾ cằm của người trong ảnh. NẾU CẰM SẠCH, LÁNG MỊN THÌ PHẢI ĐÁNH GIÁ LÀ SẠCH KHỎE (GREEN). CHỈ KHI NÀO TRÊN ẢNH CÓ NỐT MỤN VIÊM ĐỎ HOẶC MỤN MỦ THẬT SỰ THÌ MỚI ĐÁNH GIÁ LÀ RED/YELLOW. TUYỆT ĐỐI KHÔNG BỊA RA MỤN MỦ NẾU CẰM NGƯỜI DÙNG KHÔNG CÓ!

2. PHÂN ĐỊNH MỨC ĐỘ (status) CHUẨN XÁC THEO ẢNH:
   - "green" (Xanh): Vùng da sạch, mịn màng, thông thoáng, không có nốt viêm hay bít tắc lớn.
   - "yellow" (Vàng): Vùng da có bóng dầu, sợi bã nhờn ở cánh mũi/cằm, lỗ chân lông to nhẹ hoặc mụn ẩn li ti.
   - "red" (Đỏ): VÙNG DA CÓ TỔN THƯƠNG THỰC TẾ: nốt mụn viêm sưng tấy, mụn mủ đầu trắng/vàng, vết thâm đỏ đậm sau nặn.

3. THANG ĐIỂM SỨC KHỎE LÀN DA (score):
   - Nền da đẹp, sáng khỏe, ít khuyết điểm: Đặt điểm từ 85 - 95.
   - Nền da bình thường, có chút dầu nhờn hoặc mụn cám nhẹ: Đặt điểm từ 72 - 84.
   - Nền da có nhiều ổ viêm đỏ, mụn bọc, mụn mủ rõ rệt: Đặt điểm từ 50 - 70.

4. QUY TẮC CẤM QUAN TRỌNG:
   - TUYỆT ĐỐI KHÔNG ĐƯỢC XUẤT HIỆN CỤM TỪ "Bộ Y Tế" HOẶC "Bộ Y tế" HOẶC "BYT". Hãy dùng cụm từ "Chuyên khoa Da liễu" hoặc "Tiêu chuẩn Y khoa lâm sàng".

CẤU TRÚC PHẢN HỒI (BẮT BUỘC GIỮ ĐÚNG CÁC THẺ SAU ĐÂY):
===OVERVIEW===
## Báo cáo Phân tích Da Y Khoa ✨
1. **Loại da:** (Dầu / Khô / Hỗn hợp / Nhạy cảm / Bình thường)
2. **Chẩn đoán y khoa chuyên sâu:** (Nhận xét đúng thực trạng thực tế quan sát được trong ảnh)
3. **Đánh giá điểm mạnh và hàng rào bảo vệ da**

===ROUTINE===
4. **Lộ trình Routine khuyến nghị chuẩn Chuyên khoa** (Sáng & Tối từng bước phù hợp đúng loại da của người dùng)

===INGREDIENTS===
5. **Hoạt chất Y khoa nên dùng & Thành phần nên tránh**

===WARNING===
6. **Lưu ý kích ứng & Thành phần chống chỉ định**

===JSON_DATA===
{
  "score": 82,
  "scoreLabel": "Phân tích Y Khoa & AI Vision",
  "medicalReference": "Tiêu chuẩn Chuyên Khoa Da Liễu",
  "summary": [
    { "title": "Đặc điểm 1 quan sát được", "en": "(English Term)", "desc": "Mô tả ngắn gọn theo ảnh" },
    { "title": "Đặc điểm 2 quan sát được", "en": "(English Term)", "desc": "Mô tả ngắn gọn theo ảnh" }
  ],
  "zones": [
    { 
      "id": "forehead", 
      "title": "Vùng Trán", 
      "condition": "Mô tả ngắn 1 dòng tình trạng thực tế của trán trong ảnh", 
      "detail": "Lời khuyên và đánh giá chi tiết chuẩn y khoa", 
      "status": "green" 
    },
    { 
      "id": "eyebrow", 
      "title": "Vùng Mắt & Lông Mày", 
      "condition": "Mô tả thực tế vùng quanh mắt", 
      "detail": "Đánh giá cấu trúc da và độ ẩm", 
      "status": "green" 
    },
    { 
      "id": "nose", 
      "title": "Vùng Mũi", 
      "condition": "Mô tả tuyến bã nhờn, mụn đầu đen hoặc lỗ chân lông", 
      "detail": "Khuyến nghị làm sạch", 
      "status": "yellow" 
    },
    { 
      "id": "upper_cheek", 
      "title": "Vùng Má", 
      "condition": "Mô tả bề mặt má", 
      "detail": "Đánh giá sắc tố và độ đàn hồi", 
      "status": "green" 
    },
    { 
      "id": "chin", 
      "title": "Vùng Cằm", 
      "condition": "Mô tả thực tế vùng cằm (nếu láng mịn thì ghi không có mụn viêm)", 
      "detail": "Chi tiết chăm sóc vùng cằm", 
      "status": "green" 
    }
  ]
}

Chú ý: Thẻ ===JSON_DATA=== phải chứa duy nhất 1 chuỗi JSON hợp lệ. Các thuộc tính status phải là "green", "yellow", hoặc "red" tương ứng đúng với ảnh thật.`;

const DEMO_ANALYSIS = `===OVERVIEW===
## Kết quả phân tích da mặt ✨

**1. Loại da:** Da hỗn hợp thiên dầu — vùng chữ T tăng tiết bã nhờn, hai bên má nhẹ dịu.

**2. Tình trạng da (Căn cứ phác đồ Chuyên khoa Da liễu):**
- **Trán & Mũi:** Lỗ chân lông bít tắc, có mụn đầu đen và mụn viêm rải rác.
- **Má & Cằm:** Dấu hiệu thâm sau viêm (PIH) nhẹ và thiếu ẩm bề mặt.

**3. Điểm mạnh:** Da có khả năng phục hồi tốt, cấu trúc elastin đồng đều.

===ROUTINE===
**Routine gợi ý (Chuẩn Hướng dẫn Chuyên khoa Da liễu):**
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
  "medicalReference": "Tiêu chuẩn Chuyên Khoa Da Liễu",
  "summary": [
    { "title": "Bít tắc lỗ chân lông", "en": "(Enlarged Pores)", "desc": "Tập trung vùng chữ T (Trán & Mũi)" },
    { "title": "Mụn viêm rải rác", "en": "(Inflammatory Acne)", "desc": "Căn cứ phác đồ Trứng cá chuyên khoa" },
    { "title": "Thâm mụn sau viêm", "en": "(Post-inflammatory Hyperpigmentation)", "desc": "Cần sử dụng Niacinamide / Vitamin C" }
  ],
  "zones": [
    { "id": "forehead", "title": "Vùng Trán", "condition": "Mụn viêm & Thâm dai dẳng", "detail": "Có mụn sưng đỏ rải rác và lỗ chân lông bít tắc.", "angle": -90 },
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

const DEFAULT_CLINICAL_GUIDELINE = `--- [Nguồn: Tiêu chuẩn Chuyên khoa Da Liễu Lâm sàng] Hướng dẫn Chẩn đoán & Phác đồ Routine ---
1. Trứng cá viêm mủ, sưng đỏ: Kháng khuẩn với Benzoyl Peroxide 2.5-5%, kết hợp BHA (Salicylic Acid) 2% làm thông thoáng cổ nang lông.
2. Thâm mụn sau viêm (PIH) & Tăng sắc tố: Dùng Azelaic Acid 15-20%, Niacinamide 4-10%, kết hợp chống nắng phổ rộng SPF 50+.
3. Bít tắc sợi bã nhờn, mụn ẩn: BHA 2%, Retinoids (Adapalene/Tretinoin), làm sạch 2 bước dịu nhẹ.
4. Hàng rào bảo vệ da & Viêm đỏ: Phục hồi với Ceramide, Hyaluronic Acid, Panthenol (B5), tránh cồn khô và hương liệu nồng.`;

let cachedMedicalContext = null;

export function compressImageIfNeeded(dataUrl, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
      return resolve(dataUrl);
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      if (img.width <= maxWidth && img.height <= maxWidth) {
        return resolve(dataUrl);
      }

      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function fetchMedicalContext(query = "mụn trứng cá thâm nám lão hóa") {
  if (cachedMedicalContext) return cachedMedicalContext;

  try {
    const queries = ["mụn trứng cá viêm mủ ẩn", "sắc tố thâm mụn nám tàn nhang", "lão hóa nếp nhăn căng bóng"];
    if (query && !queries.includes(query)) {
      queries.unshift(query);
    }

    // Tối ưu: Timeout 1 giây để không bị nghẽn nếu Render backend đang ngủ
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const responses = await Promise.all(
      queries.slice(0, 3).map((q) =>
        fetch(`${API_URL}/medical/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
          signal: controller.signal,
        })
          .then((res) => (res.ok ? res.json() : { results: [] }))
          .catch(() => ({ results: [] }))
      )
    );
    clearTimeout(timeoutId);

    const fetchedItems = [];
    for (const data of responses) {
      if (data.results && data.results.length) {
        fetchedItems.push(...data.results);
      }
    }

    // Deduplicate by ID or title
    const uniqueMap = new Map();
    for (const item of fetchedItems) {
      const key = item.id || item.title;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    const uniqueResults = Array.from(uniqueMap.values()).slice(0, 5);
    if (uniqueResults.length) {
      cachedMedicalContext = uniqueResults
        .map((r) => {
          const cleanSource = (r.source || "DATA Y Khoa Da Liễu")
            .replace(/Bộ\s*Y\s*[tT]ế/gi, "Chuyên khoa Da Liễu")
            .replace(/QĐ-BYT/gi, "Y khoa")
            .replace(/Quyết\s*định\s*4416(\/QĐ-BYT)?/gi, "Phác đồ Y khoa");
          const cleanTitle = (r.title || "")
            .replace(/Bộ\s*Y\s*[tT]ế/gi, "Chuyên khoa Da Liễu")
            .replace(/QĐ-BYT/gi, "Y khoa");
          const cleanContent = (r.content || "")
            .replace(/Bộ\s*Y\s*[tT]ế/gi, "Chuyên khoa Da Liễu")
            .replace(/QĐ-BYT/gi, "Y khoa");
          return `--- [Nguồn: ${cleanSource}] ${cleanTitle} ---\n${cleanContent}`;
        })
        .join("\n\n");
      return cachedMedicalContext;
    }
  } catch (err) {
    console.warn("Dùng tài liệu y khoa tiêu chuẩn tích hợp:", err.message);
  }

  cachedMedicalContext = DEFAULT_CLINICAL_GUIDELINE;
  return cachedMedicalContext;
}

// Ưu tiên gemini-2.5-flash: Tốc độ phản hồi cực nhanh (~1.1 giây)
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest"
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
    promptText += `\n\nDƯỚI ĐÂY LÀ HƯỚNG DẪN CHẨN ĐOÁN VÀ ĐIỀU TRỊ CHUYÊN KHOA DA LIỄU:\n${medicalContext}\n\nHãy căn cứ vào hướng dẫn Y khoa trên để đưa ra chẩn đoán và lời khuyên chuẩn xác nhất.`;
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

  // Strict sanitization: ensure no mention of Bộ Y Tế or QĐ-BYT slips through
  clean = clean.replace(/Bộ\s*Y\s*[tT]ế/gi, "Chuyên khoa Da liễu");
  clean = clean.replace(/QĐ-BYT/gi, "Y khoa");
  clean = clean.replace(/QĐ\s*4416(\/QĐ-BYT)?/gi, "Phác đồ Y khoa");
  clean = clean.replace(/Quyết\s*định\s*4416(\/QĐ-BYT)?/gi, "Phác đồ Y khoa");
  
  return clean.trim();
}

const CHAT_SYSTEM_PROMPT = `Bạn là Bác sĩ Chuyên gia Skincare AI của GlowSkin. Nhiệm vụ: Giải đáp thắc mắc, phân tích hình ảnh mỹ phẩm/tuýp thuốc/bảng thành phần và tư vấn chuyên sâu về làn da cho người dùng dựa trên các phác đồ Chuyên khoa Da liễu & Tiêu chuẩn Y khoa Lâm sàng.
QUY TẮC CẤM QUAN TRỌNG: TUYỆT ĐỐI KHÔNG ĐƯỢC XUẤT HIỆN CỤM TỪ "Bộ Y Tế" HOẶC "Bộ Y tế" HOẶC "BYT" TRONG BẤT KỲ CÂU TRẢ LỜI NÀO.

QUY TẮC QUÉT HÌNH ẢNH SẢN PHẨM & ĐỌC HOẠT CHẤT (KHI CÓ ẢNH ĐÍNH KÈM):
1. NHẬN DIỆN VÀ ĐỌC HOẠT CHẤT TRÊN BAO BÌ/TUÝP THUỐC:
   - Hãy sử dụng AI Vision quan sát kỹ hình ảnh nhãn hiệu, tuýp cream/gel, bao bì hoặc bảng thành phần (ingredients) trong ảnh người dùng gửi.
   - Đọc chính xác tên sản phẩm và các hoạt chất active chính xuất hiện trong ảnh (ví dụ: Klenzit MS / Klenzit-C / Derma Forte / Megaduo / Differin / BHA / Niacinamide / Benzoyl Peroxide / Azelaic Acid / Hydroquinone / Tretinoin / Adapalene / Retinol...).

2. ĐỐI CHIẾU VỚI NỀN DỮ LIỆU Y KHOA:
   - Nêu rõ công dụng tác dụng y khoa của các hoạt chất vừa nhận diện được.
   - Đánh giá xem sản phẩm/hoạt chất này CÓ PHÙ HỢP với tình trạng da người dùng (mụn ẩn, mụn viêm, thâm mụn PIH, da dầu/khô/nhạy cảm...) theo hướng dẫn chuyên khoa da liễu hay không.

3. KHUYẾN NGHỊ VÀ HƯỚNG DẪN SỬ DỤNG CHI TIẾT:
   - Xác nhận rõ ràng: "Sản phẩm trong ảnh của bạn là **[Tên sản phẩm/Hoạt chất]**".
   - Cho biết CÓ NÊN DÙNG KHÔNG và lý do y khoa.
   - Hướng dẫn cách dùng: Tần suất (số lần/tuần), thứ tự thoa trong Routine, và các lưu ý chống chỉ định/kích ứng nếu có.

- Trả lời bằng tiếng Việt tự nhiên, chuyên nghiệp, rõ ràng và mạch lạc.
- Trình bày dạng Markdown đẹp mắt (dùng **in đậm**, gạch đầu dòng ngắn gọn).
- TUYỆT ĐỐI KHÔNG BAO GỒM BẤT KỲ CẤU TRÚC LẬP TRÌNH HOẶC CHUỖI JSON TRONG CÂU TRẢ LỜI.`;

export async function analyzeSkinImage(imageDataUrl) {
  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 600));
    return { content: DEMO_ANALYSIS, isDemo: true };
  }

  // Tối ưu chạy song song: Nén ảnh và lấy context Y khoa
  const [optimizedImageDataUrl, medicalContext] = await Promise.all([
    compressImageIfNeeded(imageDataUrl, 800, 0.8),
    fetchMedicalContext("mụn trứng cá viêm da"),
  ]);

  const messages = buildVisionMessages([], optimizedImageDataUrl, medicalContext);
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
    { role: "system", content: CHAT_SYSTEM_PROMPT + (medicalContext ? `\n\nCĂN CỨ TÀI LIỆU CHUYÊN KHOA DA LIỄU:\n${medicalContext}` : "") }
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

