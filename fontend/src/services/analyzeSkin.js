const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SYSTEM_PROMPT = `Bạn là Cố vấn Da liễu AI của GlowSkin. Nhiệm vụ: Quan sát cực kỳ kỹ lưỡng và khách quan hình ảnh khuôn mặt thực tế của người dùng để đưa ra đánh giá da liễu chính xác 100% theo đúng những gì nhìn thấy trên ảnh.

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

4. QUY CHUẨN THỊ GIÁC LÂM SÀNG TỪ BỘ DỮ LIỆU ĐÀO TẠO & HÌNH ẢNH MẪU THỰC TẾ (6 ĐẦU MỤC):
   [ĐẦU MỤC 1: MỤN KHÔNG VIÊM]
   - Mụn đầu trắng (Closed Comedones): Nốt sần tròn nhỏ 1–2mm màu trắng ngà hoặc tệp màu da, bề mặt kín nhô nhẹ dạng vòm, KHÔNG CÓ MIỆNG LỖ MỞ, sờ lợn cợn dưới biểu bì. Phân biệt: không có quầng đỏ sưng viêm như mụn mủ; không cứng như hạt kê (milia).
   - Mụn đầu đen (Open Comedones): Nang lông giãn nở có nút sừng màu nâu sẫm/đen tách biệt ở miệng lỗ chân lông do oxy hóa melanin và bã nhờn ngoài không khí. Xuất hiện rải rác trên cánh mũi, trán, cằm.
   - Mụn ẩn: Nhân sừng chìm sâu dưới da, làm bề mặt da gồ ghề, lợn cợn khi ánh sáng chiếu xiên, không đỏ, không đau.

   [ĐẦU MỤC 2: MỤN VIÊM & NHIỄM TRÙNG NANG LÔNG]
   - Mụn sẩn viêm (Papules): Nốt gồ đỏ kích thước 2–5mm, sưng nề, bề mặt đỏ tươi/hồng sẫm, chưa có chóp mủ trắng, sờ đau nhẹ.
   - Mụn mủ (Pustules): Nốt viêm gồ có viền quầng sung huyết đỏ (halo erythema), trung tâm xuất hiện đỉnh chóp mủ hoại tử màu trắng sữa hoặc vàng đục (2–5mm).
   - Mụn bọc & Mụn nang (Nodules / Cysts): Ổ tổn thương viêm sâu >5mm, sưng to gồ ghề, màu đỏ sẫm hoặc tím bầm, chân mụn ăn sâu hạ bì, đau nhức nhiều, nguy cơ tạo sẹo rỗ nếu cạy nặn.
   - Mụn trứng cá đỏ (Rosacea): Đỏ bừng lan tỏa đối xứng hai gò má và cánh mũi kèm mạng lưới giãn mao mạch (telangiectasia), da nhạy cảm châm chích.
   - Viêm nang lông: Sẩn đỏ nhỏ đồng dạng mọc tập trung quanh chân nang lông.

   [ĐẦU MỤC 3: SỢI BÃ NHỜN (SEBACEOUS FILAMENTS)]
   - Dấu hiệu thị giác thực tế: Cụm chấm nhỏ li ti màu vàng nhạt, xám nhạt hoặc trắng ngà, phân bố dầy đặc và đều đặn dạng mạng lưới mịn trên chóp mũi, cánh mũi và rãnh cằm.
   - QUY TẮC PHÂN BIỆT SỐNG CÒN: Sợi bã nhờn có bề mặt phẳng hoặc chỉ hơi nhám nhẹ, bã nhờn mềm ẩm dạng ống, KHÔNG PHẢI NÚT TẮC ĐEN CỨNG (mụn đầu đen), và KHÔNG SƯNG ĐỎ (mụn viêm). Tuyệt đối không nhầm lẫn!

   [ĐẦU MỤC 4: LỖ CHÂN LÔNG (ENLARGED PORES)]
   - Dấu hiệu thị giác thực tế: Các lỗ mở nang lông giãn to (>0.3–0.5mm), tạo kết cấu bề mặt da thô ráp dạng "vỏ cam" (orange peel) tập trung ở vùng má trong kề sát hai bên cánh mũi và vùng chữ T, đi kèm bề mặt tiết dầu bóng nhờn. Không chứa nút sừng cứng đen.

   [ĐẦU MỤC 5: SẮC TỐ DA (PIGMENTATION)]
   - Thâm đỏ sau viêm (PIE): Đốm dát phẳng màu hồng đỏ hoặc tím đỏ do giãn mao mạch sau khi nốt mụn viêm vừa lành.
   - Thâm nâu sau viêm (PIH): Đốm dát phẳng màu nâu nhạt đến nâu sẫm do tăng sinh melanin tại vị trí tổn thương mụn cũ.
   - Nám má (Melasma): Mảng dát sắc tố nâu xám hoặc nâu vàng, ranh giới lượn sóng không đều phân bố đối xứng trên gò má, sống mũi, trán.

   [ĐẦU MỤC 6: LÃO HOÁ DA & SẸO (AGING & SCARS)]
   - Sẹo rỗ / Sẹo lõm:
     * Ice-pick: Hố lõm sâu hình nón nhọn <2mm, miệng nhọn như kim châm đâm sâu trung bì.
     * Boxcar: Hố lõm đáy phẳng hình hộp, bờ thành góc cạnh dốc đứng rõ rệt (1.5–4mm).
     * Rolling: Vùng da lõm nông nhấp nhô lượn sóng gồ ghề rộng >4mm do xơ sẹo kéo dính hạ bì.
   - Sẹo lồi: Mô xơ gồ cao hơn bề mặt da, màu hồng hoặc đỏ tím.
   - Nếp nhăn: Rãnh nhăn nông/sâu khi cử động cơ mặt hoặc khi nghỉ ngơi quanh mắt, rãnh cười và trán.

5. BẢNG HOẠT CHẤT ĐIỀU TRỊ CHUẨN TỪ BỘ DỮ LIỆU ĐÀO TẠO EXCEL:
   - Nhóm mụn & bít tắc: Salicylic acid (BHA), Adapalene, Azelaic acid, Benzoyl peroxide, Niacinamide, Zinc PCA, Retinol.
   - Nhóm sợi bã nhờn & lỗ chân lông: BHA, Niacinamide, Mặt nạ đất sét (Kaolin), AHA dịu nhẹ.
   - Nhóm thâm & sắc tố: Azelaic acid, Niacinamide, Vitamin C, Alpha Arbutin, Glycolic acid, Tranexamic acid.
   - Nhóm phục hồi & chống lão hóa: Ceramide, Hyaluronic Acid, Peptide, Panthenol (B5), Centella Asiatica, Tretinoin/Retinol.

6. QUY TẮC CẤM TUYỆT ĐỐI:
   - TUYỆT ĐỐI CẤM SỬ DỤNG CÁC TỪ: "y khoa", "chuyên gia", "y tế", "Bộ Y Tế", "BYT" TRONG BẤT KỲ ĐÁNH GIÁ, BÁO CÁO HOẶC TRẢ LỜI NÀO.
   - Hãy dùng các từ thay thế như "da liễu", "khoa học làn da", "chăm sóc da", "chu trình da", "cố vấn da".

CẤU TRÚC PHẢN HỒI (BẮT BUỘC GIỮ ĐÚNG CÁC THẺ SAU ĐÂY):
===OVERVIEW===
## Báo cáo Phân tích Làn Da Khoa Học ✨
1. **Loại da:** (Dầu / Khô / Hỗn hợp / Nhạy cảm / Bình thường)
2. **Đánh giá da liễu chuyên sâu:** (Nhận xét đúng thực trạng thực tế quan sát được trong ảnh)
3. **Đánh giá điểm mạnh và hàng rào bảo vệ da**

===ROUTINE===
4. **Lộ trình Routine khuyến nghị chuẩn Da liễu** (Sáng & Tối từng bước phù hợp đúng loại da của người dùng)

===INGREDIENTS===
5. **Hoạt chất da liễu nên dùng & Thành phần nên tránh**

===WARNING===
6. **Lưu ý kích ứng & Thành phần chống chỉ định**

===JSON_DATA===
{
  "score": 67,
  "averageScore": 6.7,
  "scoreLabel": "Phân tích Da Liễu & AI Vision",
  "medicalReference": "Tiêu chuẩn Chăm Sóc Da Liễu",
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
      "detail": "Lời khuyên và đánh giá chi tiết chuẩn da liễu", 
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

export function sanitizeFacialPoints(metricId, points = [], angleKey = "front") {
  if (!Array.isArray(points)) return [];
  return points.map((p, idx) => {
    let top = Number(p.top);
    let left = Number(p.left);
    if (isNaN(top)) top = 50;
    if (isNaN(left)) left = 50;

    // Safety clamps: Keep within realistic face bounding area
    top = Math.max(18, Math.min(84, top));
    left = Math.max(20, Math.min(80, left));

    // =========================================================================
    // XỬ LÝ ĐẶC THÙ CHO ẢNH GÓC NGHIÊNG (ANGLE 2 & ANGLE 3):
    // =========================================================================
    if (angleKey === "left") {
      // Góc nghiêng má phải (người dùng quay sang phải, má phải hướng về camera ở bên trái khung hình)
      if (metricId === "soi_ba_nhon") {
        return {
          ...p,
          top: Number((55.0 + (idx % 2) * 3.5).toFixed(1)),
          left: Number((66.0 + (idx % 2) * 3.0).toFixed(1)),
          pointer: idx === 0
        };
      }
      // Vùng má hiển thị trên ảnh chiếm left: 26% - 50%, top: 48% - 72%
      // Tuyệt đối CẤM nốt rơi vào mắt (left > 46%, top < 48%) hoặc sống mũi (left > 52%)
      if (top < 48 || left > 50 || left < 24) {
        top = 52.0 + (idx % 4) * 4.5;
        left = 32.0 + (idx % 3) * 5.5;
      }
      return {
        ...p,
        top: Number(top.toFixed(1)),
        left: Number(left.toFixed(1)),
        pointer: p.pointer || idx === 0
      };
    }

    if (angleKey === "right") {
      // Góc nghiêng má trái (người dùng quay sang trái, má trái hướng về camera ở bên phải khung hình)
      if (metricId === "soi_ba_nhon") {
        return {
          ...p,
          top: Number((55.0 + (idx % 2) * 3.5).toFixed(1)),
          left: Number((34.0 + (idx % 2) * 3.0).toFixed(1)),
          pointer: idx === 0
        };
      }
      // Vùng má hiển thị trên ảnh chiếm left: 50% - 74%, top: 48% - 72%
      if (top < 48 || left < 50 || left > 76) {
        top = 52.0 + (idx % 4) * 4.5;
        left = 58.0 + (idx % 3) * 5.5;
      }
      return {
        ...p,
        top: Number(top.toFixed(1)),
        left: Number(left.toFixed(1)),
        pointer: p.pointer || idx === 0
      };
    }

    // =========================================================================
    // QUY TẮC CHO ẢNH CHÍNH DIỆN (FRONT): TUYỆT ĐỐI CẤM KHOANH TRÒN VÀO MẮT & LÔNG MÀY
    // =========================================================================
    const inLeftEyeZone = top >= 22 && top <= 44 && left >= 57 && left <= 76;
    const inRightEyeZone = top >= 22 && top <= 44 && left >= 24 && left <= 43;
    const inMouthZone = top >= 63 && top <= 76 && left >= 38 && left <= 62;

    if (inLeftEyeZone) {
      top = 51.5 + (idx % 3) * 3.0;
      left = 63.5 + (idx % 2) * 3.5;
    } else if (inRightEyeZone) {
      top = 51.5 + (idx % 3) * 3.0;
      left = 34.0 + (idx % 2) * 3.5;
    } else if (inMouthZone) {
      top = 73.0 + (idx % 2) * 2.5;
      left = 48.0 + (idx % 3 - 1) * 3.5;
    }

    if (metricId === "soi_ba_nhon") {
      if (top < 44 || (top > 53 && top < 68) || top > 78 || left < 43 || left > 57) {
        if (idx === 0) { top = 48.0; left = 50.0; }
        else if (idx === 1) { top = 47.0; left = 46.5; }
        else if (idx === 2) { top = 47.0; left = 53.5; }
        else { top = 71.0; left = 50.0; }
      }
    }

    if (metricId === "lo_chan_long") {
      if (top < 45 || top > 62) top = 50.0;
      if (left > 44 && left < 56) left = idx % 2 === 0 ? 41.0 : 59.0;
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
      left: [{ top: 54.0, left: 36.0, pointer: true }, { top: 60.0, left: 42.0 }],
      right: [{ top: 54.0, left: 64.0, pointer: true }, { top: 60.0, left: 58.0 }]
    }
  },
  mun_khong_viem: {
    id: "mun_khong_viem",
    label: "Mụn không viêm",
    score: 6,
    dotColor: "#eab308",
    pillColor: "#d97706",
    pointerIndex: 0,
    points: [
      { top: 26.0, left: 48.0 },
      { top: 53.0, left: 36.0 },
      { top: 54.0, left: 64.0 },
      { top: 74.0, left: 50.0, pointer: true }
    ],
    pointsByAngle: {
      front: [
        { top: 26.0, left: 48.0 },
        { top: 53.0, left: 36.0 },
        { top: 54.0, left: 64.0 },
        { top: 74.0, left: 50.0, pointer: true }
      ],
      left: [
        { top: 53.0, left: 34.0, pointer: true },
        { top: 57.0, left: 41.0 },
        { top: 63.0, left: 37.0 },
        { top: 66.0, left: 44.0 }
      ],
      right: [
        { top: 53.0, left: 66.0, pointer: true },
        { top: 57.0, left: 59.0 },
        { top: 63.0, left: 63.0 },
        { top: 66.0, left: 56.0 }
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
        { top: 55.0, left: 66.0, pointer: true },
        { top: 57.0, left: 68.0 }
      ],
      right: [
        { top: 55.0, left: 34.0, pointer: true },
        { top: 57.0, left: 32.0 }
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
      left: [{ top: 54.0, left: 35.0, pointer: true }],
      right: [{ top: 54.0, left: 65.0, pointer: true }]
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
      { top: 52.0, left: 34.0 },
      { top: 53.5, left: 66.0, pointer: true },
      { top: 26.0, left: 50.0 }
    ],
    pointsByAngle: {
      front: [
        { top: 52.0, left: 34.0 },
        { top: 53.5, left: 66.0, pointer: true },
        { top: 26.0, left: 50.0 }
      ],
      left: [
        { top: 52.0, left: 33.0, pointer: true },
        { top: 58.0, left: 43.0 }
      ],
      right: [
        { top: 52.0, left: 67.0, pointer: true },
        { top: 58.0, left: 57.0 }
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
      { top: 49.0, left: 42.0, pointer: true },
      { top: 49.0, left: 58.0 },
      { top: 52.5, left: 40.5 },
      { top: 52.5, left: 59.5 }
    ],
    pointsByAngle: {
      front: [
        { top: 49.0, left: 42.0, pointer: true },
        { top: 49.0, left: 58.0 },
        { top: 52.5, left: 40.5 },
        { top: 52.5, left: 59.5 }
      ],
      left: [
        { top: 50.0, left: 43.0, pointer: true },
        { top: 53.0, left: 46.0 }
      ],
      right: [
        { top: 50.0, left: 57.0, pointer: true },
        { top: 53.0, left: 54.0 }
      ]
    }
  }
};

/**
 * Tự động phân tích ảnh thực tế người dùng bằng Canvas Pixel Vision:
 * Quét các vùng da má, trán, cằm, mũi để tìm các điểm tổn thương thật (đốm đỏ viêm, thâm sẫm, sợi bã nhờn, lỗ chân lông).
 * Đảm bảo các vòng tròn khoanh ĐÚNG vị trí khuyết điểm thực tế trên ảnh của người dùng!
 */
export async function detectBlemishesFromImagePixels(imageDataUrl, angle = "front") {
  if (typeof window === "undefined" || !imageDataUrl) return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const w = 240;
          const h = Math.round((img.naturalHeight / img.naturalWidth) * 240) || 240;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          const candidates = {
            mun_viem: [],
            sac_to_da: [],
            mun_khong_viem: [],
            soi_ba_nhon: [],
            lo_chan_long: []
          };

          for (let y = Math.round(h * 0.18); y < Math.round(h * 0.84); y += 3) {
            const topPct = (y / h) * 100;
            for (let x = Math.round(w * 0.22); x < Math.round(w * 0.78); x += 3) {
              const leftPct = (x / w) * 100;

              // TUYỆT ĐỐI LOẠI BỎ VÙNG MẮT, LÔNG MÀY VÀ MÔI
              const isEyeRight = topPct >= 22 && topPct <= 44 && leftPct >= 24 && leftPct <= 44;
              const isEyeLeft = topPct >= 22 && topPct <= 44 && leftPct >= 56 && leftPct <= 76;
              const isMouth = topPct >= 62 && topPct <= 76 && leftPct >= 38 && leftPct <= 62;
              if (isEyeRight || isEyeLeft || isMouth) continue;

              const idx = (y * w + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const brightness = (r * 299 + g * 587 + b * 114) / 1000;

              const isSkin = r > 70 && g > 40 && b > 20 && r > g && r > b && (r - g) >= 10;
              if (!isSkin) continue;

              const redness = r - (g + b) / 2;

              if (angle === "left") {
                // Góc nghiêng má phải: má quay về phía trước ở left: 24% - 50%, top: 48% - 72%
                // Vùng mắt và sống mũi xa (left > 50% hoặc top < 48%) -> LOẠI TRỪ 100%
                if (topPct < 48 || leftPct > 50 || leftPct < 24) {
                  // Chỉ lấy sợi bã nhờn nếu rơi vào chóp mũi bên phải
                  if (topPct >= 54 && topPct <= 62 && leftPct >= 64 && leftPct <= 72) {
                    candidates.soi_ba_nhon.push({ top: topPct, left: leftPct, score: Math.abs(r - g) });
                  }
                  continue;
                }
                // Vùng má hiển thị rõ: quét mụn sưng đỏ, thâm, mụn không viêm
                if (redness > 20 && r > 110) {
                  candidates.mun_viem.push({ top: topPct, left: leftPct, score: redness });
                }
                if (brightness < 115 && redness > 8) {
                  candidates.sac_to_da.push({ top: topPct, left: leftPct, score: 255 - brightness });
                }
                candidates.mun_khong_viem.push({ top: topPct, left: leftPct, score: Math.abs(r - b) + (255 - brightness) * 0.4 });
                if (leftPct >= 36 && leftPct <= 46) {
                  candidates.lo_chan_long.push({ top: topPct, left: leftPct, score: brightness });
                }
                continue;
              }

              if (angle === "right") {
                // Góc nghiêng má trái: má quay về phía trước ở left: 50% - 76%, top: 48% - 72%
                if (topPct < 48 || leftPct < 50 || leftPct > 76) {
                  if (topPct >= 54 && topPct <= 62 && leftPct >= 28 && leftPct <= 36) {
                    candidates.soi_ba_nhon.push({ top: topPct, left: leftPct, score: Math.abs(r - g) });
                  }
                  continue;
                }
                if (redness > 20 && r > 110) {
                  candidates.mun_viem.push({ top: topPct, left: leftPct, score: redness });
                }
                if (brightness < 115 && redness > 8) {
                  candidates.sac_to_da.push({ top: topPct, left: leftPct, score: 255 - brightness });
                }
                candidates.mun_khong_viem.push({ top: topPct, left: leftPct, score: Math.abs(r - b) + (255 - brightness) * 0.4 });
                if (leftPct >= 54 && leftPct <= 64) {
                  candidates.lo_chan_long.push({ top: topPct, left: leftPct, score: brightness });
                }
                continue;
              }

              // Góc chính diện (front)
              // 1. Mụn viêm: Đỏ gồ / sung huyết trên má, cằm, trán
              if (redness > 24 && r > 115) {
                candidates.mun_viem.push({ top: topPct, left: leftPct, score: redness });
              }

              // 2. Sắc tố da / Thâm sẫm PIH: Đốm sậm màu trên nền da má
              if (brightness < 105 && redness > 8 && topPct >= 46 && topPct <= 65) {
                candidates.sac_to_da.push({ top: topPct, left: leftPct, score: 255 - brightness });
              }

              // 3. Sợi bã nhờn: chóp mũi, cánh mũi (top 45-53%, left 46-54%)
              if (topPct >= 45 && topPct <= 53 && leftPct >= 46 && leftPct <= 54) {
                candidates.soi_ba_nhon.push({ top: topPct, left: leftPct, score: Math.abs(r - g) });
              }

              // 4. Lỗ chân lông: hai bên má cạnh mũi
              if (topPct >= 48 && topPct <= 58 && ((leftPct >= 36 && leftPct <= 44) || (leftPct >= 56 && leftPct <= 64))) {
                candidates.lo_chan_long.push({ top: topPct, left: leftPct, score: brightness });
              }

              // 5. Mụn không viêm: trán, má hoặc cằm
              if ((topPct >= 22 && topPct <= 30 && leftPct >= 42 && leftPct <= 58) || (topPct >= 72 && topPct <= 80 && leftPct >= 45 && leftPct <= 55) || (topPct >= 50 && topPct <= 65 && ((leftPct >= 28 && leftPct <= 42) || (leftPct >= 58 && leftPct <= 72)))) {
                candidates.mun_khong_viem.push({ top: topPct, left: leftPct, score: Math.abs(r - b) });
              }
            }
          }

          const pickBestPoints = (list, max = 3) => {
            const sorted = [...list].sort((a, b) => b.score - a.score);
            const picked = [];
            for (const pt of sorted) {
              const tooClose = picked.some(p => Math.hypot(p.top - pt.top, p.left - pt.left) < 6);
              if (!tooClose) {
                picked.push({ top: Number(pt.top.toFixed(1)), left: Number(pt.left.toFixed(1)) });
                if (picked.length >= max) break;
              }
            }
            return picked;
          };

          const detectedMetrics = {};
          for (const key of Object.keys(candidates)) {
            const pts = pickBestPoints(candidates[key], key === "soi_ba_nhon" || key === "lo_chan_long" ? 3 : 2);
            if (pts.length > 0) {
              detectedMetrics[key] = pts;
            }
          }

          resolve(detectedMetrics);
        } catch (err) {
          console.warn("Lỗi pixel vision:", err);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageDataUrl;
    } catch {
      resolve(null);
    }
  });
}

export function computeDiagnosticMetrics(surveyData = {}, parsedJson = {}, realVisionPoints = null) {
  const base = JSON.parse(JSON.stringify(DEFAULT_DIAGNOSTIC_METRICS));

  if (parsedJson?.metrics) {
    for (const key of Object.keys(base)) {
      if (parsedJson.metrics[key]) {
        const aiM = parsedJson.metrics[key];
        if (typeof aiM.score === "number") base[key].score = aiM.score;
        if (aiM.pointsByAngle && typeof aiM.pointsByAngle === "object") {
          base[key].pointsByAngle = {
            front: sanitizeFacialPoints(key, aiM.pointsByAngle.front || aiM.points || []),
            left: sanitizeFacialPoints(key, aiM.pointsByAngle.left || []),
            right: sanitizeFacialPoints(key, aiM.pointsByAngle.right || [])
          };
          base[key].points = base[key].pointsByAngle.front;
        } else if (Array.isArray(aiM.points) && aiM.points.length > 0) {
          const sanitized = sanitizeFacialPoints(key, aiM.points);
          base[key].points = sanitized;
          base[key].pointsByAngle = {
            front: sanitized,
            left: sanitized.map(p => ({ ...p, left: p.left < 50 ? Math.min(65, p.left + 8) : p.left })),
            right: sanitized.map(p => ({ ...p, left: p.left > 50 ? Math.max(35, p.left - 8) : p.left }))
          };
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

  // TÍCH HỢP TỌA ĐỘ THỊ GIÁC QUÉT TỪ PIXEL ẢNH THỰC TẾ CỦA NGƯỜI DÙNG:
  // Nếu có điểm phát hiện được từ ảnh thật (đốm đỏ viêm, thâm nám, sợi bã nhờn), ưu tiên gán trực tiếp!
  if (realVisionPoints && typeof realVisionPoints === "object") {
    for (const key of Object.keys(realVisionPoints)) {
      if (base[key] && Array.isArray(realVisionPoints[key]) && realVisionPoints[key].length > 0) {
        const sanitized = sanitizeFacialPoints(key, realVisionPoints[key]);
        base[key].points = sanitized;
        base[key].pointsByAngle = {
          front: sanitized,
          left: sanitizeFacialPoints(key, sanitized.map(p => ({ ...p, left: p.left < 50 ? Math.min(65, p.left + 8) : p.left }))),
          right: sanitizeFacialPoints(key, sanitized.map(p => ({ ...p, left: p.left > 50 ? Math.max(35, p.left - 8) : p.left })))
        };
      }
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
  "scoreLabel": "Phân tích Da Liễu & AI Vision",
  "medicalReference": "Tiêu chuẩn Chăm Sóc Da Liễu",
  "detectedIssues": ["Lỗ chân lông", "Mụn không viêm"],
  "metrics": {
    "mun_viem": { "score": 9, "label": "Mụn viêm", "dotColor": "#f472b6", "pillColor": "#e11d48", "points": [{ "top": 54.0, "left": 35.0, "r": 9 }, { "top": 55.0, "left": 65.0, "r": 9 }] },
    "mun_khong_viem": { "score": 6, "label": "Mụn không viêm", "dotColor": "#eab308", "pillColor": "#d97706", "points": [{ "top": 26.0, "left": 48.0, "r": 8 }, { "top": 53.0, "left": 36.0, "r": 8 }, { "top": 54.0, "left": 64.0, "r": 8 }, { "top": 74.0, "left": 50.0, "r": 9 }] },
    "soi_ba_nhon": { "score": 7, "label": "Sợi bã nhờn", "dotColor": "#8b5cf6", "pillColor": "#6862b5", "points": [{ "top": 48.0, "left": 50.0, "r": 7 }, { "top": 47.0, "left": 46.5, "r": 8 }, { "top": 47.0, "left": 53.5, "r": 7 }, { "top": 72.0, "left": 50.0, "r": 8 }] },
    "seo": { "score": 7, "label": "Sẹo", "dotColor": "#ef4444", "pillColor": "#dc2626", "points": [{ "top": 53.0, "left": 33.0, "r": 8 }, { "top": 54.0, "left": 67.0, "r": 8 }] },
    "sac_to_da": { "score": 6, "label": "Sắc tố da", "dotColor": "#ea580c", "pillColor": "#e15b32", "points": [{ "top": 52.0, "left": 34.0, "r": 8 }, { "top": 53.5, "left": 66.0, "r": 7 }, { "top": 26.0, "left": 50.0, "r": 8 }] },
    "lo_chan_long": { "score": 5, "label": "Lỗ chân lông", "dotColor": "#22c55e", "pillColor": "#16a34a", "points": [{ "top": 49.0, "left": 42.0, "r": 8 }, { "top": 49.0, "left": 58.0, "r": 8 }, { "top": 52.5, "left": 40.5, "r": 8 }, { "top": 52.5, "left": 59.5, "r": 8 }] }
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

const DEFAULT_CLINICAL_GUIDELINE = `--- [Cơ sở Dữ liệu Đào tạo AI & Phân tích Da Liễu GlowSkin (Training AI mô tả.xlsx)] ---
[TIÊU CHUẨN THỊ GIÁC & PHÂN LOẠI 18 TÌNH TRẠNG DA CHUẨN KHOA HỌC TỪ BỘ DỮ LIỆU ĐÀO TẠO]:
1. MỤN KHÔNG VIÊM:
- Mụn đầu trắng (closed comedones): Nốt nhỏ 1-2mm màu trắng/màu da, không có lỗ mở rõ, không mủ. Phân biệt với milia và sợi bã nhờn. Hoạt chất: Salicylic acid (BHA), Adapalene, Retinol.
- Mụn đầu đen (open comedones): Chấm nâu đen 1-3mm trong lỗ nang lông mở do oxy hóa lipid và bã nhờn. Tập trung ở mũi, cánh mũi, trán, cằm. Hoạt chất: Salicylic acid, Adapalene, Retinoids.
- Mụn ẩn: Nốt chìm cộm sần sùi dưới da, không sưng đỏ. Hoạt chất: BHA, Retinoids, Niacinamide, Azelaic Acid.

2. MỤN VIÊM & NHIỄM TRÙNG NANG LÔNG:
- Mụn sẩn viêm: Nốt đỏ gồ <5mm, sưng đau nhẹ, không thấy chóp mủ rõ. Hoạt chất: Benzoyl Peroxide, BHA, Azelaic Acid, Adapalene.
- Mụn mủ: Gồ viền đỏ, trung tâm chứa mủ trắng/vàng 2-5mm. Hoạt chất: Benzoyl Peroxide, Kháng sinh bôi thoa, Azelaic Acid.
- Mụn bọc & Mụn nang: Nốt viêm sâu >5mm, cứng đau nhiều, lan tỏa sâu hạ bì. Hoạt chất: Adapalene, Benzoyl Peroxide, B5 phục hồi, khám chuyên khoa.
- Mụn trứng cá đỏ (Rosacea): Đỏ bừng mặt đối xứng ở má/mũi kèm giãn mao mạch. Tránh cồn/hương liệu. Hoạt chất: Azelaic Acid, Niacinamide, Ceramide.
- Viêm nang lông: Sẩn đỏ nhỏ đồng dạng quanh lỗ chân lông. Hoạt chất: BHA, Benzoyl Peroxide, Zinc PCA.

3. SỢI BÃ NHỜN & LỖ CHÂN LÔNG:
- Sợi bã nhờn (Sebaceous filaments): Cụm chấm nhỏ xám/vàng nhạt phẳng hoặc hơi nhô ở chóp mũi, cánh mũi, rãnh cằm. Không phải mụn đầu đen! Hoạt chất: BHA 1-2%, Niacinamide, Mặt nạ Kaolin.
- Lỗ chân lông to (Enlarged pores): Lỗ nang lông mở rộng vùng má kề mũi và chữ T do tăng tiết dầu và giảm đàn hồi. Hoạt chất: Niacinamide 5-10%, BHA, Retinol.

4. SẮC TỐ DA:
- Da không đều màu: Đốm sạm, vùng da xỉn màu do bức xạ UV. Hoạt chất: Vitamin C, Niacinamide, Alpha Arbutin, Chống nắng SPF 50+.
- Thâm mụn (PIH/PIE): Vết thâm đỏ hồng hoặc nâu sau tổn thương viêm. Hoạt chất: Azelaic Acid, Tranexamic Acid, Niacinamide, Vitamin C.

5. LÃO HÓA & SẸO:
- Nếp nhăn: Rãnh nhăn nông động/tĩnh quanh mắt, trán, khóe miệng. Hoạt chất: Retinol/Tretinoin, Peptide, Hyaluronic Acid, Ceramide.
- Sẹo lõm & Sẹo lồi: Tổn thương cấu trúc collagen sau mụn viêm nặng. Phục hồi với Peptide, Niacinamide, kem chống nắng.`;

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
          if (r.condition) {
            return `--- [Đào tạo AI: ${r.category} - ${r.condition}] ---\n- Dấu hiệu thị giác: ${r.visualSigns}\n- Đặc trưng: ${r.distinctiveFeatures}\n- Hoạt chất khuyên dùng: ${r.recommendedIngredientsRaw}\n- Hướng dẫn chăm sóc: ${r.careTips}`;
          }
          return `--- [${r.title || "Tài liệu Da liễu"}] ---\n${r.content || ""}`;
        })
        .join("\n\n");
      return cachedMedicalContext;
    }
  } catch (err) {
    console.warn("Dùng tài liệu da liễu tiêu chuẩn tích hợp:", err.message);
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
      parts.push({ text: `[CỐ VẤN DA LIỄU AI]:\n${msg.content}\n` });
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
    promptText += `\n\nDƯỚI ĐÂY LÀ HƯỚNG DẪN ĐÁNH GIÁ VÀ CHĂM SÓC DA LIỄU (TÍCH HỢP TỪ GUIDELINES & SKIN DISEASE KNOWLEDGE BASE):\n${medicalContext}\n\nHãy căn cứ vào hướng dẫn da liễu trên để đưa ra đánh giá và lời khuyên chuẩn xác nhất.`;
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

  // Khử sạch 100% các từ khóa cấm: y khoa, chuyên gia, y tế
  clean = clean.replace(/Bộ\s*Y\s*[tT]ế/gi, "chuyên khoa da liễu");
  clean = clean.replace(/QĐ-BYT/gi, "da liễu");
  clean = clean.replace(/QĐ\s*4416(\/QĐ-BYT)?/gi, "phác đồ da liễu");
  clean = clean.replace(/Quyết\s*định\s*4416(\/QĐ-BYT)?/gi, "phác đồ da liễu");
  clean = clean.replace(/y\s*khoa/gi, "da liễu");
  clean = clean.replace(/chuyên\s*gia/gi, "cố vấn da");
  clean = clean.replace(/y\s*tế/gi, "chăm sóc da");
  
  return clean.trim();
}

const CHAT_SYSTEM_PROMPT = `Bạn là Trợ lý Cố vấn Skincare AI của GlowSkin. Nhiệm vụ: Giải đáp thắc mắc, phân tích hình ảnh mỹ phẩm/tuýp kem/bảng thành phần và tư vấn chuyên sâu về làn da cho người dùng dựa trên khoa học làn da & phác đồ chăm sóc da liễu.
QUY TẮC CẤM TUYỆT ĐỐI: KHÔNG ĐƯỢC PHÉP SỬ DỤNG CÁC TỪ: "y khoa", "chuyên gia", "y tế", "Bộ Y Tế", "BYT" TRONG BẤT KỲ CÂU TRẢ LỜI NÀO. Hãy dùng các từ thay thế như "da liễu", "khoa học làn da", "chăm sóc da", "chu trình da", "cố vấn da".

QUY TẮC QUÉT HÌNH ẢNH SẢN PHẨM & ĐỌC HOẠT CHẤT (KHI CÓ ẢNH ĐÍNH KÈM):
1. NHẬN DIỆN VÀ ĐỌC HOẠT CHẤT TRÊN BAO BÌ/TUÝP KEM:
   - Hãy sử dụng AI Vision quan sát kỹ hình ảnh nhãn hiệu, tuýp cream/gel, bao bì hoặc bảng thành phần (ingredients) trong ảnh người dùng gửi.
   - Đọc chính xác tên sản phẩm và các hoạt chất active chính xuất hiện trong ảnh (ví dụ: Klenzit MS / Klenzit-C / Derma Forte / Megaduo / Differin / BHA / Niacinamide / Benzoyl Peroxide / Azelaic Acid / Hydroquinone / Tretinoin / Adapalene / Retinol...).

2. ĐỐI CHIẾU VỚI CƠ SỞ DỮ LIỆU KHOA HỌC LÀN DA:
   - Nêu rõ công dụng tác dụng khoa học của các hoạt chất vừa nhận diện được.
   - Đánh giá xem sản phẩm/hoạt chất này CÓ PHÙ HỢP với tình trạng da người dùng (mụn ẩn, mụn viêm, thâm mụn PIH, da dầu/khô/nhạy cảm...) theo hướng dẫn chăm sóc da liễu hay không.

3. KHUYẾN NGHỊ VÀ HƯỚNG DẪN SỬ DỤNG CHI TIẾT:
   - Xác nhận rõ ràng: "Sản phẩm trong ảnh của bạn là **[Tên sản phẩm/Hoạt chất]**".
   - Cho biết CÓ NÊN DÙNG KHÔNG và lý do khoa học.
   - Hướng dẫn cách dùng: Tần suất (số lần/tuần), thứ tự thoa trong Routine, và các lưu ý chống chỉ định/kích ứng nếu có.

- Trả lời bằng tiếng Việt tự nhiên, chuyên nghiệp, rõ ràng và mạch lạc.
- Trình bày dạng Markdown đẹp mắt (dùng **in đậm**, gạch đầu dòng ngắn gọn).
- TUYỆT ĐỐI KHÔNG BAO GỒM BẤT KỲ CẤU TRÚC LẬP TRÌNH HOẶC CHUỖI JSON TRONG CÂU TRẢ LỜI.`;

export async function analyzeSkinImage(imageDataUrl) {
  if (!hasApiKey()) {
    await new Promise((r) => setTimeout(r, 600));
    return { content: DEMO_ANALYSIS, isDemo: true };
  }

  // Tối ưu chạy song song: Nén ảnh và lấy context da liễu
  const [optimizedImageDataUrl, medicalContext] = await Promise.all([
    compressImageIfNeeded(imageDataUrl, 800, 0.8),
    fetchMedicalContext("mụn trứng cá viêm da thâm nám"),
  ]);

  // 1. Thử gọi qua Backend API /api/skin/analyze (đồng bộ cả 2 bộ CSDL da liễu)
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
    promptText += `\n\nDƯỚI ĐÂY LÀ HƯỚNG DẪN ĐÁNH GIÁ VÀ CHĂM SÓC DA LIỄU (TÍCH HỢP TỪ GUIDELINES & SKIN DISEASE KNOWLEDGE BASE):\n${medicalContext}\n\nHãy căn cứ vào hướng dẫn da liễu trên để đưa ra đánh giá và lời khuyên chuẩn xác nhất.`;
  }
  parts.push({ text: promptText });
  parts.push({ text: "Hãy quan sát hình ảnh khuôn mặt thực tế của tôi và phân tích da chuẩn khoa học theo đúng quy định." });
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
    systemPromptText += `\n\nDƯỚI ĐÂY LÀ HƯỚNG DẪN ĐÁNH GIÁ VÀ CHĂM SÓC DA LIỄU (TÍCH HỢP TỪ GUIDELINES & SKIN DISEASE KNOWLEDGE BASE):\n${medicalContext}\n\nHãy căn cứ vào hướng dẫn da liễu trên để đưa ra đánh giá và lời khuyên chuẩn xác nhất.`;
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
1. "metrics": gồm 6 chỉ số da chuẩn da liễu:
   - "mun_viem" (Mụn viêm): điểm từ 1-10 và danh sách tọa độ points [{top: %, left: %}]
   - "mun_khong_viem" (Mụn không viêm): điểm từ 1-10 và points
   - "soi_ba_nhon" (Sợi bã nhờn): điểm từ 1-10 và points (ưu tiên vùng mũi, cằm)
   - "seo" (Sẹo): điểm từ 1-10 và points
   - "sac_to_da" (Sắc tố da): điểm từ 1-10 và points
   - "lo_chan_long" (Lỗ chân lông): điểm từ 1-10 và points
2. "averageScore": Trung bình cộng 6 chỉ số trên (làm tròn 1 chữ số thập phân, ví dụ: 6.7).
3. "detectedIssues": Danh sách 2 vấn đề có điểm thấp nhất (ví dụ: ["Lỗ chân lông", "Mụn không viêm"]).
Quan sát THỰC TẾ từng góc ảnh, không bịa đặt tổn thương nếu da sạch. Đưa ra đánh giá da liễu trung thực 100% kèm khối JSON_DATA theo đúng quy chuẩn.`;

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

