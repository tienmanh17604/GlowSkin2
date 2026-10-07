import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { analyzeMultiAngleSkinImages, parseAnalysisResponse, computeDiagnosticMetrics, detectBlemishesFromImagePixels } from "../services/analyzeSkin";
import "./WelcomeNameModal.css";

const VIETNAM_CITIES = [
  "An Giang", "Bà Rịa-Vũng Tàu", "Bình Dương", "Bình Phước", "Bình Thuận", "Bình Định",
  "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Cà Mau",
  "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên",
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội",
  "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn",
  "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận",
  "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh",
  "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP Hồ Chí Minh", "Trà Vinh",
  "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const BUDGET_OPTIONS = [
  "Dưới 200k/sản phẩm.",
  "Từ 200-300k/sản phẩm.",
  "Từ 300-500k/sản phẩm.",
  "Từ 500k-1 triệu/sản phẩm.",
  "Trên 1 triệu/sản phẩm."
];

const YES_NO_OPTIONS = [
  "Có",
  "Không"
];

const MEDICAL_CONDITION_OPTIONS = [
  "Lupus ban đỏ hệ thống (SLE)",
  "Suy gan / Xơ gan",
  "Suy thận (CKD)",
  "Suy giáp (Hypothyroidism)",
  "Cường giáp / Basedow (Graves')",
  "Đang hóa trị (Chemotherapy)",
  "Đang xạ trị (Radiation therapy)"
];

const PRESCRIPTION_OPTIONS = [
  "Doxycycline / Tetracycline / Minocycline",
  "Fluoroquinolone (Cipro, Levo, Moxifloxacin)",
  "Bactrim (TMP-SMX)",
  "Voriconazole (Vfend)",
  "Kháng lao (INH, Rifampicin)",
  "Amiodarone (Cordarone)",
  "HCTZ / Furosemide",
  "Sulfonylurea (Glipizide, Glyburide...)",
  "NSAIDs (Naproxen, Ketoprofen, Piroxicam)",
  "Lithium / Phenytoin / Carbamazepine",
  "Chlorpromazine / Haloperidol (Phenothiazine)",
  "Isotretinoin / Acitretin (mụn, vảy nến)",
  "Corticosteroid uống/tiêm (Prednison...)",
  "Cyclosporine",
  "EGFR inhibitor (Cetuximab, Erlotinib...)"
];

const SUPPLEMENT_OPTIONS = [
  "Vitamin B12 liều cao (>500 mcg/ngày)",
  "Whey protein / Creatine",
  "Cỏ thánh John (St. John's Wort)",
  "Tảo biển / Spirulina liều cao",
  "Povidone-iodine bôi da thường xuyên"
];

const SKIN_TYPE_OPTIONS = [
  {
    id: "dry",
    label: "Da khô căng, thiếu độ ẩm, có thể bong tróc",
    type: "dry",
    img: "https://res.cloudinary.com/buevamso/image/upload/v1790791250/glowskin/skin-types/skin_dry.png"
  },
  {
    id: "normal",
    label: "Da đủ ẩm, không khô rít, không bóng nhờn, khá mịn màng",
    type: "normal",
    img: "https://res.cloudinary.com/buevamso/image/upload/v1790791255/glowskin/skin-types/skin_model_base.jpg"
  },
  {
    id: "combo_oily_cheeks",
    label: "Vùng chữ T và 2 má tiết nhiều dầu, các khu vực khác khô",
    type: "combination_oily_cheeks",
    img: "https://res.cloudinary.com/buevamso/image/upload/v1790791255/glowskin/skin-types/skin_combo_cheeks.png"
  },
  {
    id: "combo_tzone",
    label: "Vùng chữ T tiết nhiều dầu, 2 má khô",
    type: "combination_tzone",
    img: "https://res.cloudinary.com/buevamso/image/upload/v1790791254/glowskin/skin-types/skin_combo_tzone.png"
  },
  {
    id: "oily",
    label: "Da thừa dầu, bóng nhờn",
    type: "oily",
    img: "https://res.cloudinary.com/buevamso/image/upload/v1790791253/glowskin/skin-types/skin_oily.png"
  }
];

const SKIN_SENSITIVITY_OPTIONS = [
  "Chưa bao giờ",
  "Thỉnh thoảng",
  "Thường xuyên",
  "Rất hay gặp"
];

const VIDEO_GUIDE_URLS = [
  "https://res.cloudinary.com/buevamso/video/upload/v1790927641/glowskin/guide-videos/guide_step_1.mp4",
  "https://res.cloudinary.com/buevamso/video/upload/v1790927642/glowskin/guide-videos/guide_step_2.mp4",
  "https://res.cloudinary.com/buevamso/video/upload/v1790927644/glowskin/guide-videos/guide_step_3.mp4"
];

function SkinTypeVisual({ type, label, imageSrc, onScanClick }) {
  const currentSrc = imageSrc || "/images/skin-types/model_base.jpg";

  return (
    <div className="onboarding-skin-visual-wrapper">
      <img
        src={currentSrc}
        alt={label}
        className="onboarding-skin-base-img"
        loading="lazy"
      />

      {/* AI Camera scanner badge / inspect button */}
      <button
        type="button"
        className="onboarding-skin-scan-badge"
        onClick={(e) => {
          e.stopPropagation();
          onScanClick?.(currentSrc);
        }}
        title="Xem ảnh chi tiết"
        aria-label="Xem ảnh chi tiết"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8V5a1 1 0 0 1 1-1h3 M16 4h3a1 1 0 0 1 1 1v3 M20 16v3a1 1 0 0 1-1 1h-3 M8 20H5a1 1 0 0 1-1-1v-3" />
          <path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      </button>
    </div>
  );
}

function WheelColumn({ items, value, onChange, formatLabel, className = "" }) {
  const colRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const isSilentResetRef = useRef(false);
  const initializedRef = useRef(false);
  const prevNRef = useRef(items.length);

  // Drag to scroll refs for desktop users
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const ITEM_HEIGHT = 38;
  const REPEAT_CYCLES = 40;
  const MID_CYCLE = 20;
  const N = items.length;

  const currentIndex = items.indexOf(value) !== -1 ? items.indexOf(value) : 0;

  // Handle initial mount or items length changes (e.g. maxDays changed)
  useEffect(() => {
    if (!colRef.current || N === 0) return;

    if (!initializedRef.current || prevNRef.current !== N) {
      prevNRef.current = N;
      const initialScrollTop = (MID_CYCLE * N + currentIndex) * ITEM_HEIGHT;
      colRef.current.scrollTop = initialScrollTop;
      initializedRef.current = true;
    } else if (!isUserScrollingRef.current && !isDraggingRef.current) {
      // Sync smoothly if value changed externally
      const currentScrollTop = colRef.current.scrollTop;
      const currentRawIndex = Math.round(currentScrollTop / ITEM_HEIGHT);
      const currentCycle = Math.floor(currentRawIndex / N);
      const targetScrollTop = (currentCycle * N + currentIndex) * ITEM_HEIGHT;

      if (Math.abs(currentScrollTop - targetScrollTop) > 2) {
        colRef.current.scrollTo({
          top: targetScrollTop,
          behavior: "smooth"
        });
      }
    }
  }, [value, N, currentIndex]);

  // Window listeners for smooth mouse dragging across whole screen
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (!isDraggingRef.current || !colRef.current) return;
      const dy = e.clientY - startYRef.current;
      if (Math.abs(dy) > 3) {
        hasDraggedRef.current = true;
      }
      colRef.current.scrollTop = startScrollTopRef.current - dy;
    };

    const handleWindowMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        if (colRef.current) {
          const currentScrollTop = colRef.current.scrollTop;
          const nearestIndex = Math.round(currentScrollTop / ITEM_HEIGHT);
          colRef.current.scrollTo({
            top: nearestIndex * ITEM_HEIGHT,
            behavior: "smooth"
          });
        }
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startYRef.current = e.clientY;
    startScrollTopRef.current = colRef.current ? colRef.current.scrollTop : 0;
  };

  const handleScroll = (e) => {
    if (isSilentResetRef.current || N === 0) return;

    isUserScrollingRef.current = true;
    clearTimeout(scrollTimeoutRef.current);

    const scrollTop = e.currentTarget.scrollTop;
    const rawIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const itemIndex = ((rawIndex % N) + N) % N;
    const selectedItem = items[itemIndex];

    if (selectedItem !== undefined && selectedItem !== value) {
      onChange(selectedItem);
    }

    // Debounced silent reset to middle cycle to guarantee infinite loop with 0 edge limits
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      if (!colRef.current || N === 0) return;

      const latestScrollTop = colRef.current.scrollTop;
      const latestRawIndex = Math.round(latestScrollTop / ITEM_HEIGHT);
      const currentCycle = Math.floor(latestRawIndex / N);

      // If user wandered away from MID_CYCLE (> 6 cycles away), silently jump back
      if (Math.abs(currentCycle - MID_CYCLE) > 6) {
        isSilentResetRef.current = true;
        const currentItemIdx = ((latestRawIndex % N) + N) % N;
        const resetScrollTop = (MID_CYCLE * N + currentItemIdx) * ITEM_HEIGHT;
        colRef.current.scrollTop = resetScrollTop;
        requestAnimationFrame(() => {
          isSilentResetRef.current = false;
        });
      }
    }, 120);
  };

  const handleClickItem = (item, rawIndex) => {
    if (hasDraggedRef.current) return;
    onChange(item);
    if (colRef.current) {
      colRef.current.scrollTo({
        top: rawIndex * ITEM_HEIGHT,
        behavior: "smooth"
      });
    }
  };

  return (
    <div
      ref={colRef}
      className={`onboarding-wheel-col ${className}`}
      onScroll={handleScroll}
      onMouseDown={handleMouseDown}
    >
      <div className="onboarding-wheel-list">
        {Array.from({ length: REPEAT_CYCLES }).map((_, cycle) =>
          items.map((item, idx) => {
            const rawIndex = cycle * N + idx;
            const isSelected = item === value;
            return (
              <div
                key={`${cycle}-${item}`}
                className={`onboarding-wheel-item ${isSelected ? "active" : ""}`}
                onClick={() => handleClickItem(item, rawIndex)}
              >
                {formatLabel ? formatLabel(item) : item}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function buildPersonalizedScan(skinTypeChoice, sensitivityChoice, budgetChoice) {
  let score = 75;
  let overview = "";
  let routine = "";
  let ingredients = "";
  let warning = "";
  let zones = [];

  const isDry = skinTypeChoice?.includes("khô");
  const isOily = skinTypeChoice?.includes("thừa dầu") || skinTypeChoice?.includes("bóng nhờn");
  const isComboTzone = skinTypeChoice?.includes("Vùng chữ T tiết nhiều dầu");
  const isComboCheeks = skinTypeChoice?.includes("chữ T và 2 má");

  if (isDry) {
    score = 70;
    overview = "Da khô căng, thiếu ẩm trầm trọng — màng lipid biểu bì suy yếu, giảm khả năng giữ nước tự nhiên. Cần tăng cường cấp ẩm chuyên sâu và khóa ẩm tức thì.";
    routine = "**Routine Sáng & Tối Khuyến Nghị:**\n- **Sáng:** Sữa rửa mặt dạng kem dịu nhẹ pH 5.5 → Nước cân bằng Hyaluronic Acid → Serum B5 & Ceramide phục hồi → Kem dưỡng ẩm sâu khóa ẩm → Kem chống nắng dưỡng ẩm quang phổ rộng SPF 50+\n- **Tối:** Sáp/dầu tẩy trang dưỡng ẩm → Sữa rửa mặt dịu nhẹ → Serum cấp ẩm đa tầng (HA) → Kem khóa ẩm phục hồi màng lipid";
    ingredients = "**Thành phần khuyên dùng & nên tránh:**\n- **Nên dùng:** Hyaluronic Acid, Ceramide NP/AP, Panthenol (B5), Glycerin, Squalane.\n- **Nên tránh:** Cồn khô (Alcohol Denat), Xà phòng tạo bọt kiềm cao, Hương liệu tổng hợp.";
    warning = "**Lưu ý chuyên khoa:** Tránh dùng AHA/BHA nồng độ cao khi da đang bong tróc. Luôn cấp ẩm ngay sau khi rửa mặt khi da còn ẩm.";
    zones = [
      { id: "forehead", title: "Vùng Trán", condition: "Khô ráp & thiếu ẩm", detail: "Độ ẩm bề mặt thấp, cần tăng cường tinh chất HA.", status: "yellow", angle: -90 },
      { id: "eyebrow", title: "Vùng Lông Mày", condition: "Nền da ổn định", detail: "Cấu trúc biểu bì bình thường.", status: "green", angle: -30 },
      { id: "upper_cheek", title: "Vùng Má", condition: "Khô căng & bong tróc", detail: "Màng bảo vệ da suy giảm, cần kem phục hồi Ceramide.", status: "red", angle: 30 },
      { id: "chin", title: "Vùng Cằm", condition: "Thiếu ẩm vi điểm", detail: "Bề mặt ráp nhẹ, cần dưỡng ẩm đều đặn.", status: "yellow", angle: 90 },
      { id: "mouth", title: "Vùng Môi", condition: "Khô nẻ nhẹ", detail: "Cần bổ sung dưỡng ẩm chuyên biệt vùng quanh môi.", status: "yellow", angle: 150 },
      { id: "jaw", title: "Vùng Hàm", condition: "Khá ổn định", detail: "Không có dấu hiệu kích ứng nặng.", status: "green", angle: 210 }
    ];
  } else if (isOily) {
    score = 68;
    overview = "Da thừa dầu, bóng nhờn — tuyến bã nhờn tăng tiết mạnh, lỗ chân lông giãn nở kèm nguy cơ bít tắc hình thành mụn ẩn, mụn viêm. Cần cân bằng lượng dầu - nước chuẩn da liễu.";
    routine = "**Routine Sáng & Tối Khuyến Nghị:**\n- **Sáng:** Gel rửa mặt BHA/Zinc làm sạch sâu → Toner cân bằng kiềm dầu → Serum Niacinamide 10% kiểm soát bã nhờn → Gel dưỡng mỏng nhẹ Oil-Free → Kem chống nắng kiềm dầu mỏng mịn\n- **Tối:** Nước tẩy trang Micellar sạch sâu → Gel rửa mặt dịu nhẹ → BHA 2% Salicylic Acid (3 lần/tuần) → Gel dưỡng phục hồi mỏng nhẹ";
    ingredients = "**Thành phần khuyên dùng & nên tránh:**\n- **Nên dùng:** Niacinamide, BHA (Salicylic Acid), Kẽm PCA (Zinc), Tràm trà (Tea Tree), HA dạng lỏng nhẹ.\n- **Nên tránh:** Dầu khoáng bí tắc (Mineral Oil), Bơ hạt mỡ đặc (Shea Butter), Cồn khô kích ứng tuyến nhờn.";
    warning = "**Lưu ý chuyên khoa:** Không rửa mặt quá 2 lần/ngày bằng chất tẩy rửa mạnh vì sẽ kích thích tuyến bã nhờn bù trừ tiết nhiều dầu hơn.";
    zones = [
      { id: "forehead", title: "Vùng Trán", condition: "Bóng dầu & Bít tắc lỗ chân lông", detail: "Tuyến nhờn hoạt động mạnh, có nguy cơ mụn ẩn.", status: "red", angle: -90 },
      { id: "eyebrow", title: "Vùng Lông Mày", condition: "Da dầu nhẹ", detail: "Tiết nhờn tập trung quanh cung mày.", status: "yellow", angle: -30 },
      { id: "upper_cheek", title: "Vùng Má", condition: "Lỗ chân lông to & Sợi bã nhờn", detail: "Cần Niacinamide thu nhỏ cổ nang lông.", status: "yellow", angle: 30 },
      { id: "chin", title: "Vùng Cằm", condition: "Bít tắc & Vi mụn đầu đen", detail: "Tập trung bã nhờn, cần làm sạch sâu với BHA.", status: "red", angle: 90 },
      { id: "mouth", title: "Vùng Môi", condition: "Bình thường", detail: "Độ nhờn cân bằng.", status: "green", angle: 150 },
      { id: "jaw", title: "Vùng Hàm", condition: "Ít bít tắc", detail: "Cấu trúc ổn định.", status: "green", angle: 210 }
    ];
  } else if (isComboCheeks || isComboTzone) {
    score = 72;
    overview = "Da hỗn hợp — vùng chữ T (trán, mũi, cằm) tăng tiết bã nhờn trong khi hai bên má có xu hướng thiếu ẩm. Đòi hỏi phác đồ chăm sóc vùng kép chuyên biệt.";
    routine = "**Routine Sáng & Tối Khuyến Nghị:**\n- **Sáng:** Sữa rửa mặt tạo bọt dịu nhẹ pH 5.5 → Toner cấp nước cân bằng ẩm → Serum Niacinamide 5% điều tiết dầu vùng T → Kem dưỡng ẩm dạng emulsion/lotion mỏng nhẹ → Kem chống nắng phổ rộng\n- **Tối:** Tẩy trang Micellar Water dịu nhẹ → Sữa rửa mặt pH chuẩn → BHA 1-2% vùng chữ T (2-3 lần/tuần) → Kem dưỡng Ceramide phục hồi 2 bên má";
    ingredients = "**Thành phần khuyên dùng & nên tránh:**\n- **Nên dùng:** Niacinamide, BHA nhẹ vùng nhờn, Hyaluronic Acid, Chiết xuất rau má (Centella), Ceramide.\n- **Nên tránh:** Cồn khô làm mất nước vùng má, dầu dưỡng quá đậm đặc cho vùng chữ T.";
    warning = "**Lưu ý chuyên khoa:** Cân bằng độ ẩm vùng má trước khi dùng hoạt chất đặc trị vùng chữ T để tránh khô ráp cục bộ.";
    zones = [
      { id: "forehead", title: "Vùng Trán", condition: "Bóng dầu vùng chữ T", detail: "Tăng tiết bã nhờn cục bộ, lỗ chân lông hơi to.", status: "yellow", angle: -90 },
      { id: "eyebrow", title: "Vùng Lông Mày", condition: "Nền da ổn định", detail: "Độ đàn hồi tốt, ít tổn thương.", status: "green", angle: -30 },
      { id: "upper_cheek", title: "Vùng Má", condition: "Da thường thiên khô", detail: "Cần tăng cường cấp ẩm để không bị khô ráp.", status: "yellow", angle: 30 },
      { id: "chin", title: "Vùng Cằm", condition: "Sợi bã nhờn vùng chữ T", detail: "Tập trung bã nhờn và mụn cám nhẹ.", status: "yellow", angle: 90 },
      { id: "mouth", title: "Vùng Môi", condition: "Khá ổn định", detail: "Không có ổ viêm.", status: "green", angle: 150 },
      { id: "jaw", title: "Vùng Hàm", condition: "Khỏe mạnh", detail: "Màng bảo vệ tốt.", status: "green", angle: 210 }
    ];
  } else {
    // Da bình thường đủ ẩm
    score = 85;
    overview = "Da thường lý tưởng — tỷ lệ dầu - nước cân bằng tốt, bề mặt da mịn màng, lỗ chân lông nhỏ và ít khuyết điểm. Mục tiêu duy trì và chống oxy hóa bảo vệ da.";
    routine = "**Routine Sáng & Tối Khuyến Nghị:**\n- **Sáng:** Sữa rửa mặt dịu nhẹ → Nước hoa hồng dưỡng ẩm → Serum Vitamin C chống oxy hóa → Kem dưỡng ẩm mỏng nhẹ → Kem chống nắng SPF 50+\n- **Tối:** Nước tẩy trang làm sạch bụi mịn → Sữa rửa mặt dịu nhẹ → Serum phục hồi HA/Peptide → Kem dưỡng ẩm ban đêm";
    ingredients = "**Thành phần khuyên dùng & nên tránh:**\n- **Nên dùng:** Vitamin C (EAA/L-AA), Hyaluronic Acid, Peptides, Niacinamide, Vitamin E.\n- **Nên tránh:** Sản phẩm lột tẩy quá đà gây tổn hại màng tự nhiên.";
    warning = "**Lưu ý chuyên khoa:** Duy trì thói quen thoa kem chống nắng hằng ngày để bảo vệ nền da khỏe đẹp lâu dài.";
    zones = [
      { id: "forehead", title: "Vùng Trán", condition: "Làn da mịn màng", detail: "Độ ẩm tối ưu, không có bít tắc.", status: "green", angle: -90 },
      { id: "eyebrow", title: "Vùng Lông Mày", condition: "Ổn định", detail: "Độ đàn hồi cao.", status: "green", angle: -30 },
      { id: "upper_cheek", title: "Vùng Má", condition: "Đủ ẩm & Đàn hồi tốt", detail: "Cấu trúc collagen săn chắc.", status: "green", angle: 30 },
      { id: "chin", title: "Vùng Cằm", condition: "Thông thoáng", detail: "Không có sợi bã nhờn nổi rõ.", status: "green", angle: 90 },
      { id: "mouth", title: "Vùng Môi", condition: "Độ ẩm tốt", detail: "Mềm mịn.", status: "green", angle: 150 },
      { id: "jaw", title: "Vùng Hàm", condition: "Khỏe mạnh", detail: "Đường nét săn chắc.", status: "green", angle: 210 }
    ];
  }

  // Cảnh báo nếu da nhạy cảm
  if (sensitivityChoice === "Thường xuyên" || sensitivityChoice === "Rất hay gặp") {
    score = Math.max(score - 6, 60);
    overview += " [Lưu ý: Mức độ nhạy cảm cao - Da phản ứng mạnh với thay đổi môi trường & mỹ phẩm mới].";
    warning += " Da có tiền sử dễ kích ứng, mẩn đỏ. Bắt buộc test phản ứng tại góc xương quai hàm (patch test) 24h trước khi dùng bất kỳ sản phẩm mới nào.";
  }

  const primaryImage =
    capturedFaces?.center ||
    capturedFaces?.left ||
    capturedFaces?.right ||
    "/images/skin-types/model_base.jpg";

  const diagResult = computeDiagnosticMetrics({
    skinType: skinTypeChoice,
    skinSensitivity: sensitivityChoice
  });

  return {
    id: `survey-scan-${Date.now()}`,
    date: "Chẩn đoán vừa thực hiện",
    score: Math.round(diagResult.averageScore * 10),
    averageScore: diagResult.averageScore,
    detectedIssues: diagResult.detectedIssues,
    metrics: diagResult.metrics,
    skinType: skinTypeChoice || "Da hỗn hợp",
    sensitivity: (sensitivityChoice?.includes("Thường xuyên") || sensitivityChoice?.includes("Rất hay gặp")) ? "Có" : "Không",
    scoreLabel: "Phân tích Da Liễu & AI Vision",
    medicalReference: "Tiêu chuẩn Chăm Sóc Da Liễu",
    image: primaryImage,
    faceAngles: {
      front: capturedFaces?.center || null,
      left: capturedFaces?.left || null,
      right: capturedFaces?.right || null
    },
    usedProducts: selectedProducts || [],
    aiOverview: overview,
    routine,
    ingredients,
    warning,
    summary: [
      { title: skinTypeChoice || "Da hỗn hợp", en: "(Skin Type)" },
      { title: `Độ nhạy cảm: ${sensitivityChoice || "Thấp"}`, en: "(Skin Sensitivity)" },
      { title: `Đã quét 3 góc mặt`, en: "(3-Angle Scan)" }
    ],
    zones
  };
}

const POPULAR_SKINCARE_PRODUCTS = [
  {
    id: "klairs-supple-toner",
    brand: "DEAR, KLAIRS",
    name: "SUPPLE PREPARATION FACIAL TONER",
    category: "Toner",
    volume: "180ml",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80&auto=format&fit=crop"
  },
  {
    id: "svr-sebiaclear-gel",
    brand: "SVR",
    name: "SEBIACLEAR GEL MOUSSANT",
    category: "Sữa rửa mặt",
    volume: "200ml",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80&auto=format&fit=crop"
  },
  {
    id: "cocoon-winter-melon",
    brand: "THE COCOON",
    name: "WINTER MELON MICELLAR WATER",
    category: "Nước tẩy trang",
    volume: "140ml",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&q=80&auto=format&fit=crop"
  },
  {
    id: "garnier-micellar-water",
    brand: "GARNIER",
    name: "MICELLAR WATER FOR OILY SKIN",
    category: "Nước tẩy trang",
    volume: "400ml",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&q=80&auto=format&fit=crop"
  },
  {
    id: "jmsolution-h9-cleansing",
    brand: "JMSOLUTION",
    name: "H9 HYALURONIC AMPOULE CLEANSING WATER",
    category: "Nước tẩy trang",
    volume: "500ml",
    image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=300&q=80&auto=format&fit=crop"
  },
  {
    id: "laroche-lipikar-syndet",
    brand: "LA ROCHE - POSAY",
    name: "LIPIKAR SYNDET AP+ CLEANSING CREAM-GEL",
    category: "Sữa rửa mặt",
    volume: "400ml",
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&q=80&auto=format&fit=crop"
  },
  {
    id: "hadalabo-nourish-cleanser",
    brand: "HADA LABO",
    name: "ADVANCED NOURISH HYALURON CLEANSER",
    category: "Sữa rửa mặt",
    volume: "80g",
    image: "https://images.unsplash.com/photo-1594125350300-8f77235aef2b?w=300&q=80&auto=format&fit=crop"
  }
];

export default function WelcomeNameModal() {
  const {
    currentUser,
    isNameModalOpen,
    setIsNameModalOpen,
    updatePreferredName,
    updateProfile,
    saveLatestScan
  } = useApp();
  const navigate = useNavigate();

  // Wizard Step:
  // 0: Preferred Name input
  // 1: Gender (Nam / Nữ)
  // 2: Date of birth (Wheel picker)
  // 3: City (Search & Select)
  // 4: Budget & Medical questions
  // 5: Skin Type & Sensitivity diagnosis
  // 6: Current skincare products ("Sản phẩm bạn đang dùng")
  // 7: Video guide for scanning face
  // 8: 3-angle face camera scanner (Chính diện, Bên trái, Bên phải) -> AI Vision Analysis
  const [step, setStep] = useState(0);

  // Form States
  const [nameInput, setNameInput] = useState("");
  const [gender, setGender] = useState("");
  
  // Date Picker States
  const [day, setDay] = useState(20);
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2000);

  // City search & select
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Survey Questions (Step 4)
  const [budget, setBudget] = useState("");
  const [hasMedical, setHasMedical] = useState("");
  const [medicalDetail, setMedicalDetail] = useState("");
  const [hasPrescription, setHasPrescription] = useState("");
  const [prescriptionDetail, setPrescriptionDetail] = useState("");
  const [hasSupplements, setHasSupplements] = useState("");
  const [supplementsDetail, setSupplementsDetail] = useState("");
  const [hasBloodVessels, setHasBloodVessels] = useState("");
  const [activeBottomSheet, setActiveBottomSheet] = useState(null); // null | "medical" | "prescription" | "supplements"

  // Step 5: Skin Diagnosis
  const [skinType, setSkinType] = useState("");
  const [skinSensitivity, setSkinSensitivity] = useState("");
  const [previewSkinImage, setPreviewSkinImage] = useState(null);

  // Step 6: Video Guide
  const [videoGuideIndex, setVideoGuideIndex] = useState(0);

  // Step 7: Camera 3-Angle Scanner
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraFileInputRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user");
  const [activeFaceAngle, setActiveFaceAngle] = useState("center"); // "center" | "left" | "right"
  const [capturedFaces, setCapturedFaces] = useState({
    center: null,
    left: null,
    right: null
  });
  const [cameraError, setCameraError] = useState(null);

  // Step 8: Products in use
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalyzingStatus, setAiAnalyzingStatus] = useState("");
  const inputRef = useRef(null);
  const wasOpenRef = useRef(false);
  const overlayRef = useRef(null);
  const surveyScrollRef = useRef(null);
  const surveyScrollRefStep5 = useRef(null);
  const sensitivitySectionRef = useRef(null);

  // Lock body & html scroll completely when modal is active
  useEffect(() => {
    if (isNameModalOpen) {
      document.documentElement.classList.add("onboarding-scroll-locked");
      document.body.classList.add("onboarding-scroll-locked");
      return () => {
        document.documentElement.classList.remove("onboarding-scroll-locked");
        document.body.classList.remove("onboarding-scroll-locked");
      };
    } else {
      document.documentElement.classList.remove("onboarding-scroll-locked");
      document.body.classList.remove("onboarding-scroll-locked");
    }
  }, [isNameModalOpen]);

  // Prevent background scrolling when rolling mouse wheel outside the card
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleBackdropWheel = (e) => {
      // If cursor is on the backdrop outside the card
      if (e.target === overlay) {
        e.preventDefault();
      }
    };

    overlay.addEventListener("wheel", handleBackdropWheel, { passive: false });
    overlay.addEventListener("touchmove", handleBackdropWheel, { passive: false });

    return () => {
      overlay.removeEventListener("wheel", handleBackdropWheel);
      overlay.removeEventListener("touchmove", handleBackdropWheel);
    };
  }, [isNameModalOpen]);

  const lastUserEmailRef = useRef(null);

  // Reset or pre-fill when modal opens or when a new user logs in
  useEffect(() => {
    if (!currentUser) {
      lastUserEmailRef.current = null;
      wasOpenRef.current = false;
      setStep(0);
      setNameInput("");
      setGender("");
      setSelectedCity("");
      setCitySearch("");
      setBudget("");
      setHasMedical("");
      setMedicalDetail("");
      setHasPrescription("");
      setPrescriptionDetail("");
      setHasSupplements("");
      setSupplementsDetail("");
      setHasBloodVessels("");
      setActiveBottomSheet(null);
      setSkinType("");
      setSkinSensitivity("");
      return;
    }

    const currentEmail = currentUser.email || currentUser.id || currentUser._id;

    if (isNameModalOpen) {
      // Initialize if opening afresh or if logged-in user changed
      if (!wasOpenRef.current || lastUserEmailRef.current !== currentEmail) {
        wasOpenRef.current = true;
        lastUserEmailRef.current = currentEmail;

        const initialName =
          currentUser.preferredName ||
          currentUser.name ||
          "";
        setNameInput(initialName);
        setGender(currentUser.gender || "");
        setSelectedCity(currentUser.city || "");
        setCitySearch("");
        setBudget(currentUser.skinSurvey?.budget || "");
        
        const medCond = currentUser.skinSurvey?.hasMedicalCondition || "";
        if (medCond.startsWith("Có")) {
          setHasMedical("Có");
          setMedicalDetail(medCond.replace(/^Có\s*-\s*/, ""));
        } else if (medCond === "Câu hỏi không phù hợp với tôi") {
          setHasMedical("Không");
          setMedicalDetail("");
        } else {
          setHasMedical(medCond);
          setMedicalDetail("");
        }

        const medPresc = currentUser.skinSurvey?.hasPrescriptionMedication || "";
        if (medPresc.startsWith("Có")) {
          setHasPrescription("Có");
          setPrescriptionDetail(medPresc.replace(/^Có\s*-\s*/, ""));
        } else if (medPresc === "Câu hỏi không phù hợp với tôi") {
          setHasPrescription("Không");
          setPrescriptionDetail("");
        } else {
          setHasPrescription(medPresc);
          setPrescriptionDetail("");
        }

        const medSupp = currentUser.skinSurvey?.hasSupplements || "";
        if (medSupp.startsWith("Có")) {
          setHasSupplements("Có");
          setSupplementsDetail(medSupp.replace(/^Có\s*-\s*/, ""));
        } else if (medSupp === "Câu hỏi không phù hợp với tôi") {
          setHasSupplements("Không");
          setSupplementsDetail("");
        } else {
          setHasSupplements(medSupp);
          setSupplementsDetail("");
        }

        setActiveBottomSheet(null);
        setHasBloodVessels(currentUser.skinSurvey?.hasBloodVessels || "");
        setSkinType(currentUser.skinSurvey?.skinType || "");
        setSkinSensitivity(currentUser.skinSurvey?.skinSensitivity || "");
        setSelectedProducts(currentUser.skinSurvey?.selectedProducts || []);
        
        // Nếu mở ở chế độ survey (lúc đăng nhập lần đầu) thì bắt đầu từ Step 3.
        // Còn khi quét da mặt bình thường ở đây, LUÔN bắt đầu từ Step 0 (Chụp ảnh) và không bao giờ hiện 3 form sau chụp!
        if (isNameModalOpen === "survey") {
          setStep(3);
        } else {
          setStep(0);
        }

        const timer = setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      wasOpenRef.current = false;
    }
  }, [isNameModalOpen, currentUser?.email, currentUser?.id, currentUser?._id]);


  // Calculate max days for selected month and year
  const maxDays = new Date(year, month, 0).getDate();
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 76 }, (_, i) => 1950 + i); // 1950 up to 2025

  // Clamp day if exceeding max days of month (Hook at top level)
  useEffect(() => {
    if (day > maxDays) {
      setDay(maxDays);
    }
  }, [maxDays, day]);

  // Guarantee step is always valid (0 to 5), fallback to 0 so it NEVER renders blank!
  const currentStep = typeof step === "number" && step >= 0 && step <= 5 ? step : 0;

  const currentPreferredName = nameInput.trim() || currentUser?.preferredName || "bạn";

  const handleBack = () => {
    if (currentStep === 2) {
      stopCamera();
      setVideoGuideIndex(2);
      setStep(1);
    } else if (currentStep === 1) {
      if (videoGuideIndex > 0) {
        setVideoGuideIndex((prev) => prev - 1);
      } else {
        setStep(0);
      }
    } else if (currentStep === 5) {
      setStep(4);
    } else if (currentStep === 4) {
      setStep(3);
    } else if (currentStep === 3) {
      setIsNameModalOpen(false);
    } else if (currentStep > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const handleVideoGuideNext = () => {
    if (videoGuideIndex < 2) {
      setVideoGuideIndex((prev) => prev + 1);
    } else {
      setStep(2); // Advance to Camera 3-Angle Scanner
    }
  };

  // Step 0: Advance immediately to Step 1 on the first click/enter and save in background
  const handleStep0Next = (e) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    // Immediately advance step so user never has to click multiple times!
    setStep(1);

    if (typeof updatePreferredName === "function") {
      updatePreferredName(trimmed).catch((err) => {
        console.error("Lỗi cập nhật tên gọi thân mật:", err);
      });
    }
  };

  // Step 1: Gender submit
  const handleStep1Next = () => {
    if (!gender) return;
    setStep(2);
  };

  // Step 2: Birthday submit
  const handleStep2Next = () => {
    setStep(3);
  };

  // Step 3: City submit
  const handleStep3Next = () => {
    if (!selectedCity) return;
    setStep(4);
  };

  // Step 4: Advance to Step 5 (Skin Diagnosis)
  const handleStep4Next = () => {
    if (!budget) return;
    setStep(4);
  };

  const handleSelectMedical = (val) => {
    if (val === "Có") {
      setActiveBottomSheet("medical");
    } else {
      setHasMedical("Không");
      setMedicalDetail("");
      if (activeBottomSheet === "medical") setActiveBottomSheet(null);
    }
  };

  const handlePickMedicalOption = (item) => {
    if (medicalDetail === item && hasMedical === "Có") {
      setMedicalDetail("");
      setHasMedical("Không");
    } else {
      setMedicalDetail(item);
      setHasMedical("Có");
    }
    setActiveBottomSheet(null);
  };

  const handleSelectPrescription = (val) => {
    if (val === "Có") {
      setActiveBottomSheet("prescription");
    } else {
      setHasPrescription("Không");
      setPrescriptionDetail("");
      if (activeBottomSheet === "prescription") setActiveBottomSheet(null);
    }
  };

  const handlePickPrescriptionOption = (item) => {
    if (prescriptionDetail === item && hasPrescription === "Có") {
      setPrescriptionDetail("");
      setHasPrescription("Không");
    } else {
      setPrescriptionDetail(item);
      setHasPrescription("Có");
    }
    setActiveBottomSheet(null);
  };

  const handleSelectSupplements = (val) => {
    if (val === "Có") {
      setActiveBottomSheet("supplements");
    } else {
      setHasSupplements("Không");
      setSupplementsDetail("");
      if (activeBottomSheet === "supplements") setActiveBottomSheet(null);
    }
  };

  const handlePickSupplementsOption = (item) => {
    if (supplementsDetail === item && hasSupplements === "Có") {
      setSupplementsDetail("");
      setHasSupplements("Không");
    } else {
      setSupplementsDetail(item);
      setHasSupplements("Có");
    }
    setActiveBottomSheet(null);
  };

  const handleDismissBottomSheet = () => {
    if (activeBottomSheet === "medical" && !medicalDetail) {
      setHasMedical("Không");
    } else if (activeBottomSheet === "prescription" && !prescriptionDetail) {
      setHasPrescription("Không");
    } else if (activeBottomSheet === "supplements" && !supplementsDetail) {
      setHasSupplements("Không");
    }
    setActiveBottomSheet(null);
  };

  // Step 5: When selecting skin type
  const handleSelectSkinType = (label) => {
    setSkinType(label);
    if (!skinSensitivity) {
      setTimeout(() => {
        sensitivitySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  };

  // Step 5: Bottom button action -> Go to Step 6 (Video Guide)
  const handleStep5Action = () => {
    if (!skinType) return;
    if (!skinSensitivity) {
      sensitivitySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setStep(5);
  };

  // Camera stream controls for Step 8
  useEffect(() => {
    if (isNameModalOpen && step === 2) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isNameModalOpen, step, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera fallback attempt:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        cameraStreamRef.current = fallbackStream;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error("Lỗi khi mở camera:", fallbackErr);
        setCameraError("Không thể mở máy ảnh trên thiết bị. Vui lòng cấp quyền hoặc tải ảnh mặt từ máy.");
      }
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth) {
      console.warn("Camera video not ready");
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const viewport = video.parentElement;
    const viewW = viewport?.clientWidth || 400;
    const viewH = viewport?.clientHeight || 440;
    const targetAspect = viewW / viewH;
    const videoAspect = vw / vh;

    let sx = 0;
    let sy = 0;
    let sWidth = vw;
    let sHeight = vh;

    if (videoAspect > targetAspect) {
      sWidth = vh * targetAspect;
      sx = (vw - sWidth) / 2;
    } else {
      sHeight = vw / targetAspect;
      sy = (vh - sHeight) / 2;
    }

    const outW = 720;
    const outH = Math.round(outW / targetAspect);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");

    if (facingMode === "user") {
      ctx.translate(outW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, outW, outH);
    } else {
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, outW, outH);
    }
    const photoUrl = canvas.toDataURL("image/jpeg", 0.92);

    setCapturedFaces((prev) => ({
      ...prev,
      [activeFaceAngle]: photoUrl
    }));

    // Auto advance angle: center -> left -> right
    if (activeFaceAngle === "center") {
      setActiveFaceAngle("left");
    } else if (activeFaceAngle === "left") {
      setActiveFaceAngle("right");
    }
  };

  const deleteCapturedFace = (angle, e) => {
    if (e) e.stopPropagation();
    setCapturedFaces((prev) => ({
      ...prev,
      [angle]: null
    }));
    setActiveFaceAngle(angle);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedFaces((prev) => ({
        ...prev,
        [activeFaceAngle]: dataUrl
      }));
      if (activeFaceAngle === "center") setActiveFaceAngle("left");
      else if (activeFaceAngle === "left") setActiveFaceAngle("right");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const canContinueFromCamera = Boolean(capturedFaces.center && capturedFaces.left && capturedFaces.right);
  const capturedAnglesCount = (capturedFaces.center ? 1 : 0) + (capturedFaces.left ? 1 : 0) + (capturedFaces.right ? 1 : 0);

  const filteredProducts = POPULAR_SKINCARE_PRODUCTS.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const toggleSelectProduct = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Lưu kết quả khảo sát 3 form khi người dùng điền lúc đăng nhập lần đầu
  const handleSaveSurveyOnly = async () => {
    setIsSubmitting(true);
    const birthDateStr = `${day}/${month}/${year}`;
    const effectiveBudget = budget || "Từ 200-300k/sản phẩm.";
    const effectiveSkinType = skinType || "Da hỗn hợp thiên dầu";
    const effectiveSkinSensitivity = skinSensitivity || "Bình thường";
    const effectiveMedical = hasMedical === "Có" && medicalDetail ? `Có - ${medicalDetail}` : (hasMedical || "Không");
    const effectivePrescription = hasPrescription === "Có" && prescriptionDetail ? `Có - ${prescriptionDetail}` : (hasPrescription || "Không");
    const effectiveSupplements = hasSupplements === "Có" && supplementsDetail ? `Có - ${supplementsDetail}` : (hasSupplements || "Không");
    const effectiveBloodVessels = hasBloodVessels || "Không";

    const surveyPayload = {
      gender,
      birthDate: birthDateStr,
      city: selectedCity,
      skinSurvey: {
        budget: effectiveBudget,
        hasMedicalCondition: effectiveMedical,
        hasPrescriptionMedication: effectivePrescription,
        hasSupplements: effectiveSupplements,
        hasBloodVessels: effectiveBloodVessels,
        skinType: effectiveSkinType,
        skinSensitivity: effectiveSkinSensitivity,
        capturedFaces: currentUser?.skinSurvey?.capturedFaces || null,
        selectedProducts
      },
      onboardingCompleted: true
    };

    try {
      const id = currentUser?.id || currentUser?._id || currentUser?.email;
      if (id && typeof updateProfile === "function") {
        await updateProfile(
          id,
          currentUser?.name,
          currentUser?.email,
          currentUser?.phone,
          currentUser?.addresses,
          nameInput.trim() || currentUser?.preferredName,
          surveyPayload
        ).catch((err) => console.warn("Lỗi lưu survey profile:", err));
      }

      const userKey = currentUser?.id || currentUser?._id || currentUser?.email || "user";
      sessionStorage.setItem(`glowskin_name_prompt_dismissed_${userKey}`, "true");
      localStorage.setItem(`glowskin_survey_completed_${userKey}`, "true");

      setIsNameModalOpen(false);
    } catch (err) {
      console.error("Lỗi lưu thông tin khảo sát:", err);
      setIsNameModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finish complete onboarding survey - ONLY WAY TO CLOSE MODAL & NAVIGATE TO RESULT
  const handleFinishOnboarding = async () => {
    stopCamera();
    setIsSubmitting(true);
    setAiAnalyzingStatus("📸 Đang tối ưu và chuẩn bị 3 góc chụp khuôn mặt...");
    const birthDateStr = currentUser?.birthDate || `${day}/${month}/${year}`;
    const effectiveSkinType = skinType || currentUser?.skinSurvey?.skinType || "Da hỗn hợp thiên dầu";
    const effectiveSkinSensitivity = skinSensitivity || currentUser?.skinSurvey?.skinSensitivity || "Bình thường";
    const effectiveBudget = budget || currentUser?.skinSurvey?.budget || "Từ 200-300k/sản phẩm.";
    const effectiveGender = gender || currentUser?.gender || "Khác";
    const effectiveMedical = hasMedical === "Có" && medicalDetail 
      ? `Có - ${medicalDetail}` 
      : (hasMedical || currentUser?.skinSurvey?.hasMedicalCondition || "Không");
    const effectivePrescription = hasPrescription === "Có" && prescriptionDetail 
      ? `Có - ${prescriptionDetail}` 
      : (hasPrescription || currentUser?.skinSurvey?.hasPrescriptionMedication || "Không");
    const effectiveSupplements = hasSupplements === "Có" && supplementsDetail 
      ? `Có - ${supplementsDetail}` 
      : (hasSupplements || currentUser?.skinSurvey?.hasSupplements || "Không");
    const effectiveBloodVessels = hasBloodVessels || currentUser?.skinSurvey?.hasBloodVessels || "Không";
    const effectiveProducts = (selectedProducts && selectedProducts.length > 0)
      ? selectedProducts
      : (currentUser?.skinSurvey?.selectedProducts || []);

    const surveyPayload = {
      gender: effectiveGender,
      birthDate: birthDateStr,
      city: selectedCity || currentUser?.city || "",
      skinSurvey: {
        budget: effectiveBudget,
        hasMedicalCondition: effectiveMedical,
        hasPrescriptionMedication: effectivePrescription,
        hasSupplements: effectiveSupplements,
        hasBloodVessels: effectiveBloodVessels,
        skinType: effectiveSkinType,
        skinSensitivity: effectiveSkinSensitivity,
        capturedFaces,
        selectedProducts: effectiveProducts
      },
      onboardingCompleted: true
    };

    try {
      const id = currentUser?.id || currentUser?._id || currentUser?.email;
      if (id && typeof updateProfile === "function") {
        await updateProfile(
          id,
          currentUser?.name,
          currentUser?.email,
          currentUser?.phone,
          currentUser?.addresses,
          nameInput.trim() || currentUser?.preferredName,
          surveyPayload
        ).catch((err) => console.warn("Lỗi lưu survey profile:", err));
      }

      setAiAnalyzingStatus("🧠 AI Gemini Vision đang quan sát trực diện, má trái & má phải...");

      // Gọi AI phân tích thực tế từ 3 bức ảnh mà người dùng vừa chụp!
      const aiResult = await analyzeMultiAngleSkinImages({
        frontImage: capturedFaces?.center,
        leftImage: capturedFaces?.left,
        rightImage: capturedFaces?.right,
        surveyData: {
          skinType: effectiveSkinType,
          skinSensitivity: effectiveSkinSensitivity,
          budget: effectiveBudget,
          gender: effectiveGender,
          birthDate: birthDateStr,
          hasMedicalCondition: effectiveMedical,
          hasPrescriptionMedication: effectivePrescription,
          hasSupplements: effectiveSupplements,
          hasBloodVessels: effectiveBloodVessels
        },
        selectedProducts: effectiveProducts
      });

      setAiAnalyzingStatus("✨ Đang tổng hợp dữ liệu lâm sàng & lộ trình Routine...");

      const parsedData = parseAnalysisResponse(aiResult?.content);
      const optImages = aiResult?.optimizedImages || capturedFaces;
      const primaryImage =
        optImages.front ||
        optImages.left ||
        optImages.right ||
        capturedFaces?.center ||
        capturedFaces?.left ||
        capturedFaces?.right ||
        "/images/skin-types/model_base.jpg";

      // Lấy zones từ AI trả về, nếu không có thì fallback sang template cá nhân hoá
      let detectedZones = parsedData.jsonData?.zones || [];
      if (!detectedZones.length) {
        const fallbackScan = buildPersonalizedScan(effectiveSkinType, effectiveSkinSensitivity, effectiveBudget, capturedFaces, effectiveProducts);
        detectedZones = fallbackScan.zones;
      }

      // Phân bổ góc nghiêng xoay tròn cho các vùng da
      const formattedZones = detectedZones.map((zone, idx) => ({
        ...zone,
        angle: zone.angle !== undefined ? zone.angle : -90 + (idx * 360) / detectedZones.length
      }));

      // Quét điểm tổn thương thực tế từ pixel ảnh chụp của người dùng
      const realVisionPoints = await detectBlemishesFromImagePixels(primaryImage);

      const diagResult = computeDiagnosticMetrics(
        {
          skinType: effectiveSkinType,
          skinSensitivity: effectiveSkinSensitivity,
          hasMedicalCondition: effectiveMedical,
          hasPrescriptionMedication: effectivePrescription,
          hasSupplements: effectiveSupplements,
          hasBloodVessels: effectiveBloodVessels
        },
        parsedData?.jsonData,
        realVisionPoints
      );

      const finalScanData = {
        id: "scan-" + Date.now(),
        date: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        score: parsedData.jsonData?.score || Math.round((diagResult.averageScore || 6.7) * 10),
        averageScore: diagResult.averageScore,
        detectedIssues: diagResult.detectedIssues,
        metrics: diagResult.metrics,
        scoreLabel: "Phân tích Da Liễu & AI Vision (3 Góc Mặt)",
        medicalReference: "Tiêu chuẩn Chăm Sóc Da Liễu",
        skinType: effectiveSkinType || "Da hỗn hợp thiên dầu",
        sensitivity: effectiveSkinSensitivity?.includes("Thường xuyên") || effectiveSkinSensitivity?.includes("Rất hay gặp") ? "Có" : "Không",
        image: primaryImage,
        faceAngles: {
          front: optImages.front || capturedFaces?.center || null,
          left: optImages.left || capturedFaces?.left || null,
          right: optImages.right || capturedFaces?.right || null
        },
        usedProducts: effectiveProducts || [],
        aiOverview: parsedData.overview || "Đã hoàn tất phân tích làn da từ 3 góc chụp thực tế.",
        overview: parsedData.overview,
        routine: parsedData.routine,
        ingredients: parsedData.ingredients,
        warning: parsedData.warning,
        summary: parsedData.jsonData?.summary || [
          { title: effectiveSkinType || "Da hỗn hợp", en: "(Skin Type)" },
          { title: `Độ nhạy cảm: ${effectiveSkinSensitivity || "Bình thường"}`, en: "(Sensitivity)" },
          { title: "Đã phân tích 3 góc", en: "(3-Angle Vision)" }
        ],
        zones: formattedZones,
        isDemo: aiResult?.isDemo || false
      };

      if (typeof saveLatestScan === "function") {
        await saveLatestScan(finalScanData);
      }

      const userKey = currentUser?.id || currentUser?._id || currentUser?.email || "user";
      sessionStorage.setItem(`glowskin_name_prompt_dismissed_${userKey}`, "true");
      localStorage.setItem(`glowskin_survey_completed_${userKey}`, "true");
      
      // Stop camera if running
      stopCamera();

      // Successfully completed: Close modal & Navigate to /your-skin
      setIsNameModalOpen(false);
      navigate("/your-skin");
    } catch (err) {
      console.error("Lỗi hoàn thành khảo sát:", err);
      const fallbackScan = buildPersonalizedScan(effectiveSkinType, effectiveSkinSensitivity, effectiveBudget, capturedFaces, effectiveProducts);
      if (typeof saveLatestScan === "function") {
        await saveLatestScan(fallbackScan);
      }
      stopCamera();
      setIsNameModalOpen(false);
      navigate("/your-skin");
    } finally {
      setIsSubmitting(false);
      setAiAnalyzingStatus("");
    }
  };

  // Scroll to top when changing steps
  useEffect(() => {
    if (surveyScrollRefStep5.current) {
      surveyScrollRefStep5.current.scrollTop = 0;
    }
  }, [step]);

  // Filter cities for Step 3
  const filteredCities = VIETNAM_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.trim().toLowerCase())
  );

  // Calculate Progress Percentage for the top progress line (9 steps: 0 to 8)
  const progressMap = { 0: 12, 1: 24, 2: 36, 3: 48, 4: 60, 5: 72, 6: 82, 7: 92, 8: 100 };
  const currentProgress = progressMap[currentStep] || 20;

  const handleCardWheel = (e) => {
    // If a bottom sheet is open, ONLY the bottom sheet should scroll, NOT the background survey!
    if (activeBottomSheet) return;

    const activeScrollEl =
      currentStep === 5
        ? surveyScrollRefStep5.current
        : currentStep === 4
        ? surveyScrollRef.current
        : null;
    if (activeScrollEl && !activeScrollEl.contains(e.target)) {
      activeScrollEl.scrollTop += e.deltaY;
    }
  };

  if (!isNameModalOpen) return null;

  return (
    <div ref={overlayRef} className="onboarding-modal-overlay">
      <div
        className={`onboarding-modal-card ${currentStep === 0 ? "intro-mode" : ""} ${currentStep === 1 ? "video-guide-mode" : ""} ${currentStep === 2 ? "camera-mode" : ""} ${currentStep === 5 ? "products-mode" : ""}`}
        onWheel={handleCardWheel}
      >
        
        {/* Top Header: Back Arrow & Sleek Progress Bar (Only for Step 3 to 5) */}
        {currentStep >= 3 && currentStep <= 5 && (
          <div className="onboarding-top-nav">
            <button
              type="button"
              className="onboarding-back-btn"
              onClick={handleBack}
              aria-label="Quay lại"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="onboarding-progress-track">
              <div
                className="onboarding-progress-fill"
                style={{ width: `${currentStep === 3 ? 35 : currentStep === 4 ? 70 : 100}%` }}
              ></div>
            </div>

            <button
              type="button"
              className="onboarding-top-close-btn"
              onClick={() => {
                stopCamera();
                setIsNameModalOpen(false);
              }}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        )}

        {/* Ambient Subtle Glow */}
        <div className="onboarding-ambient-glow"></div>

        {/* ================= STEP 0: MÀN HÌNH GIỚI THIỆU (SKINDEX Ai - 3 BƯỚC) ================= */}
        {currentStep === 0 && (
          <div className="onboarding-step-view onboarding-intro-view animate-fade">
            {/* Subtle Tech Grid Background */}
            <div className="onboarding-intro-tech-grid" aria-hidden="true">
              <svg className="onboarding-intro-grid-svg" viewBox="0 0 400 220" preserveAspectRatio="none">
                <line x1="20" y1="40" x2="380" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="20" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="20" y1="160" x2="380" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="80" y1="20" x2="80" y2="200" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="180" y1="20" x2="180" y2="200" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="280" y1="20" x2="280" y2="200" stroke="#f1f5f9" strokeWidth="1" />
                <circle cx="80" cy="40" r="2.5" fill="#cbd5e1" />
                <circle cx="180" cy="40" r="2.5" fill="#cbd5e1" />
                <circle cx="280" cy="40" r="2.5" fill="#cbd5e1" />
                <circle cx="80" cy="100" r="2.5" fill="#cbd5e1" />
                <circle cx="180" cy="100" r="2.5" fill="#cbd5e1" />
                <circle cx="280" cy="100" r="2.5" fill="#cbd5e1" />
                <circle cx="80" cy="160" r="2.5" fill="#cbd5e1" />
                <circle cx="180" cy="160" r="2.5" fill="#cbd5e1" />
                <circle cx="280" cy="160" r="2.5" fill="#cbd5e1" />
              </svg>
            </div>

            {/* Top Close Button */}
            <div className="onboarding-intro-top-bar">
              <button
                type="button"
                className="onboarding-intro-close-btn"
                onClick={() => setIsNameModalOpen(false)}
                title="Đóng"
                aria-label="Đóng"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Brand Title: GlowSkin AI */}
            <div className="onboarding-intro-brand">
              <h1 className="onboarding-intro-brand-name">
                Glow<span className="onboarding-brand-accent">Skin</span>
                <span className="onboarding-intro-brand-ai">AI</span>
              </h1>
            </div>

            {/* 3 Step Features */}
            <div className="onboarding-intro-steps-list">
              {/* Bước 1 */}
              <div className="onboarding-intro-step-item">
                <div className="onboarding-intro-step-icon-wrap pink">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8V5a1 1 0 0 1 1-1h3 M16 4h3a1 1 0 0 1 1 1v3 M20 16v3a1 1 0 0 1-1 1h-3 M8 20H5a1 1 0 0 1-1-1v-3" />
                    <circle cx="12" cy="10" r="3" fill="#f43f5e" stroke="none" />
                    <path d="M7 17c0-2.5 2.2-4 5-4s5 1.5 5 4" fill="#f43f5e" stroke="none" />
                  </svg>
                </div>
                <div className="onboarding-intro-step-content">
                  <h3 className="onboarding-intro-step-title">Bước 1</h3>
                  <p className="onboarding-intro-step-desc">Chụp ảnh khuôn mặt của bạn (3 góc chụp)</p>
                </div>
              </div>

              {/* Bước 2 */}
              <div className="onboarding-intro-step-item">
                <div className="onboarding-intro-step-icon-wrap purple">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="5" width="14" height="16" rx="2" strokeWidth="2" />
                    <line x1="8" y1="10" x2="13" y2="10" strokeWidth="2" />
                    <line x1="8" y1="14" x2="14" y2="14" strokeWidth="2" />
                    <path d="M14 18l5-5 2 2-5 5z" fill="#8b5cf6" stroke="none" />
                  </svg>
                </div>
                <div className="onboarding-intro-step-content">
                  <h3 className="onboarding-intro-step-title">Bước 2</h3>
                  <p className="onboarding-intro-step-desc">AI Gemini Vision chẩn đoán đa tầng các vùng da</p>
                </div>
              </div>

              {/* Bước 3 */}
              <div className="onboarding-intro-step-item">
                <div className="onboarding-intro-step-icon-wrap green">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" />
                    <polyline points="14 2 14 8 20 8" strokeWidth="2" />
                    <line x1="8" y1="13" x2="14" y2="13" strokeWidth="2" />
                    <circle cx="16" cy="18" r="4" fill="#10b981" stroke="none" />
                    <polyline points="14.5 18 15.5 19 17.5 17" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="onboarding-intro-step-content">
                  <h3 className="onboarding-intro-step-title">Bước 3</h3>
                  <p className="onboarding-intro-step-desc">Khám phá các đặc điểm da và gợi ý chu trình cá nhân hoá dành riêng cho bạn</p>
                </div>
              </div>
            </div>

            {/* Bottom Start Button */}
            <div className="onboarding-intro-bottom-action">
              <button
                type="button"
                className="onboarding-intro-start-btn"
                onClick={() => setStep(1)}
              >
                Bắt đầu
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 1: VIDEO HƯỚNG DẪN QUÉT MẶT (Không đeo vật cản và không make up) ================= */}
        {currentStep === 1 && (
          <div className="onboarding-video-guide-view animate-fade">
            {/* Top Close Button (Clean white X icon) */}
            <div className="onboarding-guide-top-bar">
              <button
                type="button"
                className="onboarding-guide-close-btn"
                onClick={() => {
                  stopCamera();
                  setIsNameModalOpen(false);
                }}
                aria-label="Đóng"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Video Player - Divided into 3 scenes */}
            <div className="onboarding-video-guide-media">
              <video
                key={videoGuideIndex}
                src={VIDEO_GUIDE_URLS[videoGuideIndex] || "/guide_step_1.mp4"}
                autoPlay
                loop
                muted
                playsInline
                className="onboarding-guide-video-player"
              />
            </div>

            {/* Bottom floating instruction card */}
            <div className="onboarding-video-guide-card">
              <div className="onboarding-guide-dots">
                <span
                  className={`onboarding-guide-dot ${videoGuideIndex === 0 ? "active" : ""}`}
                  onClick={() => setVideoGuideIndex(0)}
                ></span>
                <span
                  className={`onboarding-guide-dot ${videoGuideIndex === 1 ? "active" : ""}`}
                  onClick={() => setVideoGuideIndex(1)}
                ></span>
                <span
                  className={`onboarding-guide-dot ${videoGuideIndex === 2 ? "active" : ""}`}
                  onClick={() => setVideoGuideIndex(2)}
                ></span>
              </div>

              <p className="onboarding-video-guide-text">
                {videoGuideIndex === 0 && "Không đeo vật cản và không make up khi phân tích"}
                {videoGuideIndex === 1 && "Chụp ảnh ở nơi đủ ánh sáng"}
                {videoGuideIndex === 2 && "Chụp ảnh đúng khoảng cách, không quá xa hoặc quá gần"}
              </p>

              <button
                type="button"
                className="onboarding-guide-action-btn"
                onClick={handleVideoGuideNext}
              >
                {videoGuideIndex === 2 ? "Tôi đã hiểu" : "Tiếp tục"}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CAMERA CHỤP 3 HƯỚNG MẶT ================= */}
        {currentStep === 2 && !isSubmitting && (
          <div className="onboarding-camera-view animate-fade">
            {/* Top Bar */}
            <div className="onboarding-camera-top-bar">
              <button
                type="button"
                className="onboarding-camera-nav-btn"
                onClick={handleBack}
                aria-label="Quay lại"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <h3 className="onboarding-camera-title">
                {activeFaceAngle === "center" && "Chụp chính diện"}
                {activeFaceAngle === "left" && "Chụp bên trái"}
                {activeFaceAngle === "right" && "Chụp bên phải"}
              </h3>
              <button
                type="button"
                className="onboarding-camera-nav-btn"
                onClick={() => {
                  stopCamera();
                  setIsNameModalOpen(false);
                }}
                aria-label="Đóng"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Camera Viewfinder with Vector Face Guides */}
            <div className="onboarding-camera-viewport">
              {cameraError ? (
                <div className="onboarding-camera-error-wrap">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    className="onboarding-upload-trigger-btn"
                    onClick={() => cameraFileInputRef.current?.click()}
                  >
                    Chọn ảnh khuôn mặt từ máy
                  </button>
                </div>
              ) : (
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`onboarding-camera-feed ${facingMode === "user" ? "mirror-cam" : ""}`}
                />
              )}

              {/* Vector Face Outline Guide matching Image 1 & 2 */}
              <div className="onboarding-face-guide-overlay">
                <svg viewBox="0 0 400 440" className="onboarding-face-guide-svg">
                  {activeFaceAngle === "center" && (
                    <g>
                      <ellipse cx="200" cy="205" rx="145" ry="175" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                      <path d="M 200 155 L 200 225 Q 206 230 200 235" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                      <path d="M 152 285 Q 200 310 248 285" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                    </g>
                  )}
                  {activeFaceAngle === "left" && (
                    <g transform="rotate(-3 200 205)">
                      <ellipse cx="185" cy="205" rx="142" ry="175" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                      <path d="M 215 155 Q 205 195 240 225 Q 225 233 212 230" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                      <path d="M 172 286 Q 215 310 258 286" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                    </g>
                  )}
                  {activeFaceAngle === "right" && (
                    <g transform="rotate(3 200 205)">
                      <ellipse cx="215" cy="205" rx="142" ry="175" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                      <path d="M 185 155 Q 195 195 160 225 Q 175 233 188 230" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                      <path d="M 142 286 Q 185 310 228 286" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" />
                    </g>
                  )}
                </svg>
              </div>

              {/* Hidden file input */}
              <input
                ref={cameraFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </div>

            {/* Bottom 3 Face Angle Slots Row */}
            <div className="onboarding-camera-slots-row">
              {/* Slot 1: Left Face */}
              <div
                className={`onboarding-face-slot ${activeFaceAngle === "left" ? "active" : ""}`}
                onClick={() => setActiveFaceAngle("left")}
              >
                {capturedFaces.left ? (
                  <div className="onboarding-slot-thumb-wrap">
                    <img src={capturedFaces.left} alt="Góc trái" />
                    <button
                      type="button"
                      className="onboarding-slot-del-btn"
                      onClick={(e) => deleteCapturedFace("left", e)}
                      aria-label="Xóa"
                    >
                      −
                    </button>
                  </div>
                ) : (
                  <div className="onboarding-slot-placeholder left-icon">
                    <svg viewBox="0 0 100 100">
                      <path d="M 50 15 C 30 15 25 35 25 55 C 25 75 35 88 50 88 C 65 88 75 75 75 55 C 75 35 70 15 50 15 Z" fill="none" stroke="#ffffff" strokeWidth="3" />
                      <path d="M 45 42 Q 40 54 48 58" fill="none" stroke="#ffffff" strokeWidth="3" />
                      <path d="M 40 70 Q 48 76 56 70" fill="none" stroke="#ffffff" strokeWidth="3" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Slot 2: Center Face */}
              <div
                className={`onboarding-face-slot ${activeFaceAngle === "center" ? "active" : ""}`}
                onClick={() => setActiveFaceAngle("center")}
              >
                {capturedFaces.center ? (
                  <div className="onboarding-slot-thumb-wrap">
                    <img src={capturedFaces.center} alt="Chính diện" />
                    <button
                      type="button"
                      className="onboarding-slot-del-btn"
                      onClick={(e) => deleteCapturedFace("center", e)}
                      aria-label="Xóa"
                    >
                      −
                    </button>
                  </div>
                ) : (
                  <div className="onboarding-slot-placeholder center-icon">
                    <svg viewBox="0 0 100 100">
                      <ellipse cx="50" cy="50" rx="28" ry="36" fill="none" stroke="#ffffff" strokeWidth="3" />
                      <path d="M 50 38 L 50 56 Q 53 58 50 60" fill="none" stroke="#ffffff" strokeWidth="3" />
                      <path d="M 40 70 Q 50 76 60 70" fill="none" stroke="#ffffff" strokeWidth="3" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Slot 3: Right Face */}
              <div
                className={`onboarding-face-slot ${activeFaceAngle === "right" ? "active" : ""}`}
                onClick={() => setActiveFaceAngle("right")}
              >
                {capturedFaces.right ? (
                  <div className="onboarding-slot-thumb-wrap">
                    <img src={capturedFaces.right} alt="Góc phải" />
                    <button
                      type="button"
                      className="onboarding-slot-del-btn"
                      onClick={(e) => deleteCapturedFace("right", e)}
                      aria-label="Xóa"
                    >
                      −
                    </button>
                  </div>
                ) : (
                  <div className="onboarding-slot-placeholder right-icon">
                    <svg viewBox="0 0 100 100">
                      <path d="M 50 15 C 70 15 75 35 75 55 C 75 75 65 88 50 88 C 35 88 25 75 25 55 C 25 35 30 15 50 15 Z" fill="none" stroke="#ffffff" strokeWidth="3" />
                      <path d="M 55 42 Q 60 54 52 58" fill="none" stroke="#ffffff" strokeWidth="3" />
                      <path d="M 44 70 Q 52 76 60 70" fill="none" stroke="#ffffff" strokeWidth="3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="onboarding-camera-controls">
              <button
                type="button"
                className="onboarding-camera-side-btn"
                onClick={() => cameraFileInputRef.current?.click()}
                title="Tải ảnh từ máy"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </button>

              <button
                type="button"
                className="onboarding-shutter-btn"
                onClick={capturePhoto}
                aria-label="Chụp ảnh"
              >
                <span className="onboarding-shutter-inner"></span>
              </button>

              <button
                type="button"
                className="onboarding-camera-side-btn"
                onClick={toggleFacingMode}
                title="Lật camera"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"></path>
                  <path d="M4 8V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"></path>
                  <polyline points="10 14 12 16 14 14"></polyline>
                  <polyline points="10 10 12 8 14 10"></polyline>
                </svg>
              </button>
            </div>

            {/* Next Step trigger - Bắt buộc chụp đủ 3 góc mặt */}
            <div className="onboarding-camera-continue-bar">
              <button
                type="button"
                className={`onboarding-camera-continue-btn ${!canContinueFromCamera ? "disabled" : ""}`}
                disabled={!canContinueFromCamera || isSubmitting}
                onClick={() => {
                  stopCamera();
                  handleFinishOnboarding();
                }}
              >
                {isSubmitting ? (
                  <span className="onboarding-loading-state">
                    <span className="onboarding-spinner"></span>
                    <span>Đang phân tích 3 góc mặt...</span>
                  </span>
                ) : canContinueFromCamera ? (
                  "Phân tích làn da ngay"
                ) : (
                  `Chụp đủ 3 góc mặt để tiếp tục (${capturedAnglesCount}/3)`
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: MỨC CHI PHÍ & BỆNH LÝ ================= */}
        {currentStep === 3 && (
          <div className="onboarding-step-view animate-fade">
            <div
              ref={surveyScrollRef}
              className={`onboarding-scrollable-survey ${activeBottomSheet ? "survey-frozen" : ""}`}
            >
              
              {/* Question 1: Budget */}
              <div className="onboarding-survey-section">
                <h3 className="onboarding-survey-question">
                  Mức chi phí trung bình cho 1 sản phẩm chăm sóc da của bạn là bao nhiêu?
                </h3>
                <div className="onboarding-options-list">
                  {BUDGET_OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      className={`onboarding-choice-card ${budget === opt ? "selected" : ""}`}
                      onClick={() => setBudget(opt)}
                    >
                      <span className="onboarding-choice-label">{opt}</span>
                      <span className="onboarding-radio-circle"></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 2: Medical Condition */}
              <div className="onboarding-survey-section">
                <h3 className="onboarding-survey-question">
                  Bạn có đang mắc bệnh lý hoặc đang điều trị bệnh không?
                </h3>
                <div className="onboarding-options-list">
                  <div
                    className={`onboarding-choice-card ${hasMedical === "Có" ? "selected" : ""}`}
                    onClick={() => handleSelectMedical("Có")}
                  >
                    <div className="onboarding-choice-content">
                      <span className="onboarding-choice-label">Có</span>
                      {hasMedical === "Có" && medicalDetail && (
                        <span className="onboarding-choice-detail-hint">{medicalDetail}</span>
                      )}
                    </div>
                    <span className="onboarding-radio-circle"></span>
                  </div>

                  <div
                    className={`onboarding-choice-card ${hasMedical === "Không" ? "selected" : ""}`}
                    onClick={() => handleSelectMedical("Không")}
                  >
                    <span className="onboarding-choice-label">Không</span>
                    <span className="onboarding-radio-circle"></span>
                  </div>
                </div>
              </div>

              {/* Question 3: Prescription Drugs */}
              <div className="onboarding-survey-section">
                <h3 className="onboarding-survey-question">
                  Bạn có đang dùng thuốc kê đơn nào không?
                </h3>
                <div className="onboarding-options-list">
                  <div
                    className={`onboarding-choice-card ${hasPrescription === "Có" ? "selected" : ""}`}
                    onClick={() => handleSelectPrescription("Có")}
                  >
                    <div className="onboarding-choice-content">
                      <span className="onboarding-choice-label">Có</span>
                      {hasPrescription === "Có" && prescriptionDetail && (
                        <span className="onboarding-choice-detail-hint">{prescriptionDetail}</span>
                      )}
                    </div>
                    <span className="onboarding-radio-circle"></span>
                  </div>

                  <div
                    className={`onboarding-choice-card ${hasPrescription === "Không" ? "selected" : ""}`}
                    onClick={() => handleSelectPrescription("Không")}
                  >
                    <span className="onboarding-choice-label">Không</span>
                    <span className="onboarding-radio-circle"></span>
                  </div>
                </div>
              </div>

              {/* Question 4: Dietary Supplements, High-Dose Vitamins, Herbs */}
              <div className="onboarding-survey-section">
                <h3 className="onboarding-survey-question">
                  Bạn có đang dùng thực phẩm chức năng, vitamin liều cao hoặc thảo dược không?
                </h3>
                <div className="onboarding-options-list">
                  <div
                    className={`onboarding-choice-card ${hasSupplements === "Có" ? "selected" : ""}`}
                    onClick={() => handleSelectSupplements("Có")}
                  >
                    <div className="onboarding-choice-content">
                      <span className="onboarding-choice-label">Có</span>
                      {hasSupplements === "Có" && supplementsDetail && (
                        <span className="onboarding-choice-detail-hint">{supplementsDetail}</span>
                      )}
                    </div>
                    <span className="onboarding-radio-circle"></span>
                  </div>

                  <div
                    className={`onboarding-choice-card ${hasSupplements === "Không" ? "selected" : ""}`}
                    onClick={() => handleSelectSupplements("Không")}
                  >
                    <span className="onboarding-choice-label">Không</span>
                    <span className="onboarding-radio-circle"></span>
                  </div>
                </div>
              </div>

              {/* Question 5: Visible Blood Vessels */}
              <div className="onboarding-survey-section">
                <h3 className="onboarding-survey-question">
                  Da mặt của bạn có hiện mạch máu không?
                </h3>
                <div className="onboarding-options-list">
                  {YES_NO_OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      className={`onboarding-choice-card ${hasBloodVessels === opt ? "selected" : ""}`}
                      onClick={() => setHasBloodVessels(opt)}
                    >
                      <span className="onboarding-choice-label">{opt}</span>
                      <span className="onboarding-radio-circle"></span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="onboarding-bottom-action">
              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={!budget}
                onClick={() => setStep(4)}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: CHỌN DA PHÙ HỢP & ĐỘ NHẠY CẢM ================= */}
        {currentStep === 4 && (
          <div className="onboarding-step-view animate-fade">
            <div ref={surveyScrollRefStep5} className="onboarding-scrollable-survey">
              
              {/* Question 1: Skin Type with Face Cards */}
              <div className="onboarding-survey-section">
                <h2 className="onboarding-survey-question-main">
                  Chọn đáp án phù hợp nhất với bạn?
                </h2>
                <div className="onboarding-skin-type-list">
                  {SKIN_TYPE_OPTIONS.map((opt) => {
                    const isSelected = skinType === opt.label;
                    return (
                      <div
                        key={opt.id}
                        className={`onboarding-skin-type-card ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectSkinType(opt.label)}
                      >
                        <SkinTypeVisual
                          type={opt.type}
                          label={opt.label}
                          imageSrc={opt.img}
                          onScanClick={(src) => setPreviewSkinImage(src)}
                        />
                        <div className="onboarding-skin-card-bottom">
                          <span className="onboarding-skin-card-label">{opt.label}</span>
                          <span className="onboarding-radio-circle"></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question 2: Skin Sensitivity */}
              <div ref={sensitivitySectionRef} className="onboarding-survey-section">
                <h2 className="onboarding-survey-question-main sensitivity-question">
                  Da mặt của bạn đã từng bị mẩn đỏ, ngứa rát sau khi sử dụng mỹ phẩm, sản phẩm chăm sóc da mới hoặc khi thay đổi thời tiết chưa?
                </h2>
                <div className="onboarding-options-list">
                  {SKIN_SENSITIVITY_OPTIONS.map((opt) => {
                    const isSelected = skinSensitivity === opt;
                    return (
                      <div
                        key={opt}
                        className={`onboarding-choice-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setSkinSensitivity(opt)}
                      >
                        <span className="onboarding-choice-label">{opt}</span>
                        <span className="onboarding-radio-circle"></span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="onboarding-bottom-action">
              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={!skinType}
                onClick={() => { if (!skinSensitivity) { sensitivitySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); return; } setStep(5); }}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: SẢN PHẨM BẠN ĐANG DÙNG ================= */}
        {currentStep === 5 && (
          <div className="onboarding-step-view animate-fade">
            {/* Top Nav */}
            <div className="onboarding-header-simple">
              <button
                type="button"
                className="onboarding-back-btn"
                onClick={() => setStep(4)}
                aria-label="Quay lại"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <h2 className="onboarding-title-simple">Sản phẩm bạn đang dùng</h2>
              <div style={{ width: 36 }}></div>
            </div>

            {/* Search Input */}
            <div className="onboarding-search-box">
              <svg className="onboarding-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Nhập tên sản phẩm"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              {productSearch && (
                <button
                  type="button"
                  className="onboarding-clear-icon"
                  onClick={() => setProductSearch("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Trending Tag */}
            <div className="onboarding-trending-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              <span>Top sản phẩm tìm kiếm</span>
            </div>

            {/* Products List */}
            <div className="onboarding-products-scroll-list">
              {filteredProducts.map((prod) => {
                const isSelected = selectedProducts.some((p) => p.id === prod.id);
                return (
                  <div key={prod.id} className="onboarding-product-card-item">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="onboarding-product-item-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80&auto=format&fit=crop";
                      }}
                    />
                    <div className="onboarding-product-item-info">
                      <div className="onboarding-product-item-name">
                        <span className="onboarding-product-item-brand">{prod.brand}</span> {prod.name}
                      </div>
                      <div className="onboarding-product-item-meta">
                        {prod.category} • {prod.volume}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`onboarding-product-toggle-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSelectProduct(prod)}
                      aria-label={isSelected ? "Bỏ chọn" : "Chọn"}
                    >
                      {isSelected ? "✓" : "+"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action */}
            <div className="onboarding-bottom-action">
              <button
                type="button"
                className="onboarding-primary-btn"
                onClick={handleSaveSurveyOnly}
              >
                Hoàn tất khảo sát
              </button>
            </div>
          </div>
        )}

        {/* HIGH-TECH AI ANALYZING OVERLAY (3-ANGLE SCAN) */}
        {isSubmitting && (
          <div className="onboarding-ai-analyzing-overlay">
            <div className="onboarding-ai-card">
              <div className="onboarding-ai-radar-box">
                <div className="onboarding-ai-radar-sweep" />
                <div className="onboarding-ai-radar-sparkle">✨</div>
              </div>
              <h3 className="onboarding-ai-title">AI Vision Đang Phân Tích Làn Da</h3>
              <p className="onboarding-ai-subtitle">
                Hệ thống đang quan sát thực tế 3 góc khuôn mặt bạn vừa chụp
              </p>
              
              <div className="onboarding-ai-status-pill">
                <span className="onboarding-ai-spinner" />
                <span>{aiAnalyzingStatus || "Đang phân tích dữ liệu hình ảnh 3 góc..."}</span>
              </div>

              <div className="onboarding-ai-angle-preview">
                {capturedFaces?.center && (
                  <div className="onboarding-ai-angle-thumb active">
                    <img src={capturedFaces.center} alt="Chính diện" />
                    <span>Chính diện</span>
                  </div>
                )}
                {capturedFaces?.left && (
                  <div className="onboarding-ai-angle-thumb active">
                    <img src={capturedFaces.left} alt="Góc trái" />
                    <span>Má trái</span>
                  </div>
                )}
                {capturedFaces?.right && (
                  <div className="onboarding-ai-angle-thumb active">
                    <img src={capturedFaces.right} alt="Góc phải" />
                    <span>Má phải</span>
                  </div>
                )}
              </div>

              <div className="onboarding-ai-medical-badge">
                🩺 Tiêu chuẩn Chuyên Khoa Da Liễu • Phân tích chính xác 100% theo ảnh thật
              </div>
            </div>
          </div>
        )}

        {/* ================= BOTTOM SHEET SELECTION MODAL (Medical, Prescriptions, Supplements) ================= */}
        {activeBottomSheet && (
          <>
            <div
              className="onboarding-sheet-backdrop"
              onClick={handleDismissBottomSheet}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            <div
              className="onboarding-bottom-sheet"
              onWheel={(e) => e.stopPropagation()}
            >
              <div
                className="onboarding-sheet-handle-wrap"
                onClick={handleDismissBottomSheet}
                title="Đóng"
              >
                <div className="onboarding-sheet-handle"></div>
              </div>

              {activeBottomSheet === "medical" && (
                <>
                  <h4 className="onboarding-sheet-title">
                    Bạn hiện có đang mắc bệnh lý nào hoặc đang điều trị bệnh không?
                  </h4>
                  <div className="onboarding-sheet-list">
                    {MEDICAL_CONDITION_OPTIONS.map((item) => {
                      const isSelected = medicalDetail === item;
                      return (
                        <div
                          key={item}
                          className={`onboarding-sheet-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handlePickMedicalOption(item)}
                        >
                          <span className="onboarding-sheet-label">{item}</span>
                          <span className="onboarding-sheet-radio"></span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeBottomSheet === "prescription" && (
                <>
                  <h4 className="onboarding-sheet-title">
                    Bạn đang dùng thuốc kê đơn nào? (kể cả thuốc dùng ngắn hạn trong 1 tháng gần đây)
                  </h4>
                  <div className="onboarding-sheet-list">
                    {PRESCRIPTION_OPTIONS.map((item) => {
                      const isSelected = prescriptionDetail === item;
                      return (
                        <div
                          key={item}
                          className={`onboarding-sheet-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handlePickPrescriptionOption(item)}
                        >
                          <span className="onboarding-sheet-label">{item}</span>
                          <span className="onboarding-sheet-radio"></span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeBottomSheet === "supplements" && (
                <>
                  <h4 className="onboarding-sheet-title">
                    Bạn có đang dùng thực phẩm chức năng, vitamin liều cao hoặc thảo dược không?
                  </h4>
                  <div className="onboarding-sheet-list">
                    {SUPPLEMENT_OPTIONS.map((item) => {
                      const isSelected = supplementsDetail === item;
                      return (
                        <div
                          key={item}
                          className={`onboarding-sheet-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handlePickSupplementsOption(item)}
                        >
                          <span className="onboarding-sheet-label">{item}</span>
                          <span className="onboarding-sheet-radio"></span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* SKIN TYPE IMAGE INSPECTION LIGHTBOX (Pure image from file, NO text below) */}
        {previewSkinImage && (
          <div className="onboarding-image-lightbox-overlay" onClick={() => setPreviewSkinImage(null)}>
            <div className="onboarding-image-lightbox-container" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="onboarding-lightbox-close-btn"
                onClick={() => setPreviewSkinImage(null)}
                aria-label="Đóng"
              >
                ✕
              </button>
              <img
                src={previewSkinImage}
                alt="Chi tiết loại da"
                className="onboarding-lightbox-img"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
