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

4. BỘ DỮ LIỆU ĐÀO TẠO THỊ GIÁC AI (TRAINING AI KNOWLEDGE BASE - 18 TÌNH TRẠNG CHUẨN):
   - Mụn không viêm:
     * Mụn đầu trắng (1-2mm, nốt kín không lỗ mở rõ, không mủ. Phân biệt với milia, sợi bã nhờn).
     * Mụn đầu đen (chấm nâu đen trong lỗ chân lông mở do oxy hóa lipid).
     * Mụn ẩn (nốt chìm cộm dưới da, sờ lợn cợn, không sưng đỏ).
   - Mụn viêm:
     * Mụn sẩn viêm (nốt đỏ <5mm, sưng gồ, đau nhẹ, không thấy mủ rõ).
     * Mụn mủ (gồ viền đỏ, trung tâm có chóp mủ trắng/vàng).
     * Mụn bọc & Mụn nang (>5mm, viêm sâu, cứng đau, lan tỏa sâu).
     * Mụn trứng cá đỏ (Rosacea - đỏ bừng vùng má/mũi kèm giãn mao mạch).
     * Viêm nang lông (sẩn mụn nhỏ đồng dạng quanh lỗ chân lông/chân lông).
   - Sợi bã nhờn: Cụm chấm nhỏ vàng nhạt/xám ở cánh mũi, cằm, phẳng, phân bố đều (TUYỆT ĐỐI KHÔNG GỌI LÀ MỤN ĐẦU ĐEN NẾU KHÔNG CÓ NÚT TẮC ĐEN CỨNG).
   - Lỗ chân lông: Nang lông giãn rộng vùng mũi/má, tăng tiết dầu nhờn.
   - Sắc tố da: Thâm mụn PIH (nâu)/PIE (đỏ hồng), đốm sạm không đều màu.
   - Lão hoá & Sẹo: Nếp nhăn động/tĩnh, Sẹo lõm (boxcar/ice-pick/rolling), Sẹo lồi mô xơ gồ.

5. BẢNG HOẠT CHẤT ĐIỀU TRỊ CHUẨN TỪ BỘ DỮ LIỆU ĐÀO TẠO:
   - Nhóm mụn & bít tắc: Salicylic acid (BHA), Adapalene, Azelaic acid, Benzoyl peroxide, Niacinamide, Zinc PCA, Retinol.
   - Nhóm sợi bã nhờn & lỗ chân lông: BHA, Niacinamide, Đất sét (Kaolin), AHA dịu nhẹ.
   - Nhóm thâm & sắc tố: Azelaic acid, Niacinamide, Vitamin C, Arbutin, Glycolic acid, Tranexamic acid.
   - Nhóm phục hồi & chống lão hóa: Ceramide, Hyaluronic Acid, Peptide, Panthenol (B5), Centella Asiatica, Tretinoin/Retinol.

6. QUY TẮC CẤM QUAN TRỌNG:
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
  "score": 67,
  "averageScore": 6.7,
  "scoreLabel": "Phân tích Y Khoa & AI Vision",
  "medicalReference": "Tiêu chuẩn Chuyên Khoa Da Liễu",
  "detectedIssues": ["Lỗ chân lông", "Mụn không viêm"],
  "metrics": {
    "mun_viem": { "score": 9, "label": "Mụn viêm", "dotColor": "#f472b6", "pillColor": "#e11d48", "points": [{ "top": 53.0, "left": 35.0, "pointer": true }] },
    "mun_khong_viem": { "score": 6, "label": "Mụn không viêm", "dotColor": "#eab308", "pillColor": "#d97706", "points": [{ "top": 28.0, "left": 48.0 }, { "top": 52.0, "left": 65.0 }, { "top": 72.0, "left": 50.0, "pointer": true }] },
    "soi_ba_nhon": { "score": 7, "label": "Sợi bã nhờn", "dotColor": "#8b5cf6", "pillColor": "#6862b5", "points": [{ "top": 48.0, "left": 50.0, "pointer": true }, { "top": 47.0, "left": 46.5 }, { "top": 47.0, "left": 53.5 }, { "top": 69.0, "left": 50.0 }] },
    "seo": { "score": 7, "label": "Sẹo", "dotColor": "#ef4444", "pillColor": "#dc2626", "points": [{ "top": 53.0, "left": 66.0, "pointer": true }] },
    "sac_to_da": { "score": 6, "label": "Sắc tố da", "dotColor": "#ea580c", "pillColor": "#e15b32", "points": [{ "top": 49.0, "left": 33.0 }, { "top": 49.0, "left": 67.0, "pointer": true }] },
    "lo_chan_long": { "score": 5, "label": "Lỗ chân lông", "dotColor": "#22c55e", "pillColor": "#16a34a", "points": [{ "top": 48.5, "left": 42.0, "pointer": true }, { "top": 48.5, "left": 58.0 }] }
  },
  "summary": [
    { "title": "Lỗ chân lông to", "en": "(Enlarged Pores)", "desc": "Tập trung vùng chữ T và hai bên má" },
    { "title": "Mụn không viêm", "en": "(Comedones)", "desc": "Sợi bã nhờn và mụn cám rải rác" }
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
      "condition": "Mô tả thực tế vùng cằm", 
      "detail": "Chi tiết chăm sóc vùng cằm", 
      "status": "green" 
    }
  ]
}

QUY TẮC ĐỊNH VỊ TỌA ĐỘ VÒNG TRÒN GIẢI PHẪU HỌC CHO AI (BẮT BUỘC):
1. SỢI BÃ NHỜN (soi_ba_nhon): CHỈ ĐƯỢC ĐẶT VÒNG TRÒN Ở MŨI (chóp mũi, cánh mũi, sống mũi top: 45%-52%, left: 45%-55%) hoặc RÃNH CẰM (top: 67%-72%). TUYỆT ĐỐI CẤM ĐẶT VÒNG TRÒN Ở MÔI, MIỆNG, NHÂN TRUNG (top 53%-66%).
2. LỖ CHÂN LÔNG (lo_chan_long): Đặt ở vùng má kề cánh mũi (top: 48%-56%, left: 36%-44% hoặc left: 56%-64%) hoặc đầu mũi.
3. MỤN VIÊM (mun_viem): Đặt đúng vị trí nốt mụn sưng đỏ thực tế trên má (top: 48%-62%), trán (top: 25%-35%), cằm (top: 68%-76%).
4. MỤN KHÔNG VIÊM (mun_khong_viem): Đặt ở trán, má hoặc cằm.
5. SẮC TỐ DA (sac_to_da) & SẸO (seo): Đặt trên gò má, thái dương, trán.
Tọa độ phần trăm { top: %, left: % } tính từ mép trên và mép trái của toàn bộ khuôn mặt trong khung hình.`;

export function sanitizeFacialPoints(metricId, points = []) {
  if (!Array.isArray(points)) return [];
  return points.map((p, idx) => {
    let top = Number(p.top);
    let left = Number(p.left);
    if (isNaN(top)) top = 50;
    if (isNaN(left)) left = 50;

    // Safety clamps: Keep within realistic face bounding area
    top = Math.max(18, Math.min(82, top));
    left = Math.max(20, Math.min(80, left));

    // STRICT ANATOMICAL RULE FOR SỢI BÃ NHỜN (SEBACEOUS FILAMENTS):
    // Phân bố chuẩn Y khoa: CHỈ ở vùng mũi (chóp mũi, cánh mũi, sống mũi) hoặc rãnh cằm.
    // TUYỆT ĐỐI CẤM rơi vào vùng môi/miệng/nhân trung (top 53% - 66%).
    if (metricId === "soi_ba_nhon") {
      if (top >= 53 && top <= 66) {
        // Tự động kéo về chóp mũi/cánh mũi (47% - 50%) hoặc rãnh cằm (68% - 71%)
        top = top < 60 ? 48.5 : 69.5;
        if (left < 44) left = 47.0;
        if (left > 56) left = 53.0;
      }
    }

    // STRICT ANATOMICAL RULE FOR LỖ CHÂN LÔNG (PORES):
    // Lỗ chân lông to ở hai bên má giáp cánh mũi hoặc sống mũi/trán, không ở môi
    if (metricId === "lo_chan_long") {
      if (top >= 55 && top <= 66 && left >= 42 && left <= 58) {
        top = 50.5;
      }
    }

    return {
      ...p,
      top: Number(top.toFixed(1)),
      left: Number(left.toFixed(1)),
      pointer: p.pointer || idx === 0
    };
  });
}

export const DEFAULT_DIAGNOSTIC_METRICS = {
  mun_viem: {
    id: "mun_viem",
    label: "Mụn viêm",
    score: 9,
    dotColor: "#f472b6",
    pillColor: "#e11d48",
    pointerIndex: 0,
    points: [{ top: 52.0, left: 34.0, pointer: true }, { top: 54.0, left: 66.0 }],
    pointsByAngle: {
      front: [{ top: 52.0, left: 34.0, pointer: true }, { top: 54.0, left: 66.0 }],
      left: [{ top: 52.0, left: 42.0, pointer: true }, { top: 55.0, left: 48.0 }],
      right: [{ top: 52.0, left: 58.0, pointer: true }, { top: 55.0, left: 52.0 }]
    }
  },
  mun_khong_viem: {
    id: "mun_khong_viem",
    label: "Mụn không viêm",
    score: 6,
    dotColor: "#eab308",
    pillColor: "#d97706",
    pointerIndex: 3,
    points: [
      { top: 28.0, left: 48.0 },
      { top: 52.0, left: 35.0 },
      { top: 52.0, left: 65.0 },
      { top: 72.0, left: 50.0, pointer: true }
    ],
    pointsByAngle: {
      front: [
        { top: 28.0, left: 48.0 },
        { top: 52.0, left: 35.0 },
        { top: 52.0, left: 65.0 },
        { top: 72.0, left: 50.0, pointer: true }
      ],
      left: [
        { top: 29.0, left: 45.0 },
        { top: 51.0, left: 38.0 },
        { top: 54.0, left: 44.0, pointer: true }
      ],
      right: [
        { top: 29.0, left: 55.0 },
        { top: 51.0, left: 62.0 },
        { top: 54.0, left: 56.0, pointer: true }
      ]
    }
  },
  soi_ba_nhon: {
    id: "soi_ba_nhon",
    label: "Sợi bã nhờn",
    score: 7,
    dotColor: "#8b5cf6",
    pillColor: "#6862b5",
    pointerIndex: 0,
    points: [
      { top: 48.0, left: 50.0, pointer: true },
      { top: 47.0, left: 46.5 },
      { top: 47.0, left: 53.5 },
      { top: 45.0, left: 50.0 },
      { top: 69.0, left: 50.0 }
    ],
    pointsByAngle: {
      front: [
        { top: 48.0, left: 50.0, pointer: true },
        { top: 47.0, left: 46.5 },
        { top: 47.0, left: 53.5 },
        { top: 45.0, left: 50.0 },
        { top: 69.0, left: 50.0 }
      ],
      left: [
        { top: 47.5, left: 54.0, pointer: true },
        { top: 46.0, left: 51.5 },
        { top: 48.5, left: 56.0 },
        { top: 49.0, left: 52.0 },
        { top: 69.0, left: 53.0 }
      ],
      right: [
        { top: 47.5, left: 46.0, pointer: true },
        { top: 46.0, left: 48.5 },
        { top: 48.5, left: 44.0 },
        { top: 49.0, left: 48.0 },
        { top: 69.0, left: 47.0 }
      ]
    }
  },
  seo: {
    id: "seo",
    label: "Sẹo",
    score: 7,
    dotColor: "#ef4444",
    pillColor: "#dc2626",
    pointerIndex: 0,
    points: [{ top: 53.0, left: 32.0, pointer: true }, { top: 53.0, left: 68.0 }],
    pointsByAngle: {
      front: [{ top: 53.0, left: 32.0, pointer: true }, { top: 53.0, left: 68.0 }],
      left: [{ top: 52.0, left: 38.0, pointer: true }],
      right: [{ top: 52.0, left: 62.0, pointer: true }]
    }
  },
  sac_to_da: {
    id: "sac_to_da",
    label: "Sắc tố da",
    score: 6,
    dotColor: "#ea580c",
    pillColor: "#e15b32",
    pointerIndex: 1,
    points: [
      { top: 49.0, left: 33.0 },
      { top: 49.0, left: 67.0, pointer: true },
      { top: 27.0, left: 50.0 }
    ],
    pointsByAngle: {
      front: [
        { top: 49.0, left: 33.0 },
        { top: 49.0, left: 67.0, pointer: true },
        { top: 27.0, left: 50.0 }
      ],
      left: [
        { top: 48.0, left: 36.0 },
        { top: 51.0, left: 42.0, pointer: true }
      ],
      right: [
        { top: 48.0, left: 64.0 },
        { top: 51.0, left: 58.0, pointer: true }
      ]
    }
  },
  lo_chan_long: {
    id: "lo_chan_long",
    label: "Lỗ chân lông",
    score: 5,
    dotColor: "#22c55e",
    pillColor: "#16a34a",
    pointerIndex: 0,
    points: [
      { top: 48.5, left: 42.0, pointer: true },
      { top: 52.0, left: 40.5 },
      { top: 48.5, left: 58.0 },
      { top: 52.0, left: 59.5 }
    ],
    pointsByAngle: {
      front: [
        { top: 48.5, left: 42.0, pointer: true },
        { top: 52.0, left: 40.5 },
        { top: 48.5, left: 58.0 },
        { top: 52.0, left: 59.5 }
      ],
      left: [
        { top: 48.5, left: 46.0, pointer: true },
        { top: 51.5, left: 43.5 },
        { top: 47.5, left: 52.0 }
      ],
      right: [
        { top: 48.5, left: 54.0, pointer: true },
        { top: 51.5, left: 56.5 },
        { top: 47.5, left: 48.0 }
      ]
    }
  }
};

export function computeDiagnosticMetrics(surveyData = {}, parsedJson = {}) {
  const base = JSON.parse(JSON.stringify(DEFAULT_DIAGNOSTIC_METRICS));

  if (parsedJson?.metrics) {
    for (const key of Object.keys(base)) {
      if (parsedJson.metrics[key]) {
        const aiM = parsedJson.metrics[key];
        if (typeof aiM.score === "number") base[key].score = aiM.score;
        if (Array.isArray(aiM.points) && aiM.points.length > 0) {
          const sanitized = sanitizeFacialPoints(key, aiM.points);
          base[key].points = sanitized;
          if (!aiM.pointsByAngle) {
            base[key].pointsByAngle = {
              front: sanitized,
              left: sanitized,
              right: sanitized
            };
          }
        }
      }
    }
  } else {
    const skinType = (surveyData?.skinType || "").toLowerCase();
    const isOily = skinType.includes("dầu") || skinType.includes("nhờn");
    const isDry = skinType.includes("khô");
    const sensitivity = surveyData?.skinSensitivity || "";
    const hasVessels = surveyData?.hasBloodVessels === "Có";
    const hasMeds = surveyData?.hasPrescriptionMedication === "Có" || surveyData?.hasMedicalCondition === "Có";

    if (isOily) {
      base.lo_chan_long.score = 5;
      base.soi_ba_nhon.score = 7;
      base.mun_khong_viem.score = 6;
      base.mun_viem.score = hasMeds ? 7 : 9;
    } else if (isDry) {
      base.lo_chan_long.score = 7;
      base.soi_ba_nhon.score = 8;
      base.sac_to_da.score = 6;
    }

    if (hasVessels || sensitivity === "Thường xuyên" || sensitivity === "Rất hay gặp") {
      base.sac_to_da.score = Math.min(base.sac_to_da.score, 6);
    }
  }

  const metricValues = Object.values(base);
  const avg = (metricValues.reduce((acc, m) => acc + Number(m.score || 0), 0) / metricValues.length).toFixed(1);
  const sorted = [...metricValues].sort((a, b) => a.score - b.score);
  const detectedIssues = parsedJson?.detectedIssues || [
    sorted[0]?.label || "Lỗ chân lông",
    sorted[1]?.label || "Mụn không viêm"
  ];

  return {
    metrics: base,
    averageScore: parsedJson?.averageScore || Number(avg),
    detectedIssues
  };
}

const DEMO_ANALYSIS = `===OVERVIEW===
## Kết quả phân tích da mặt ✨

**1. Loại da:** Da hỗn hợp thiên dầu — vùng chữ T tăng tiết bã nhờn, hai bên má nhẹ dịu.

**2. Tình trạng da (Căn cứ phác đồ Chuyên khoa Da liễu):**
- **Trán & Mũi:** Lỗ chân lông bít tắc, có mụn đầu đen và sợi bã nhờn rải rác.
- **Má & Cằm:** Dấu hiệu sắc tố nhẹ và sợi bã nhờn quanh cánh mũi.

**3. Điểm mạnh:** Nền da có độ đàn hồi tốt, ít tổn thương mụn viêm nặng.

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
  "score": 67,
  "averageScore": 6.7,
  "scoreLabel": "Phân tích Y Khoa & AI Vision",
  "medicalReference": "Tiêu chuẩn Chuyên Khoa Da Liễu",
  "detectedIssues": ["Lỗ chân lông", "Mụn không viêm"],
  "metrics": {
    "mun_viem": { "score": 9, "label": "Mụn viêm", "dotColor": "#f472b6", "pillColor": "#e11d48", "points": [{ "top": 42, "left": 48, "r": 9 }] },
    "mun_khong_viem": { "score": 6, "label": "Mụn không viêm", "dotColor": "#eab308", "pillColor": "#d97706", "points": [{ "top": 34, "left": 47, "r": 8 }, { "top": 37, "left": 60, "r": 8 }, { "top": 36, "left": 27, "r": 8 }, { "top": 46.5, "left": 65, "r": 9 }] },
    "soi_ba_nhon": { "score": 7, "label": "Sợi bã nhờn", "dotColor": "#8b5cf6", "pillColor": "#6862b5", "points": [{ "top": 33, "left": 57, "r": 7 }, { "top": 34.5, "left": 63, "r": 8 }, { "top": 32, "left": 61, "r": 7 }, { "top": 35.5, "left": 66, "r": 8 }, { "top": 35, "left": 56, "r": 8 }] },
    "seo": { "score": 7, "label": "Sẹo", "dotColor": "#ef4444", "pillColor": "#dc2626", "points": [{ "top": 43, "left": 68, "r": 8 }] },
    "sac_to_da": { "score": 6, "label": "Sắc tố da", "dotColor": "#ea580c", "pillColor": "#e15b32", "points": [{ "top": 27, "left": 66, "r": 8 }, { "top": 29.5, "left": 63, "r": 7 }, { "top": 37, "left": 65, "r": 8 }, { "top": 43.5, "left": 66, "r": 9 }] },
    "lo_chan_long": { "score": 5, "label": "Lỗ chân lông", "dotColor": "#22c55e", "pillColor": "#16a34a", "points": [{ "top": 33, "left": 52, "r": 8 }, { "top": 35, "left": 55, "r": 8 }, { "top": 38, "left": 46, "r": 8 }, { "top": 40, "left": 54, "r": 8 }] }
  },
  "summary": [
    { "title": "Lỗ chân lông to", "en": "(Enlarged Pores)", "desc": "Tập trung vùng chữ T và hai bên má" },
    { "title": "Mụn không viêm", "en": "(Comedones)", "desc": "Sợi bã nhờn và mụn cám rải rác" }
  ],
  "zones": [
    { "id": "forehead", "title": "Vùng Trán", "condition": "Mụn ẩn nhẹ rải rác", "detail": "Lỗ chân lông hơi bít tắc vùng chữ T.", "angle": -90 },
    { "id": "eyebrow", "title": "Vùng Lông Mày", "condition": "Da bình thường, ít tổn thương", "detail": "Bề mặt da mịn màng, không có mụn ẩn hay viêm.", "angle": -30 },
    { "id": "upper_cheek", "title": "Vùng Má", "condition": "Sắc tố nhẹ & Lỗ chân lông", "detail": "Xuất hiện lỗ chân lông hơi giãn nhẹ.", "angle": 30 },
    { "id": "chin", "title": "Vùng Cằm", "condition": "Sợi bã nhờn & Mụn không viêm", "detail": "Nhiều sợi bã nhờn và mụn cám dưới da.", "angle": 90 },
    { "id": "mouth", "title": "Vùng Môi", "condition": "Bình thường", "detail": "Cần cấp ẩm và dưỡng môi đều đặn.", "angle": 150 },
    { "id": "jaw", "title": "Vùng Hàm", "condition": "Bình thường - Ổn định", "detail": "Nền da ổn định, không phát hiện ổ viêm lớn.", "angle": 210 }
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
      if (sections.jsonData) {
        const computed = computeDiagnosticMetrics({}, sections.jsonData);
        if (!sections.jsonData.metrics) sections.jsonData.metrics = computed.metrics;
        if (!sections.jsonData.averageScore) sections.jsonData.averageScore = computed.averageScore;
        if (!sections.jsonData.detectedIssues) sections.jsonData.detectedIssues = computed.detectedIssues;
      }
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

const DEFAULT_CLINICAL_GUIDELINE = `--- [Cơ sở Tri thức Y khoa & Bệnh học Da Liễu GlowSkin (Tích hợp medical_guidelines & skin_disease_knowledge_base)] ---
[1. BỆNH HỌC & ĐẶC ĐIỂM TỔN THƯƠNG THỰC THỂ (Skin Disease Knowledge Base)]:
- Trứng Cá (Acne): Viêm nang lông tuyến bã; tổn thương gồm mụn đầu đen, mụn đầu trắng, sẩn viêm đỏ, mụn mủ, bọc nang. Vị trí ưu tiên: trán, mũi, hai má, cằm.
- Tăng Sắc Tố Sau Viêm (PIH): Dát sắc tố nâu hoặc đỏ thẫm xuất hiện sau tổn thương mụn viêm hoặc cạy nặn. Phân loại theo thượng bì (nông, dễ đáp ứng) và trung bì (sâu, cần thời gian).
- Rám Má (Melasma): Dát tăng sắc tố màu nâu nhạt đến đen, đối xứng ở má, trán, sống mũi; nhạy cảm mạnh với tia cực tím UV.
- Viêm Nang Lông (Folliculitis): Sẩn nhỏ đỏ ở nang lông, có thể có vảy tiết hoặc mụn mủ nhỏ.
- Tổn thương thị giác AI nhận diện: dát, ban đỏ, sẩn, mụn mủ, mụn nước, bọng nước, vảy tiết, thâm nhiễm, tăng/giảm sắc tố, sẹo rỗ/lồi.

[2. PHÁC ĐỒ ĐIỀU TRỊ & HOẠT CHẤT CHUYÊN KHOA (Medical Guidelines)]:
- Kháng khuẩn & Viêm sưng: Benzoyl Peroxide 2.5% - 5%, Kháng sinh bôi thoa (Clindamycin, Erythromycin), BHA (Salicylic Acid) 1% - 2% làm sạch sâu cổ nang lông.
- Giảm sừng hóa & Mụn ẩn: Retinoids bôi ngoài da (Adapalene 0.1%, Tretinoin 0.025% - 0.05%), tẩy tế bào chết hóa học định kỳ.
- Mờ thâm & Sáng da: Azelaic Acid 15% - 20%, Niacinamide 4% - 10%, Vitamin C, Alpha Arbutin, Tranexamic Acid. Chống nắng SPF 50+ PA++++ phổ rộng mỗi ngày.
- Phục hồi hàng rào bảo vệ da: Ceramide, Hyaluronic Acid, Vitamin B5 (Panthenol), Centella Asiatica (Rau má). Tránh cồn khô và hương liệu nồng khi da nhạy cảm/viêm.`;

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // 1. Thử lấy Context tổng hợp từ Backend (đồng bộ cả medical_guidelines & skin_disease_knowledge_base)
    try {
      const unifiedRes = await fetch(`${API_URL}/skin/clinical-context?query=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      if (unifiedRes.ok) {
        const uData = await unifiedRes.json();
        if (uData.contextText) {
          clearTimeout(timeoutId);
          cachedMedicalContext = uData.contextText;
          return cachedMedicalContext;
        }
      }
    } catch {
      // Tiếp tục fallback bên dưới nếu endpoint chưa sẵn sàng
    }

    // 2. Fallback tìm kiếm theo endpoint /medical/search
    const searchRes = await fetch(`${API_URL}/medical/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    }).then((res) => (res.ok ? res.json() : { results: [] })).catch(() => ({ results: [] }));

    clearTimeout(timeoutId);

    if (searchRes.results && searchRes.results.length) {
      cachedMedicalContext = searchRes.results
        .slice(0, 4)
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

// Danh sách Model Gemini Native ổn định và tốc độ phản hồi cao
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];

function extractInlineData(imgStr) {
  if (!imgStr) return null;
  const match = imgStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return {
      inlineData: {
        mimeType: match[1],
        data: match[2],
      },
    };
  }
  return {
    inlineData: {
      mimeType: "image/jpeg",
      data: imgStr,
    },
  };
}

async function callGeminiNative(parts = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  let lastErrorMessage = "";

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
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

async function callOpenAI(messages) {
  // Chuyển đổi định dạng messages OpenAI sang Gemini Native API parts
  const parts = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      parts.push({ text: `[HƯỚNG DẪN HỆ THỐNG]:\n${msg.content}\n` });
    } else if (msg.role === "assistant") {
      parts.push({ text: `[BÁC SĨ CHUYÊN GIA AI]:\n${msg.content}\n` });
    } else if (msg.role === "user") {
      if (Array.isArray(msg.content)) {
        for (const item of msg.content) {
          if (item.type === "text") {
            parts.push({ text: item.text });
          } else if (item.type === "image_url" && item.image_url?.url) {
            const inline = extractInlineData(item.image_url.url);
            if (inline) parts.push(inline);
          }
        }
      } else if (typeof msg.content === "string") {
        parts.push({ text: msg.content });
      }
    }
  }
  return await callGeminiNative(parts);
}

function buildVisionMessages(chatHistory, imageDataUrl, medicalContext = "") {
  let promptText = SYSTEM_PROMPT;
  if (medicalContext) {
    promptText += `\n\nDƯỚI ĐÂY LÀ HƯỚNG DẪN CHẨN ĐOÁN VÀ ĐIỀU TRỊ CHUYÊN KHOA DA LIỄU (TÍCH HỢP TỪ MEDICAL GUIDELINES & SKIN DISEASE KNOWLEDGE BASE):\n${medicalContext}\n\nHãy căn cứ vào hướng dẫn Y khoa trên để đưa ra chẩn đoán và lời khuyên chuẩn xác nhất.`;
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
    fetchMedicalContext("mụn trứng cá viêm da thâm nám"),
  ]);

  // 1. Thử gọi qua Backend API /api/skin/analyze (đồng bộ cả 2 bộ CSDL Y khoa)
  try {
    const backendRes = await fetch(`${API_URL}/skin/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: optimizedImageDataUrl,
        surveyData: { skinType: "Da hỗn hợp" },
      }),
    });
    if (backendRes.ok) {
      const bData = await backendRes.json();
      if (bData.success && bData.content) {
        console.log("--> Phân tích da thành công qua Backend /api/skin/analyze (Medical Guidelines & Skin Diseases KB)");
        return { content: bData.content, isDemo: false };
      }
    }
  } catch (backendErr) {
    console.warn("Backend /api/skin/analyze không phản hồi, fallback Native Gemini API:", backendErr.message);
  }

  // 2. Fallback: Trực tiếp qua Google Gemini Native API ở Frontend
  const parts = [];
  let promptText = SYSTEM_PROMPT;
  if (medicalContext) {
    promptText += `\n\nDƯỚI ĐÂY LÀ HƯỚNG DẪN CHẨN ĐOÁN VÀ ĐIỀU TRỊ CHUYÊN KHOA DA LIỄU (TÍCH HỢP TỪ MEDICAL GUIDELINES & SKIN DISEASE KNOWLEDGE BASE):\n${medicalContext}\n\nHãy căn cứ vào hướng dẫn Y khoa trên để đưa ra chẩn đoán và lời khuyên chuẩn xác nhất.`;
  }
  parts.push({ text: promptText });
  parts.push({ text: "Hãy quan sát hình ảnh khuôn mặt thực tế của tôi và phân tích da chuẩn y khoa theo đúng quy định." });
  const inline = extractInlineData(optimizedImageDataUrl);
  if (inline) parts.push(inline);

  const content = await callGeminiNative(parts);
  return { content, isDemo: false };
}

export async function analyzeMultiAngleSkinImages({
  frontImage,
  leftImage,
  rightImage,
  surveyData = {},
  selectedProducts = []
}) {
  // 1. Tối ưu nén cả 3 ảnh trong suốt/jpeg để tối ưu tốc độ và không tràn bộ nhớ
  const [optFront, optLeft, optRight, medicalContext] = await Promise.all([
    frontImage ? compressImageIfNeeded(frontImage, 720, 0.72) : Promise.resolve(null),
    leftImage ? compressImageIfNeeded(leftImage, 720, 0.72) : Promise.resolve(null),
    rightImage ? compressImageIfNeeded(rightImage, 720, 0.72) : Promise.resolve(null),
    fetchMedicalContext(surveyData?.skinType ? `mụn trứng cá ${surveyData.skinType}` : "mụn trứng cá viêm da")
  ]);

  const optimizedImages = {
    front: optFront || frontImage || null,
    left: optLeft || leftImage || null,
    right: optRight || rightImage || null
  };

  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      content: DEMO_ANALYSIS,
      isDemo: true,
      optimizedImages
    };
  }

  // 1. Thử gọi qua Backend /api/skin/analyze trước
  try {
    const backendRes = await fetch(`${API_URL}/skin/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontImage: optFront,
        leftImage: optLeft,
        rightImage: optRight,
        surveyData,
        selectedProducts
      }),
    });
    if (backendRes.ok) {
      const bData = await backendRes.json();
      if (bData.success && bData.content) {
        console.log("--> Phân tích da 3 góc thành công qua Backend /api/skin/analyze!");
        return {
          content: bData.content,
          isDemo: false,
          optimizedImages
        };
      }
    }
  } catch (backendErr) {
    console.warn("Backend /api/skin/analyze không phản hồi, fallback Native Gemini API:", backendErr.message);
  }

  // 2. Fallback: Trực tiếp qua Google Gemini Native API ở Frontend
  let systemPromptText = SYSTEM_PROMPT;
  if (medicalContext) {
    systemPromptText += `\n\nDƯỚI ĐÂY LÀ HƯỚNG DẪN CHẨN ĐOÁN VÀ ĐIỀU TRỊ CHUYÊN KHOA DA LIỄU (TÍCH HỢP TỪ MEDICAL GUIDELINES & SKIN DISEASE KNOWLEDGE BASE):\n${medicalContext}\n\nHãy căn cứ vào hướng dẫn Y khoa trên để đưa ra chẩn đoán và lời khuyên chuẩn xác nhất.`;
  }

  let promptInstruction = `Bạn đang nhận được các bức ảnh chụp khuôn mặt thực tế của người dùng từ 3 góc khác nhau:\n`;
  if (optFront) promptInstruction += `- ẢNH 1 (Chính diện): Quan sát trán, mắt, mũi, nhân trung, môi và cằm.\n`;
  if (optLeft) promptInstruction += `- ẢNH 2 (Góc nghiêng trái): Quan sát má trái, quai hàm trái, thái dương trái.\n`;
  if (optRight) promptInstruction += `- ẢNH 3 (Góc nghiêng phải): Quan sát má phải, quai hàm phải, thái dương phải.\n`;

  promptInstruction += `\nThông tin người dùng khai báo trong khảo sát:
- Tự nhận định loại da: ${surveyData.skinType || "Da hỗn hợp"}
- Mức độ nhạy cảm: ${surveyData.skinSensitivity || "Bình thường"}
- Giới tính: ${surveyData.gender || "Không rõ"}
- Năm sinh: ${surveyData.birthDate || "Không rõ"}
- Ngân sách: ${surveyData.budget || "Phù hợp"}
- Đang mắc bệnh lý/điều trị: ${surveyData.hasMedicalCondition || "Không"}
- Đang dùng thuốc kê đơn: ${surveyData.hasPrescriptionMedication || "Không"}
- Đang dùng TPCN/vitamin/thảo dược: ${surveyData.hasSupplements || "Không"}
- Da mặt có hiện mạch máu (giãn mao mạch / mỏng đỏ): ${surveyData.hasBloodVessels || "Không"}
`;

  if (selectedProducts && selectedProducts.length > 0) {
    promptInstruction += `\nCác sản phẩm skincare người dùng đang sử dụng hiện tại:
${selectedProducts.map((p, idx) => `${idx + 1}. [${p.brand || "Brand"}] ${p.name} - ${p.category || ""}`).join("\n")}
-> Hãy đối chiếu và nhận xét chi tiết trong phần Routine & Ingredients xem những sản phẩm này CÓ THỰC SỰ PHÙ HỢP với các khuyết điểm quan sát được trên 3 góc ảnh không.`;
  }

  promptInstruction += `\n\nQUY ĐỊNH ĐÁNH GIÁ 6 CHỈ SỐ DA (THANG ĐIỂM 1-10) & ĐIỂM TRUNG BÌNH:
Dựa trên hình ảnh thật từ 3 góc mặt kết hợp chặt chẽ với dữ liệu khảo sát (loại da, độ nhạy cảm, tình trạng hiện mạch máu, bệnh lý/thuốc), bạn BẮT BUỘC trả về đầy đủ trong khối JSON_DATA:
1. "metrics": gồm 6 chỉ số da chuẩn y khoa:
   - "mun_viem" (Mụn viêm): điểm từ 1-10 và danh sách tọa độ points [{top: %, left: %}]
   - "mun_khong_viem" (Mụn không viêm): điểm từ 1-10 và points
   - "soi_ba_nhon" (Sợi bã nhờn): điểm từ 1-10 và points (ưu tiên vùng mũi, cằm)
   - "seo" (Sẹo): điểm từ 1-10 và points
   - "sac_to_da" (Sắc tố da): điểm từ 1-10 và points
   - "lo_chan_long" (Lỗ chân lông): điểm từ 1-10 và points
2. "averageScore": Trung bình cộng 6 chỉ số trên (làm tròn 1 chữ số thập phân, ví dụ: 6.7).
3. "detectedIssues": Danh sách 2 vấn đề có điểm thấp nhất (ví dụ: ["Lỗ chân lông", "Mụn không viêm"]).
Quan sát THỰC TẾ từng góc ảnh, không bịa đặt tổn thương nếu da sạch. Đưa ra chẩn đoán Y khoa trung thực 100% kèm khối JSON_DATA theo đúng quy chuẩn.`;

  const parts = [
    { text: systemPromptText },
    { text: promptInstruction }
  ];

  if (optFront) {
    parts.push({ text: "📸 ẢNH 1: GÓC CHÍNH DIỆN" });
    const p = extractInlineData(optFront);
    if (p) parts.push(p);
  }
  if (optLeft) {
    parts.push({ text: "📸 ẢNH 2: GÓC NGHIÊNG TRÁI" });
    const p = extractInlineData(optLeft);
    if (p) parts.push(p);
  }
  if (optRight) {
    parts.push({ text: "📸 ẢNH 3: GÓC NGHIÊNG PHẢI" });
    const p = extractInlineData(optRight);
    if (p) parts.push(p);
  }

  try {
    const content = await callGeminiNative(parts);
    return {
      content,
      isDemo: false,
      optimizedImages
    };
  } catch (err) {
    console.warn("Lỗi gọi Gemini AI Vision 3 góc, kích hoạt phân tích dự phòng:", err.message);
    return {
      content: DEMO_ANALYSIS,
      isDemo: true,
      optimizedImages,
      error: err.message
    };
  }
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

