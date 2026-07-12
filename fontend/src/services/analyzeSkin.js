const SYSTEM_PROMPT = `Bạn là chuyên gia skincare AI của GlowSkin. Nhiệm vụ: phân tích da mặt từ ảnh người dùng gửi.

Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
Bạn PHẢI trình bày kết quả phân tích theo đúng cấu trúc và sử dụng các thẻ phân chia chính xác như sau:

===OVERVIEW===
## Kết quả phân tích da mặt ✨
1. **Loại da** (dầu/khô/hỗn hợp/nhạy cảm/bình thường)
2. **Tình trạng da** (mụn, thâm, lỗ chân lông, nếp nhăn, mất nước...)
3. **Điểm mạnh** của làn da

===ROUTINE===
4. **Routine gợi ý** (sáng/tối, từng bước cụ thể)

===INGREDIENTS===
5. **Thành phần nên dùng** và nên tránh

===WARNING===
6. **Thành phần dễ gây kích ứng** đối với làn da này (nếu có) và lý do tại sao nên tránh

Chú ý: Giữ nguyên các thẻ ===OVERVIEW===, ===ROUTINE===, ===INGREDIENTS===, và ===WARNING=== viết hoa chính xác. Nếu ảnh không rõ khuôn mặt, hãy nhẹ nhàng yêu cầu ảnh rõ hơn.`;

const DEMO_ANALYSIS = `===OVERVIEW===
## Kết quả phân tích da mặt ✨

**1. Loại da:** Da hỗn hợp — vùng chữ T hơi dầu, hai bên má bình thường.

**2. Tình trạng da:**
- Lỗ chân lông hơi to ở vùng mũi và trán
- Một vài đốm thâm nhẹ sau mụn
- Da có dấu hiệu thiếu ẩm ở vùng má

**3. Điểm mạnh:** Nền da tương đối đều màu, ít viêm đỏ.

===ROUTINE===
**Routine gợi ý:**
- *Sáng:* Sữa rửa mặt dịu nhẹ → Toner cân bằng → Serum Vitamin C → Kem dưỡng ẩm → Kem chống nắng SPF 50
- *Tối:* Tẩy trang → Sữa rửa mặt → Toner → Serum Niacinamide/BHA (3x/tuần) → Kem dưỡng phục hồi

===INGREDIENTS===
**Thành phần nên dùng:** Niacinamide, Hyaluronic Acid, Vitamin C, Ceramide

**Nên tránh:** Rượu cồn cao, hương liệu mạnh nếu da nhạy cảm

===WARNING===
**Các thành phần dễ gây kích ứng với làn da của bạn:**
- **Cồn khô (Alcohol Denat / Ethanol):** Dễ làm mất đi lớp màng bảo vệ tự nhiên, khiến hai bên má bị khô rát.
- **Hương liệu nhân tạo (Fragrance):** Có thể làm tăng nguy cơ kích ứng cho các nốt mụn sẵn có.
- **Dầu khoáng (Mineral Oil):** Rất dễ gây bít tắc thêm vùng lỗ chân lông to ở cánh mũi và trán.
- **Chất hoạt động bề mặt mạnh (SLS/SLES):** Gây cảm giác khô căng sau khi rửa mặt.`;

function hasApiKey() {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
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

function buildVisionMessages(chatHistory, imageDataUrl) {
  const apiMessages = [{ role: "system", content: SYSTEM_PROMPT }];

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

  const messages = buildVisionMessages([], imageDataUrl);
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

  const messages = buildVisionMessages(chatHistory, null);
  const content = await callOpenAI(messages);
  return { content, isDemo: false };
}

export function isUsingDemoMode() {
  return !hasApiKey();
}
