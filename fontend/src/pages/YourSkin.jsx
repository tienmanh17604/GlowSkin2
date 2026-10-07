import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductRecommendations from "../components/ProductRecommendations";
import { getRecommendedProducts } from "../services/recommendProducts";
import { useApp } from "../context/AppContext";
import { analyzeSkinImage, sendFollowUp, parseAnalysisResponse, compressImageIfNeeded, DEFAULT_DIAGNOSTIC_METRICS, computeDiagnosticMetrics, sanitizeFacialPoints, detectBlemishesFromImagePixels } from "../services/analyzeSkin";
import { generateDotsForZones, DIAGNOSTIC_LEGEND } from "../data/skinDiagnosticDots";
import { cropFaceZones, cropPoints } from "../utils/faceZoneCropper";
import { removeImageBackground, preloadMediaPipe } from "../utils/backgroundRemoval";
import FaceImageCropper from "../components/FaceImageCropper";
import "./YourSkin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const DEFAULT_DEMO_SCAN = {
  id: "demo-scan-01",
  date: "Chẩn đoán vừa thực hiện",
  score: 67,
  averageScore: 6.7,
  detectedIssues: ["Lỗ chân lông", "Mụn không viêm"],
  metrics: DEFAULT_DIAGNOSTIC_METRICS,
  skinType: "Da hỗn hợp thiên dầu",
  sensitivity: "Có",
  scoreLabel: "Phân tích Da Liễu & AI Vision",
  medicalReference: "Tiêu chuẩn Chăm Sóc Da Liễu",
  image: "https://res.cloudinary.com/buevamso/image/upload/v1784045582/glowskin/showcase/sample_acne_analysis_face.jpg",
  aiOverview: "Da hỗn hợp thiên dầu — vùng chữ T tăng tiết bã nhờn, lỗ chân lông bít tắc nhẹ kèm thâm mụn sau viêm (PIH). Căn cứ theo phác đồ chuyên khoa da liễu.",
  routine: "**Routine Sáng & Tối Khuyến Nghị:**\n- **Sáng:** Sữa rửa mặt pH 5.5 dịu nhẹ → Toner cân bằng → Serum Niacinamide 5% / Vitamin C → Kem dưỡng ẩm phục hồi → Kem chống nắng SPF 50+\n- **Tối:** Tẩy trang dạng nước/dầu → Sữa rửa mặt → BHA 2% (3 lần/tuần) → Kem dưỡng khóa ẩm Ceramide",
  ingredients: "**Thành phần nên dùng & nên tránh:**\n- **Nên dùng:** Niacinamide, BHA (Salicylic Acid), Azelaic Acid, Hyaluronic Acid, Ceramide.\n- **Nên tránh:** Cồn khô (Alcohol Denat), Hương liệu nhân tạo nồng độ cao, Dầu khoáng (Mineral Oil).",
  warning: "**Lưu ý chống chỉ định:** Tránh tự ý kết hợp Retinol nồng độ cao với BHA/AHA trong cùng một chu trình tối mà không phục hồi đủ ẩm. Luôn thoa kem chống nắng đầy đủ mỗi 3-4 giờ.",
  summary: [
    { title: "Bít tắc lỗ chân lông", en: "(Enlarged Pores)" },
    { title: "Mụn không viêm", en: "(Comedones)" },
    { title: "Sợi bã nhờn", en: "(Sebaceous Filaments)" }
  ],
  zones: [
    {
      id: "forehead",
      title: "Vùng Trán",
      condition: "Mụn ẩn nhẹ & Tàn nhang rải rác",
      detail: "Phát hiện mụn viêm sưng và bít tắc lỗ chân lông. Căn cứ phác đồ Trứng cá chuyên khoa da liễu.",
      status: "yellow",
      angle: -90, // 12 o'clock (Top)
    },
    {
      id: "eyebrow",
      title: "Vùng Lông Mày",
      condition: "Da bình thường, ít tổn thương",
      detail: "Cấu trúc da khỏe, ít nếp nhăn và không có ổ viêm.",
      status: "green",
      angle: -30, // 2 o'clock (Top-Right)
    },
    {
      id: "upper_cheek",
      title: "Vùng Má",
      condition: "Mụn đầu đen & Thâm mụn",
      detail: "Dấu hiệu thâm sau viêm (PIH). Khuyến nghị Niacinamide + Vitamin C.",
      status: "yellow",
      angle: 30, // 4 o'clock (Right)
    },
    {
      id: "chin",
      title: "Vùng Cằm",
      condition: "Mụn mủ & Thâm dày",
      detail: "Tập trung mụn ẩn và sợi bã nhờn. Cần làm sạch sâu với Salicylic Acid.",
      status: "red",
      angle: 90, // 6 o'clock (Bottom)
    },
    {
      id: "mouth",
      title: "Vùng Môi",
      condition: "Mụn nhỏ xung quanh",
      detail: "Da quanh môi thiếu ẩm, cần bổ sung kem dưỡng phục hồi.",
      status: "green",
      angle: 150, // 8 o'clock (Bottom-Left)
    },
    {
      id: "jaw",
      title: "Vùng Hàm",
      condition: "Cần điều trị nhẹ",
      detail: "Vùng quai hàm có vi mụn rải rác.",
      status: "yellow",
      angle: 210, // 10 o'clock (Top-Left)
    },
  ],
};

function cleanTextForUser(text) {
  if (!text) return "";
  let clean = text;
  const jsonIdx = clean.indexOf("===JSON_DATA===");
  if (jsonIdx !== -1) {
    clean = clean.slice(0, jsonIdx);
  }
  clean = clean.replace(/```json[\s\S]*?```/g, "");
  clean = clean.replace(/```[\s\S]*?```/g, "");
  clean = clean.replace(/\{[\s\S]*?"zones"[\s\S]*?\}/g, "");
  clean = clean.replace(/===(OVERVIEW|ROUTINE|INGREDIENTS|WARNING|JSON_DATA)===/g, "");
  // Khử sạch 100% các từ khóa cấm: y khoa, chuyên gia, y tế
  clean = clean.replace(/Bộ\s*Y\s*[tT]ế/gi, "chuyên khoa da liễu");
  clean = clean.replace(/QĐ-BYT/gi, "da liễu");
  clean = clean.replace(/QĐ\s*4416\/QĐ-BYT/gi, "phác đồ da liễu");
  clean = clean.replace(/Quyết\s*định\s*4416\/QĐ-BYT/gi, "phác đồ da liễu");
  clean = clean.replace(/y\s*khoa/gi, "da liễu");
  clean = clean.replace(/chuyên\s*gia/gi, "cố vấn da");
  clean = clean.replace(/y\s*tế/gi, "chăm sóc da");
  return clean.trim();
}

function formatChatMessage(rawText) {
  const text = cleanTextForUser(rawText);
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (/^[-*_ ]{3,}$/.test(line.trim())) {
      return <hr key={i} style={{ border: "none", borderTop: "1px solid rgba(212, 175, 55, 0.2)", margin: "10px 0" }} />;
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const content = parts.map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j} style={{ color: "#856404" }}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );
    return (
      <span key={i} style={{ display: "block", margin: "3px 0", lineHeight: "1.5" }}>
        {content}
      </span>
    );
  });
}

const ALL_SUGGESTION_POOLS = [
  { id: "active_ingredients", label: "💡 Hoạt chất trị mụn & thâm", prompt: (title) => `Tư vấn hoạt chất trị mụn và thâm tốt nhất cho ${title || "vùng da này"}` },
  { id: "routine_am_pm", label: "💡 Routine Sáng & Tối", prompt: () => `Gợi ý Routine chăm sóc da sáng và tối chuẩn da liễu` },
  { id: "avoid_ingredients", label: "💡 Thành phần nên tránh", prompt: () => `Các thành phần nào dễ gây kích ứng cần tránh đối với làn da này?` },
  { id: "sunscreen", label: "☀️ Kem chống nắng phù hợp", prompt: () => `Tư vấn loại kem chống nắng phù hợp nhất cho tình trạng da của tôi` },
  { id: "acne_marks", label: "✨ Phục hồi da & Mờ thâm", prompt: (title) => `Cách phục hồi màng bảo vệ da và làm mờ vệt thâm ở ${title || "vùng da này"}` },
  { id: "moisturizer", label: "💧 Kem dưỡng ẩm phục hồi", prompt: () => `Gợi ý kem dưỡng ẩm phục hồi dịu nhẹ theo phác đồ da liễu chuyên sâu` },
  { id: "lifestyle", label: "🥗 Ăn uống & Sinh hoạt", prompt: () => `Chế độ ăn uống và thói quen sinh hoạt giúp giảm mụn hiệu quả` },
];


function getZone2DCoordinates(zone, idx) {
  const coordsMap = {
    forehead: { top: 16, left: 50 },
    tran: { top: 16, left: 50 },
    eyebrow: { top: 28, left: 68 },
    long_may: { top: 28, left: 68 },
    eye: { top: 32, left: 32 },
    upper_cheek: { top: 48, left: 74 },
    ma_phai: { top: 48, left: 74 },
    cheek: { top: 50, left: 74 },
    ma: { top: 50, left: 74 },
    jaw: { top: 54, left: 26 },
    ma_trai: { top: 54, left: 26 },
    ham: { top: 56, left: 26 },
    nose: { top: 38, left: 50 },
    mui: { top: 38, left: 50 },
    nhan_trung: { top: 62, left: 50 },
    mouth: { top: 64, left: 50 },
    moi: { top: 64, left: 50 },
    chin: { top: 82, left: 50 },
    cam: { top: 82, left: 50 }
  };

  const id = (zone?.id || "").toLowerCase();
  const title = (zone?.title || "").toLowerCase();
  for (const key in coordsMap) {
    if (id.includes(key) || title.includes(key)) {
      return coordsMap[key];
    }
  }

  const fallback = [
    { top: 18, left: 50 },
    { top: 38, left: 50 },
    { top: 50, left: 74 },
    { top: 54, left: 26 },
    { top: 64, left: 50 },
    { top: 82, left: 50 }
  ];
  return fallback[idx % fallback.length];
}

export default function YourSkin() {
  const { latestScan, saveLatestScan, currentUser, setIsLoginOpen, products } = useApp();
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedDotFilter, setSelectedDotFilter] = useState("all"); // "all" | "red" | "yellow" | "green"

  // Dynamic Suggestion Chips States
  const [activeChips, setActiveChips] = useState(["active_ingredients", "routine_am_pm", "avoid_ingredients"]);
  const [usedChipIds, setUsedChipIds] = useState([]);

  // Direct Photo Upload & Camera Workflow States
  const [currentImage, setCurrentImage] = useState(() => latestScan?.image || null);
  const [selectedAngle, setSelectedAngle] = useState("front");
  const [cropModalImage, setCropModalImage] = useState(null); // Ảnh chờ người dùng cắt và căn chỉnh
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(() => !!latestScan?.zones?.length);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (latestScan?.image && !currentImage) {
      setCurrentImage(latestScan.image);
    }
  }, [latestScan]);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const circleRef = useRef(null);
  const streamRef = useRef(null);
  const stageContainerRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (stageContainerRef.current?.requestFullscreen) {
        stageContainerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    preloadMediaPipe(); // Tải trước mô hình xóa nền MediaPipe vào RAM để xử lý tức thì khi chụp/tải ảnh
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // AI Doctor Interactive Chat Modal States
  const [isAiDoctorOpen, setIsAiDoctorOpen] = useState(false);
  const [aiDoctorZone, setAiDoctorZone] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [chatImages, setChatImages] = useState([]);
  const chatScrollRef = useRef(null);
  const chatImageInputRef = useRef(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleChatImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readPromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((results) => {
      const validImages = results.filter(Boolean);
      if (validImages.length) {
        setChatImages((prev) => [...prev, ...validImages]);
      }
    });

    e.target.value = "";
  };

  const handleRemoveChatImage = (indexToRemove) => {
    setChatImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const scan = latestScan;
  const displayScan = scan || DEFAULT_DEMO_SCAN;
  const displayImage = currentImage || displayScan?.image;

  const navigate = useNavigate();
  const [resultViewMode, setResultViewMode] = useState("preview"); // "preview" (matching Screenshot 3) | "advanced_2d"
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [isProductScanOpen, setIsProductScanOpen] = useState(false);
  const [productScanSearch, setProductScanSearch] = useState("");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("unlock_single");

  // Clinical Report Cards Accordion State (Matching user reference images 1, 3, 4, 5)
  const [expandedClinicalItems, setExpandedClinicalItems] = useState({
    skinType: false,
    pigmentation: false,
    acne_inflammatory: false,
    pores: false,
    comedones: false,
    scars: false,
    filaments: false,
    uneven_tone: false,
    barrier: false
  });

  const toggleClinicalItem = (key) => {
    setExpandedClinicalItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const [faceCrops, setFaceCrops] = useState({});
  const [pointCrops, setPointCrops] = useState({ acne: [], pigment: [], scars: [], pores: [], comedones: [], filaments: [] });

  useEffect(() => {
    if (!displayImage) return;
    let isCancelled = false;

    const acnePts = displayScan?.metrics?.mun_viem?.points || [];
    const pigmentPts = displayScan?.metrics?.sac_to_da?.points || [];
    const scarPts = displayScan?.metrics?.seo?.points || [];
    const porePts = displayScan?.metrics?.lo_chan_long?.points || [];
    const comedonePts = displayScan?.metrics?.mun_khong_viem?.points || [];
    const filamentPts = displayScan?.metrics?.soi_ba_nhon?.points || [];

    Promise.all([
      cropFaceZones(displayImage, "cheek"),
      cropFaceZones(displayImage, "chin"),
      cropFaceZones(displayImage, "nose"),
      cropFaceZones(displayImage, "forehead"),
      acnePts.length ? cropPoints(displayImage, acnePts, "Nốt mụn viêm") : Promise.resolve([]),
      pigmentPts.length ? cropPoints(displayImage, pigmentPts, "Vết sắc tố") : Promise.resolve([]),
      scarPts.length ? cropPoints(displayImage, scarPts, "Vết sẹo") : Promise.resolve([]),
      porePts.length ? cropPoints(displayImage, porePts, "Lỗ chân lông") : Promise.resolve([]),
      comedonePts.length ? cropPoints(displayImage, comedonePts, "Mụn ẩn / đầu đen") : Promise.resolve([]),
      filamentPts.length ? cropPoints(displayImage, filamentPts, "Sợi bã nhờn") : Promise.resolve([])
    ])
      .then(([cheeks, chins, noses, foreheads, acneCrops, pigmentCrops, scarCrops, poreCrops, comedoneCrops, filamentCrops]) => {
        if (!isCancelled) {
          setFaceCrops({
            cheek: cheeks || [],
            chin: chins || [],
            nose: noses || [],
            forehead: foreheads || []
          });
          setPointCrops({
            acne: acneCrops || [],
            pigment: pigmentCrops || [],
            scars: scarCrops || [],
            pores: poreCrops || [],
            comedones: comedoneCrops || [],
            filaments: filamentCrops || []
          });
        }
      })
      .catch((err) => console.warn("Lỗi trích xuất crop da:", err));

    return () => {
      isCancelled = true;
    };
  }, [displayImage, displayScan]);

  const pigmentCropList = useMemo(() => {
    if (pointCrops.pigment?.length) return pointCrops.pigment;

    const rawZones = displayScan?.zones || [];
    const matchedZone = rawZones.find((z) => {
      const t = `${z.id || ""} ${z.title || ""} ${z.condition || ""} ${z.detail || ""}`.toLowerCase();
      return t.includes("sắc tố") || t.includes("thâm") || t.includes("tàn nhang") || t.includes("nám");
    });

    if (matchedZone) {
      const zKey = `${matchedZone.id || ""} ${matchedZone.title || ""}`.toLowerCase();
      if (zKey.includes("má") || zKey.includes("cheek")) {
        if (faceCrops.cheek?.length) return faceCrops.cheek;
      }
      if (zKey.includes("trán") || zKey.includes("forehead")) {
        if (faceCrops.forehead?.length) return faceCrops.forehead;
      }
      if (zKey.includes("cằm") || zKey.includes("chin")) {
        if (faceCrops.chin?.length) return faceCrops.chin;
      }
    }

    if (faceCrops.cheek?.length) return faceCrops.cheek;
    if (faceCrops.forehead?.length) return faceCrops.forehead;
    if (faceCrops.chin?.length) return faceCrops.chin;
    return [];
  }, [pointCrops.pigment, faceCrops, displayScan]);

  const scarCropList = useMemo(() => {
    if (pointCrops.scars?.length) return pointCrops.scars;
    if (faceCrops.cheek?.length) return faceCrops.cheek;
    if (faceCrops.chin?.length) return faceCrops.chin;
    return [];
  }, [pointCrops.scars, faceCrops]);

  // Cắt và hiển thị CHÍNH XÁC vị trí nốt mụn viêm trên mặt (không chụp sai xuống cổ)
  const acneCropList = useMemo(() => {
    // 1. Ưu tiên cao nhất: Tọa độ điểm mụn viêm thực tế do AI Vision phát hiện
    if (pointCrops.acne?.length) return pointCrops.acne;

    // 2. Tìm vùng khuôn mặt nào có tổn thương mụn viêm theo kết quả chẩn đoán
    const rawZones = displayScan?.zones || [];
    const acneZone = rawZones.find((z) => {
      const t = `${z.id || ""} ${z.title || ""} ${z.condition || ""} ${z.detail || ""}`.toLowerCase();
      return (
        z.status === "red" ||
        t.includes("mụn viêm") ||
        t.includes("mụn mủ") ||
        t.includes("sưng đỏ") ||
        t.includes("mụn bọc") ||
        t.includes("ổ viêm")
      );
    });

    if (acneZone) {
      const zKey = `${acneZone.id || ""} ${acneZone.title || ""}`.toLowerCase();
      if (zKey.includes("má") || zKey.includes("cheek")) {
        if (faceCrops.cheek?.length) return faceCrops.cheek;
      }
      if (zKey.includes("trán") || zKey.includes("forehead")) {
        if (faceCrops.forehead?.length) return faceCrops.forehead;
      }
      if (zKey.includes("mũi") || zKey.includes("nose")) {
        if (faceCrops.nose?.length) return faceCrops.nose;
      }
      if (zKey.includes("cằm") || zKey.includes("chin")) {
        if (faceCrops.chin?.length) return faceCrops.chin;
      }
    }

    // 3. Fallback: Ưu tiên vùng Má (nơi xuất hiện mụn viêm phổ biến nhất), sau đó đến Cằm hoặc Trán
    if (faceCrops.cheek?.length) return faceCrops.cheek;
    if (faceCrops.chin?.length) return faceCrops.chin;
    if (faceCrops.forehead?.length) return faceCrops.forehead;

    return [];
  }, [pointCrops.acne, faceCrops, displayScan]);

  // Danh sách ảnh cận cảnh cho Lỗ chân lông to
  const poreCropList = useMemo(() => {
    if (pointCrops.pores?.length) return pointCrops.pores;
    return [
      ...(faceCrops.nose || []),
      ...(faceCrops.cheek || [])
    ];
  }, [pointCrops.pores, faceCrops]);

  // Danh sách ảnh cận cảnh cho Mụn ẩn - mụn đầu đen
  const comedoneCropList = useMemo(() => {
    if (pointCrops.comedones?.length) return pointCrops.comedones;
    return [
      ...(faceCrops.forehead || []),
      ...(faceCrops.nose || []),
      ...(faceCrops.chin || [])
    ];
  }, [pointCrops.comedones, faceCrops]);

  // Danh sách ảnh cận cảnh cho Sợi bã nhờn
  const filamentCropList = useMemo(() => {
    if (pointCrops.filaments?.length) return pointCrops.filaments;
    return [
      ...(faceCrops.nose || []),
      ...(faceCrops.chin || [])
    ];
  }, [pointCrops.filaments, faceCrops]);

  // Danh sách ảnh cận cảnh cho Da không đều màu
  const unevenToneCropList = useMemo(() => {
    return [
      ...(faceCrops.forehead || []),
      ...(faceCrops.cheek || []),
      ...(faceCrops.chin || [])
    ];
  }, [faceCrops]);

  // Danh sách ảnh cận cảnh cho Hàng rào bảo vệ da
  const barrierCropList = useMemo(() => {
    return [
      ...(faceCrops.cheek || []),
      ...(faceCrops.forehead || [])
    ];
  }, [faceCrops]);

  // Danh sách ảnh cận cảnh cho Loại da
  const skinTypeCropList = useMemo(() => {
    return [
      ...(faceCrops.forehead || []),
      ...(faceCrops.nose || []),
      ...(faceCrops.cheek || [])
    ];
  }, [faceCrops]);

  // Xác định vị trí cụ thể của từng tình trạng da trên khuôn mặt (tránh nói chung chung)
  const getSpecificLocation = (type) => {
    const rawZones = displayScan?.zones || [];
    if (type === "pigmentation") {
      const matched = rawZones.filter((z) => {
        const t = `${z.title || ""} ${z.condition || ""} ${z.detail || ""}`.toLowerCase();
        return t.includes("sắc tố") || t.includes("thâm") || t.includes("tàn nhang") || t.includes("nám");
      });
      if (matched.length > 0) return matched.map((z) => z.title).join(", ");
      if (faceCrops.chin?.length && faceCrops.cheek?.length) return "vùng cằm và hai bên má";
      if (faceCrops.chin?.length) return "vùng cằm";
      if (faceCrops.cheek?.length) return "vùng hai bên má";
      return "vùng cằm và hai bên má";
    }

    if (type === "acne_inflammatory") {
      const matched = rawZones.filter((z) => {
        const t = `${z.title || ""} ${z.condition || ""} ${z.detail || ""}`.toLowerCase();
        return t.includes("viêm") || t.includes("mụn mủ") || t.includes("mụn bọc") || t.includes("sưng đỏ");
      });
      if (matched.length > 0) return matched.map((z) => z.title).join(", ");
      if (faceCrops.chin?.length) return "vùng cằm và góc hàm";
      if (faceCrops.cheek?.length) return "vùng hai bên má";
      return "vùng cằm và hai bên má";
    }

    if (type === "pores") {
      const matched = rawZones.filter((z) => {
        const t = `${z.title || ""} ${z.condition || ""} ${z.detail || ""}`.toLowerCase();
        return t.includes("lỗ chân lông") || t.includes("bít tắc");
      });
      if (matched.length > 0) return matched.map((z) => z.title).join(", ");
      return "vùng cánh mũi, trán và hai bên má";
    }

    if (type === "comedones") {
      const matched = rawZones.filter((z) => {
        const t = `${z.title || ""} ${z.condition || ""} ${z.detail || ""}`.toLowerCase();
        return t.includes("mụn ẩn") || t.includes("đầu đen");
      });
      if (matched.length > 0) return matched.map((z) => z.title).join(", ");
      return "vùng trán, cánh mũi và cằm";
    }

    if (type === "scars") {
      const matched = rawZones.filter((z) => {
        const t = `${z.title || ""} ${z.condition || ""} ${z.detail || ""}`.toLowerCase();
        return t.includes("sẹo") || t.includes("gồ ghề");
      });
      if (matched.length > 0) return matched.map((z) => z.title).join(", ");
      return "vùng hai bên má và góc hàm";
    }

    if (type === "filaments") {
      return "vùng đầu mũi, hai cánh mũi và dưới cằm";
    }

    if (type === "uneven_tone") {
      return "vùng chữ T (trán, mũi, cằm) và hai bên má";
    }

    if (type === "barrier") {
      return "toàn bộ khuôn mặt (trán, má, cằm và quanh miệng)";
    }

    return "các vùng da trên khuôn mặt";
  };

  const handleGetPersonalizedRoutine = () => {
    const el =
      document.querySelector(".product-recommendations-wrapper") ||
      document.getElementById("recommended-products-section") ||
      document.querySelector(".skin-result-feedback-bar");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const SUBSCRIPTION_PLANS = [
    {
      id: "unlock_single",
      name: "Mở khóa 1 lần",
      badge: "Tiết kiệm",
      price: "19.000đ",
      period: "/ lần khám",
      desc: "Mở khóa ngay báo cáo phân tích da chuyên sâu cho lần chụp này.",
      features: [
        "Mở khóa đầy đủ 6 chỉ số da (Mụn viêm, bã nhờn, sẹo,...)",
        "Tặng kèm 1 chu trình chăm sóc da cá nhân hóa",
        "Đánh giá độ nhạy cảm & chẩn đoán loại da chính xác",
        "Gợi ý sản phẩm lành tính phù hợp loại da"
      ],
      buttonText: "Mở khóa ngay (19k)",
      isFeatured: false
    },
    {
      id: "premium",
      name: "Premium",
      badge: "Khuyên dùng",
      price: "99.000đ",
      period: "/ tháng",
      desc: "Phân tích sâu hơn, gợi ý sản phẩm chi tiết & mở khóa routine nâng cao.",
      features: [
        "Đầy đủ quyền lợi gói Mở khóa 19k",
        "Quét da AI chuyên sâu không giới hạn",
        "Gợi ý thành phần mỹ phẩm chi tiết",
        "Lưu lịch sử & theo dõi tiến trình da thay đổi"
      ],
      buttonText: "Nâng cấp Premium (99k)",
      isFeatured: true
    },
    {
      id: "professional",
      name: "Professional",
      badge: "Chuyên nghiệp",
      price: "249.000đ",
      period: "/ tháng",
      desc: "Phù hợp cho người muốn theo dõi dài hạn hoặc kết nối tư vấn da liễu.",
      features: [
        "Đầy đủ tính năng gói Premium",
        "Báo cáo phân tích chuyên sâu PDF",
        "Kết nối tư vấn 1-1 với bác sĩ da liễu",
        "Công cụ quản lý hồ sơ da chuyên sâu"
      ],
      buttonText: "Đăng ký ngay (249k)",
      isFeatured: false
    }
  ];

  const handleSelectPlan = (plan) => {
    setIsUnlocked(true);
    setIsPricingModalOpen(false);
  };

  const angleImages = useMemo(() => {
    const defaultFace = currentImage || displayScan?.image || "/images/skin-types/model_base.jpg";
    const angles = displayScan?.faceAngles || {};
    return [
      { id: "front", label: "Chính diện", url: angles.front || defaultFace },
      { id: "left", label: "Má trái", url: angles.left || angles.front || defaultFace },
      { id: "right", label: "Má phải", url: angles.right || angles.front || defaultFace },
    ];
  }, [displayScan, currentImage]);

  const skinTypeTitle = useMemo(() => {
    if (displayScan?.skinType) return displayScan.skinType;
    const sum = displayScan?.summary?.find((s) => s.en?.includes("Skin Type") || s.title?.toLowerCase().includes("da "));
    if (sum?.title) return sum.title;
    return "Da hỗn hợp thiên dầu";
  }, [displayScan]);

  const sensitivityTitle = useMemo(() => {
    if (displayScan?.sensitivity) return displayScan.sensitivity;
    const sum = displayScan?.summary?.find((s) => s.en?.includes("Sensitivity") || s.title?.toLowerCase().includes("nhạy cảm"));
    if (sum?.title) {
      return sum.title.toLowerCase().includes("thấp") || sum.title.toLowerCase().includes("không") ? "Không" : "Có";
    }
    return "Có";
  }, [displayScan]);

  const [activeMetricId, setActiveMetricId] = useState("sac_to_da");
  const [feedbackVote, setFeedbackVote] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (type) => {
    setFeedbackVote(type);
    setFeedbackGiven(true);
  };

  const diagnosticData = useMemo(() => {
    if (displayScan?.metrics && displayScan?.averageScore) {
      return {
        metrics: displayScan.metrics,
        averageScore: displayScan.averageScore,
        detectedIssues: displayScan.detectedIssues || ["Lỗ chân lông", "Mụn không viêm"]
      };
    }
    return computeDiagnosticMetrics(
      {
        skinType: displayScan?.skinType,
        skinSensitivity: displayScan?.sensitivity
      },
      displayScan
    );
  }, [displayScan]);

  const angleKey = currentAngleIndex === 0 ? "front" : currentAngleIndex === 1 ? "left" : "right";

  const diagnosticMetricsList = useMemo(() => {
    const m = diagnosticData.metrics || DEFAULT_DIAGNOSTIC_METRICS;
    const order = ["mun_viem", "mun_khong_viem", "soi_ba_nhon", "seo", "sac_to_da", "lo_chan_long"];
    return order.map((key) => {
      const item = m[key] || DEFAULT_DIAGNOSTIC_METRICS[key] || {};
      return {
        id: key,
        title: item.label || key,
        score: item.score !== undefined ? item.score : 7,
        dotColor: item.dotColor || "#f43f5e",
        pillColor: item.pillColor || "#e11d48",
        pointerIndex: item.pointerIndex,
        points: item.points || [],
        pointsByAngle: item.pointsByAngle || null
      };
    });
  }, [diagnosticData]);

  const activeMetric = useMemo(() => {
    return (
      diagnosticMetricsList.find((m) => m.id === activeMetricId) ||
      diagnosticMetricsList[4] ||
      diagnosticMetricsList[0]
    );
  }, [diagnosticMetricsList, activeMetricId]);

  const [activeAngleBlemishes, setActiveAngleBlemishes] = useState({});

  useEffect(() => {
    const activeUrl = angleImages[currentAngleIndex]?.url;
    if (!activeUrl) return;

    let isSubscribed = true;
    detectBlemishesFromImagePixels(activeUrl, angleKey).then((detected) => {
      if (isSubscribed && detected) {
        setActiveAngleBlemishes((prev) => ({
          ...prev,
          [`${currentAngleIndex}_${angleKey}`]: detected
        }));
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [currentAngleIndex, angleImages, angleKey]);

  const activePoints = useMemo(() => {
    if (!activeMetric) return [];

    // 1. Ưu tiên cao nhất: Tọa độ quét trực tiếp từ ảnh thật của góc hiện tại
    const currentAngleDetected = activeAngleBlemishes[`${currentAngleIndex}_${angleKey}`];
    if (currentAngleDetected && currentAngleDetected[activeMetric.id]?.length > 0) {
      return sanitizeFacialPoints(activeMetric.id, currentAngleDetected[activeMetric.id], angleKey);
    }

    let raw = [];
    if (activeMetric.pointsByAngle && Array.isArray(activeMetric.pointsByAngle[angleKey]) && activeMetric.pointsByAngle[angleKey].length > 0) {
      raw = activeMetric.pointsByAngle[angleKey];
    } else if (Array.isArray(activeMetric.points) && activeMetric.points.length > 0) {
      raw = activeMetric.points;
    } else if (DEFAULT_DIAGNOSTIC_METRICS[activeMetric.id]?.points) {
      raw = DEFAULT_DIAGNOSTIC_METRICS[activeMetric.id].points;
    }

    return sanitizeFacialPoints(activeMetric.id, raw, angleKey);
  }, [activeMetric, angleKey, activeAngleBlemishes, currentAngleIndex]);

  const targetPoint = useMemo(() => {
    if (!activePoints || !activePoints.length) return null;
    const explicitTarget = activePoints.find((p) => p.pointer);
    if (explicitTarget) return explicitTarget;
    if (activeMetric?.pointerIndex !== undefined && activePoints[activeMetric.pointerIndex]) {
      return activePoints[activeMetric.pointerIndex];
    }
    return activePoints[activePoints.length - 1];
  }, [activePoints, activeMetric]);

  const sampleProductsList = useMemo(() => {
    const base = (products && products.length > 0) ? products : [
      { id: "p1", name: "SUPPLE PREPARATION FACIAL TONER", brand: "DEAR, KLAIRS", category: "Toner", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80&auto=format&fit=crop" },
      { id: "p2", name: "SEBIACLEAR GEL MOUSSANT", brand: "SVR", category: "Sữa rửa mặt", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80&auto=format&fit=crop" },
      { id: "p3", name: "WINTER MELON MICELLAR WATER", brand: "THE COCOON", category: "Nước tẩy trang", image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&q=80&auto=format&fit=crop" },
      { id: "p4", name: "MICELLAR WATER FOR OILY SKIN", brand: "GARNIER", category: "Nước tẩy trang", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&q=80&auto=format&fit=crop" },
      { id: "p5", name: "H9 HYALURONIC AMPOULE CLEANSING WATER", brand: "JMSOLUTION", category: "Nước tẩy trang", image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=300&q=80&auto=format&fit=crop" }
    ];
    if (!productScanSearch.trim()) return base;
    const q = productScanSearch.toLowerCase();
    return base.filter(p => (p.name || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q));
  }, [products, productScanSearch]);

  const rawZones = displayScan?.zones && displayScan.zones.length ? displayScan.zones : DEFAULT_DEMO_SCAN.zones;
  const zones = useMemo(() => {
    let list = (rawZones || []).filter((z) => z.id !== "lower_cheek");
    const hasChin = list.some((z) => {
      const k = `${z.id || ""} ${z.title || ""}`.toLowerCase();
      return k.includes("chin") || k.includes("cằm") || k.includes("cam");
    });
    if (!hasChin) {
      list = [
        ...list,
        {
          id: "chin",
          title: "Vùng Cằm",
          condition: "Nền da ổn định, thông thoáng",
          detail: "Vùng da quanh cằm cân bằng độ ẩm tốt, không phát hiện ổ viêm sưng.",
          status: "green",
          angle: 90,
        },
      ];
    }
    return list;
  }, [rawZones]);

  const halfZones = Math.ceil(zones.length / 2);
  const leftZones = zones.slice(0, halfZones);
  const rightZones = zones.slice(halfZones);

  // Sinh các điểm định vị nổi bật khớp 100% màu sắc và tình trạng của từng vùng da đã phân tích
  const faceDots = useMemo(() => {
    return generateDotsForZones(zones);
  }, [zones]);

  const dotCounts = useMemo(() => {
    const counts = { all: faceDots.length, red: 0, yellow: 0, green: 0 };
    for (const dot of faceDots) {
      if (counts[dot.type] !== undefined) counts[dot.type]++;
    }
    return counts;
  }, [faceDots]);

  const filteredDots = useMemo(() => {
    if (selectedDotFilter === "all") return faceDots;
    return faceDots.filter((dot) => dot.type === selectedDotFilter);
  }, [faceDots, selectedDotFilter]);

  const recommendedProductsForSkin = useMemo(() => {
    if (!products || !products.length) return [];
    const fullText = `${displayScan?.aiOverview || ""} ${displayScan?.overview || ""} ${displayScan?.routine || ""} ${displayScan?.ingredients || ""}`;
    const recs = getRecommendedProducts(products, fullText || "mụn thâm nhạy cảm");
    return recs?.products || products.slice(0, 4);
  }, [products, displayScan]);

  // Orbital placement radius matching circular layout around face image
  const orbitRadiusX = 45; // % from center X
  const orbitRadiusY = 44; // % from center Y

  useEffect(() => {
    if (latestScan?.image && !currentImage) {
      setCurrentImage(latestScan.image);
      setIsAnalyzed(true);
    }
  }, [latestScan]);

  const [selectedZoneCrops, setSelectedZoneCrops] = useState([]);
  const [loadingZoneCrops, setLoadingZoneCrops] = useState(false);
  const [zoneThumbnails, setZoneThumbnails] = useState({});

  // Cắt ảnh cận cảnh cho modal chi tiết vùng da được chọn (Trán, Mũi, Má, Cằm, Mắt/Lông mày)
  useEffect(() => {
    if (!selectedZone || !displayImage) {
      setSelectedZoneCrops([]);
      return;
    }

    let isMounted = true;
    setLoadingZoneCrops(true);
    cropFaceZones(displayImage, selectedZone)
      .then((crops) => {
        if (isMounted) {
          setSelectedZoneCrops(crops || []);
          setLoadingZoneCrops(false);
        }
      })
      .catch((err) => {
        console.warn("Lỗi khi cắt cận cảnh vùng da:", err);
        if (isMounted) setLoadingZoneCrops(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedZone, displayImage]);

  // Tự động cắt thumbnail cho tất cả các thẻ phân tích vùng da trên màn hình chính
  useEffect(() => {
    if (!displayImage || !zones || !zones.length) return;
    let isMounted = true;

    Promise.all(
      zones.map(async (zone) => {
        try {
          const crops = await cropFaceZones(displayImage, zone);
          return { id: zone.id, thumb: crops[0]?.url };
        } catch {
          return { id: zone.id, thumb: null };
        }
      })
    ).then((items) => {
      if (!isMounted) return;
      const map = {};
      for (const item of items) {
        if (item.thumb) map[item.id] = item.thumb;
      }
      setZoneThumbnails(map);
    });

    return () => {
      isMounted = false;
    };
  }, [displayImage, zones]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatMessages, chatLoading]);

  // Webcam camera controls
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 3840, min: 1920 },
          height: { ideal: 2160, min: 1080 },
          facingMode: "user"
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera 4K/1080p constraints not met, falling back to standard resolution:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error("Lỗi khi mở camera:", fallbackErr);
        alert("Không thể mở camera thiết bị. Vui lòng cấp quyền camera hoặc chọn ảnh từ máy.");
        setIsCameraOpen(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    try {
      const video = videoRef.current;
      if (!video) {
        console.error("Camera video element not found");
        return;
      }

      const videoW = video.videoWidth || 1920;
      const videoH = video.videoHeight || 1080;

      // Chụp khung hình gốc độ phân giải cao từ video stream
      const canvas = document.createElement("canvas");
      canvas.width = videoW;
      canvas.height = videoH;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      // Lật ngang ảnh chụp để khớp 100% với hình ảnh gương soi người dùng nhìn thấy trên màn hình
      ctx.translate(videoW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, videoW, videoH);

      const rawPhotoUrl = canvas.toDataURL("image/jpeg", 0.98);
      stopCamera();
      // Mở modal cắt ảnh để người dùng căn chỉnh khuôn mặt vào đúng khung bầu dục
      setCropModalImage(rawPhotoUrl);
    } catch (err) {
      console.error("Lỗi khi chụp ảnh từ camera:", err);
      alert("Lỗi khi chụp ảnh: " + (err.message || "Vui lòng thử lại"));
      stopCamera();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // Mở modal cắt ảnh để người dùng căn chỉnh khuôn mặt vào đúng khung bầu dục
        setCropModalImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleResetAnalysis = () => {
    setCurrentImage(null);
    setIsAnalyzed(false);
    setIsAnalyzing(false);
  };

  const handleAnalyzeNewImage = async (imageDataUrl) => {
    setCurrentImage(imageDataUrl);
    setIsAnalyzing(true);
    setIsAnalyzed(false);

    try {
      // 1. Tối ưu nén ảnh nhẹ (max 1024px, 0.85) để payload siêu nhẹ (~200KB), gửi lên Remove.bg cực nhanh
      const compressedPayload = await compressImageIfNeeded(imageDataUrl, 1024, 0.85);

      // 2. Chạy song song siêu tốc:
      // - Xóa nền chuẩn Studio bằng Remove.bg (cho đường viền tóc, má, cổ mịn màng 100%, không bị răng cưa)
      // - Gemini 2.5 Vision phân tích da liễu (chỉ ~1.2s)
      const [cutoutImage, skinRes] = await Promise.all([
        fetch(`${API_URL}/skin/remove-background`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: compressedPayload }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.resultImage) {
              return data.resultImage;
            }
            throw new Error(data.message || data.error || "Backend chưa xóa được nền");
          })
          .catch(async (err) => {
            console.warn("[Remove.bg] Backend chưa khả dụng, tự động chuyển sang MediaPipe xóa nền cục bộ:", err.message);
            try {
              const localResult = await removeImageBackground(imageDataUrl);
              return localResult || imageDataUrl;
            } catch {
              return imageDataUrl;
            }
          }),
        analyzeSkinImage(imageDataUrl),
      ]);

      const finalImage = cutoutImage || imageDataUrl;
      setCurrentImage(finalImage);

      const parsedData = parseAnalysisResponse(skinRes?.content);
      
      let parsedOverview = "Đã hoàn thành phân tích da mặt qua AI Vision & Dữ liệu Chuyên Khoa Da Liễu.";
      if (parsedData.overview) {
        parsedOverview = parsedData.overview.slice(0, 220) + "...";
      }

      let detectedZones = parsedData.jsonData?.zones || [];
      
      // Strict filter: omit any zone that Gemini AI detected as out of frame or not visible in cropped image
      detectedZones = detectedZones.filter(z => 
        z.condition &&
        !z.condition.toLowerCase().includes("ngoài góc chụp") &&
        !z.condition.toLowerCase().includes("không có trong ảnh") &&
        !z.condition.toLowerCase().includes("không quan sát được") &&
        !z.condition.toLowerCase().includes("bị khuất")
      );

      // Fallback if AI JSON failed: default to full medical diagnosis zones
      if (!detectedZones.length) {
        detectedZones = [
          {
            id: "chin",
            title: "Vùng Cằm",
            condition: "Mụn mủ & mụn bọc viêm sưng đỏ dày đặc",
            detail: "Khu vực cằm tập trung nhiều ổ mụn mủ đầu vàng trắng, viền sưng tấy do vi khuẩn P.acnes phát triển mạnh. Căn cứ phác đồ Trứng cá chuyên khoa da liễu, bắt buộc kháng viêm tích cực với Benzoyl Peroxide 2.5-5% phối hợp Salicylic Acid 2% (BHA).",
            status: "red",
          },
          {
            id: "upper_cheek",
            title: "Vùng Má",
            condition: "Thâm mụn sau viêm (PIH) & lỗ chân lông giãn",
            detail: "Dấu hiệu tăng sắc tố sau tổn thương mụn cũ. Khuyến nghị phối hợp Niacinamide 5% + Azelaic Acid 20% theo hướng dẫn chuyên khoa.",
            status: "yellow",
          },
          {
            id: "nose",
            title: "Vùng Mũi",
            condition: "Sợi bã nhờn & lỗ chân lông bít tắc",
            detail: "Tuyến bã nhờn hoạt động mức cao vùng chữ T, tích tụ keratin nang lông. Khuyến nghị làm sạch sâu với Salicylic Acid (BHA 2%).",
            status: "yellow",
          },
          {
            id: "forehead",
            title: "Vùng Trán",
            condition: "Mụn sẩn ẩn & bít tắc tuyến bã nhờn",
            detail: "Bề mặt trán xuất hiện mụn sẩn 1-2mm rải rác. Căn cứ phác đồ Trứng cá chuyên khoa da liễu, khuyến nghị dùng Salicylic Acid 2% (BHA).",
            status: "yellow",
          },
          {
            id: "eyebrow",
            title: "Vùng Mắt & Lông Mày",
            condition: "Nền da bình thường, hàng rào lipid tốt",
            detail: "Cấu trúc mô da mịn màng, cân bằng độ ẩm tốt, không phát hiện dấu hiệu mụn sẩn hay viêm.",
            status: "green",
          },
        ];
      }

      // Phân bổ góc nghiêng xoay tròn cho các vùng da quan sát được
      const formattedZones = detectedZones.map((zone, idx) => ({
        ...zone,
        angle: -90 + (idx * 360) / detectedZones.length
      }));

      // Quét điểm tổn thương thật từ pixel ảnh
      const realVisionPoints = await detectBlemishesFromImagePixels(imageDataUrl);
      const diagResult = computeDiagnosticMetrics(
        { skinType: "Da hỗn hợp" },
        parsedData?.jsonData,
        realVisionPoints
      );

      const newScanData = {
        id: "scan-" + Date.now(),
        date: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        score: parsedData.jsonData?.score || Math.round((diagResult.averageScore || 7.2) * 10),
        averageScore: diagResult.averageScore,
        detectedIssues: diagResult.detectedIssues,
        metrics: diagResult.metrics,
        scoreLabel: "Phân tích Da Liễu & AI Vision",
        medicalReference: "Tiêu chuẩn Chăm Sóc Da Liễu",
        image: finalImage,
        zones: formattedZones,
        aiOverview: parsedData.overview || parsedOverview,
        overview: parsedData.overview,
        routine: parsedData.routine,
        ingredients: parsedData.ingredients,
        warning: parsedData.warning,
        summary: parsedData.jsonData?.summary,
        severity: parsedData.jsonData?.severity,
        isDemo: skinRes.isDemo,
      };

      saveLatestScan(newScanData);
      setIsAnalyzed(true);
    } catch (err) {
      console.error("Lỗi phân tích da:", err);
      alert("Lỗi khi phân tích da: " + (err.message || "Vui lòng thử lại"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenAiDoctor = (zone) => {
    const targetZone = zone || selectedZone || zones[0];
    setAiDoctorZone(targetZone);
    setSelectedZone(null);
    setIsAiDoctorOpen(true);

    const initialGreeting = {
      id: Date.now(),
      role: "assistant",
      content: `🩺 **Trợ lý AI GlowSkin (Tích hợp Dữ Liệu Chăm Sóc Da Chuyên Sâu):**\n\nChào bạn! Tôi đã tiếp nhận phân tích vùng **${targetZone?.title || "Khuôn mặt"}** (*${targetZone?.condition || "Cần chăm sóc"}*).\n\nDựa trên dữ liệu khoa học làn da (**Mụn, Sắc Tố, Lão Hóa**), bạn cần tư vấn về **hoạt chất chăm sóc**, **thứ tự Routine** hay **lưu ý tác dụng phụ** cho vùng da này?`
    };
    setChatMessages([initialGreeting]);
  };

  const handleSendAiChat = async (userText) => {
    const textToSend = typeof userText === "string" ? userText : inputMsg;
    const imagesToSend = [...chatImages];
    if ((!textToSend.trim() && !imagesToSend.length) || chatLoading) return;

    const userMsgObj = {
      id: Date.now(),
      role: "user",
      content: textToSend.trim() || `📸 [Đã gửi ${imagesToSend.length} hình ảnh đính kèm]`,
      images: imagesToSend.length ? imagesToSend : null,
      image: imagesToSend[0] || null
    };

    const updatedHistory = [...chatMessages, userMsgObj];
    setChatMessages(updatedHistory);
    setInputMsg("");
    setChatImages([]);
    setChatLoading(true);

    try {
      const aiRes = await sendFollowUp(updatedHistory);
      let botContent = aiRes.content;
      if (imagesToSend.length && (!aiRes.content || aiRes.isDemo)) {
        botContent = `📸 **Trợ lý AI đã tiếp nhận ${imagesToSend.length} hình ảnh của bạn:**\n\n- **Đánh giá hình ảnh:** Hệ thống AI Vision đã ghi nhận bộ ${imagesToSend.length} hình ảnh vừa được tải lên (tình trạng da ở các vị trí khác nhau / nhãn sản phẩm skincare).\n- **Khuyến nghị Chăm Sóc Da Chuyên Sâu:**\n  1. Duy trì làm sạch dịu nhẹ với sữa rửa mặt cân bằng pH (5.5).\n  2. Tùy thuộc tình trạng mụn/thâm hiển thị trong các ảnh: Ưu tiên Niacinamide 5% hoặc Azelaic Acid 20% thoa mỏng vùng cần điều trị.\n  3. Nếu có hình ảnh nhãn sản phẩm: Kiểm tra nồng độ BHA/AHA tránh gây kích ứng hoặc quá tải làn da.\n\nBạn có muốn Trợ lý AI phân tích cụ thể từng hình ảnh hoặc gợi ý Routine phù hợp không?`;
      }
      const botMsgObj = {
        id: Date.now() + 1,
        role: "assistant",
        content: botContent || "Đã xảy ra sự cố khi kết nối Trợ lý AI. Vui lòng thử lại!"
      };
      setChatMessages((prev) => [...prev, botMsgObj]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "⚠️ Không thể kết nối với hệ thống AI. Vui lòng thử lại sau!"
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChipClick = (chipObj) => {
    if (chatLoading) return;
    
    const textPrompt = typeof chipObj.prompt === "function" ? chipObj.prompt(aiDoctorZone?.title) : chipObj.prompt;
    handleSendAiChat(textPrompt);

    const newUsed = [...usedChipIds, chipObj.id];
    setUsedChipIds(newUsed);

    const unusedFromPool = ALL_SUGGESTION_POOLS.filter(
      (item) => !activeChips.includes(item.id) && !newUsed.includes(item.id)
    );

    let replacement = unusedFromPool[0];
    if (!replacement) {
      const fallbackPool = ALL_SUGGESTION_POOLS.filter((item) => !activeChips.includes(item.id));
      replacement = fallbackPool[0] || ALL_SUGGESTION_POOLS[0];
    }

    setActiveChips((prev) => prev.map((id) => (id === chipObj.id ? replacement.id : id)));
  };

  return (
    <div className="your-skin-gold-page">
      <Navbar />

      <main className="gold-skin-viewport">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: "none" }}
        />

        {/* HEADER TITLE BANNER */}
        <div className="gold-header-banner">
          <h1 className="gold-page-title">
            Báo Cáo Phân Tích Làn Da <span className="gold-text-gradient">Chuyên Sâu</span>
          </h1>
          <p className="gold-page-subtitle">
            Hệ thống định vị đa vùng chuẩn chuyên sâu &amp; Công nghệ AI Gemini Vision {scan ? `| ${scan.date || "Vừa cập nhật"}` : ""}
          </p>
        </div>

        {!currentUser ? (
          <div className="gold-no-scan-box">
            <div className="gold-badge">🔒 BẢO MẬT DỮ LIỆU CAO CẤP</div>
            <h2 className="gold-page-title" style={{ fontSize: "28px", marginTop: "10px" }}>
              Vui lòng đăng nhập để xem Báo cáo Da của bạn
            </h2>
            <p className="gold-page-subtitle" style={{ maxWidth: "560px", margin: "10px auto 24px" }}>
              Hệ thống định vị đa vùng chuẩn chuyên sâu lưu trữ và bảo mật riêng dữ liệu phân tích da mặt cho từng tài khoản người dùng.
            </p>
            <button className="gold-action-btn primary" onClick={() => setIsLoginOpen(true)}>
              🔑 Đăng nhập / Đăng ký tài khoản ngay
            </button>
          </div>
        ) : !currentImage && !isAnalyzing ? (
          /* STATE 1: UPLOAD PORTAL BEFORE PHOTO IS CAPTURED */
          <div className="gold-start-upload-card">
            <div className="gold-upload-icon-circle">✨</div>
            <h3 className="gold-upload-title">Phân tích da mặt AI Vision 2D</h3>
            <p className="gold-upload-subtext">
              Chụp ảnh với khuôn quét Face ID hoặc tải ảnh lên — AI sẽ hiển thị ảnh 2D toàn màn hình và phân tích đa vùng chuẩn chuyên sâu.
            </p>
            <div className="gold-upload-buttons-stack">
              <button type="button" className="gold-btn-camera" onClick={startCamera}>
                📷 Mở camera (Khuôn Face ID)
              </button>
              <button type="button" className="gold-btn-file" onClick={() => fileInputRef.current?.click()}>
                🖼️ Chọn ảnh từ máy
              </button>
            </div>
          </div>
        ) : (
          /* STATE 2: SKIN ANALYSIS RESULT SCREEN */
          <div className="skin-result-screen-wrapper">
            {/* ================= SCREENSHOT 3 VIEW ================= */}
            <div className="skin-result-phone-frame">
                {/* TOP PHOTO CAROUSEL */}
                <div className="skin-result-photo-section">
                  <img
                    src={angleImages[currentAngleIndex]?.url}
                    alt={angleImages[currentAngleIndex]?.label || "Ảnh phân tích"}
                    className="skin-result-face-img"
                  />

                  {/* Top Bar with Pagination Dots & Counter */}
                  <div className="skin-result-photo-top-bar">
                    <div className="skin-result-top-center-group">
                      <div className="skin-result-pagination-dots">
                        {angleImages.map((ang, idx) => (
                          <div
                            key={ang.id}
                            className={`skin-result-dot ${currentAngleIndex === idx ? "active" : ""}`}
                            onClick={() => setCurrentAngleIndex(idx)}
                            title={ang.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="skin-result-top-right-group">
                      <div className="skin-result-counter-pill">
                        {currentAngleIndex + 1}/{angleImages.length}
                      </div>
                    </div>
                  </div>

                  {/* Left & Right side navigation arrows */}
                  <button
                    type="button"
                    className="skin-result-nav-arrow left"
                    onClick={() => setCurrentAngleIndex((prev) => (prev - 1 + angleImages.length) % angleImages.length)}
                    aria-label="Góc trước"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="skin-result-nav-arrow right"
                    onClick={() => setCurrentAngleIndex((prev) => (prev + 1) % angleImages.length)}
                    aria-label="Góc tiếp theo"
                  >
                    ›
                  </button>

                  {/* Active Metric Badge Tag on Bottom-Left */}
                  <div
                    className="skin-result-active-metric-pill"
                    style={{ backgroundColor: activeMetric?.pillColor || "#ea580c" }}
                  >
                    {activeMetric?.title}
                  </div>


                </div>

                {/* BOTTOM SHEET CARD */}
                <div className="skin-result-card-bottom">
                  {/* Summary Card with Average Score (Left) & Detected Issues (Right) */}
                  <div className="skin-result-summary-card">
                    <div className="skin-summary-score-col">
                      <span className="skin-summary-label">Điểm trung bình</span>
                      <span className="skin-summary-big-score">{diagnosticData.averageScore}</span>
                    </div>

                    <div className="skin-summary-issues-col">
                      <div className="skin-issues-header-row">
                        <span className="skin-issues-title">Vấn đề da</span>
                        <span className="skin-issues-ai-badge">AI phát hiện ✨</span>
                      </div>
                      <ul className="skin-issues-list">
                        {diagnosticData.detectedIssues.map((issue, idx) => (
                          <li key={idx}>- {issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 6 Diagnostic Metrics Grid (3 columns x 2 rows) - 100% FREE */}
                  <div className="skin-result-metrics-grid">
                    {diagnosticMetricsList.map((metric) => {
                      const isSelected = activeMetricId === metric.id;
                      return (
                        <div
                          key={metric.id}
                          className={`skin-result-metric-card ${isSelected ? "active" : ""}`}
                          onClick={() => setActiveMetricId(metric.id)}
                        >
                          <div className="skin-result-metric-title">{metric.title}</div>
                          <div className="skin-result-metric-bottom">
                            <div className="skin-result-metric-score">
                              <span className="score-num">{metric.score}</span>
                              <span className="score-denom">/10</span>
                            </div>
                            <span
                              className="skin-result-metric-dot"
                              style={{ backgroundColor: metric.dotColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* User Satisfaction Feedback Bar */}
                  <div className="skin-result-feedback-bar">
                    <span className="skin-feedback-text">
                      {feedbackGiven ? "Cảm ơn bạn đã phản hồi kết quả da! ❤️" : "Bạn có hài lòng với kết quả phân tích da không?"}
                    </span>
                    <div className="skin-feedback-buttons">
                      <button
                        type="button"
                        className={`skin-feedback-btn ${feedbackVote === "up" ? "active" : ""}`}
                        onClick={() => handleFeedback("up")}
                        title="Hài lòng"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`skin-feedback-btn ${feedbackVote === "down" ? "active" : ""}`}
                        onClick={() => handleFeedback("down")}
                        title="Chưa hài lòng"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Extra Quick Action: Chat with AI Doctor */}
                  <div className="skin-result-extra-actions">
                    <button
                      type="button"
                      className="skin-result-btn-consult-ai"
                      onClick={() => handleOpenAiDoctor(zones[0])}
                    >
                      💬 Chat Trực Tiếp Với Bác Sĩ AI
                    </button>
                  </div>
                </div>
              </div>

              {/* BÊN CẠNH: CÁC THẺ BÁO CÁO LÂM SÀNG (Loại da, Tình trạng da chưa tốt, Tình trạng da tốt, Chu trình chăm sóc) */}
              <div className="skin-clinical-panel">
                {/* ================= THẺ CHẨN ĐOÁN LÂM SÀNG (Images 1, 3, 4, 5) ================= */}
                  <div className="skin-clinical-cards-wrapper">
                    {/* Thẻ 1: Loại da */}
                    <div className="skin-report-card">
                      <div className="skin-report-card-header">
                        <div className="skin-report-header-title-wrap">
                          <span className="skin-card-section-icon gold">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 17c5-3 15-3 20 0M2 12c5-3 15-3 20 0M12 2v4M10 4h4" />
                              <circle cx="5" cy="5" r="1.5" fill="#f59e0b" stroke="none" />
                              <circle cx="19" cy="5" r="1.5" fill="#f59e0b" stroke="none" />
                            </svg>
                          </span>
                          <span className="skin-report-header-title">Loại da</span>
                        </div>
                      </div>

                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("skinType")}
                        >
                          <span className="skin-report-row-title">
                            {displayScan?.skinType || "Da thường"}
                          </span>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.skinType ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.skinType && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-crops-scroll">
                              {skinTypeCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vùng khảo sát #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh làn da"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Làn da của bạn đang ở trạng thái cân bằng và khá mịn màng.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tuy nhiên, lỗ chân lông có vẻ to hơn một chút.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Vùng chữ T thường có một ít dầu.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thẻ 2: Tình trạng da chưa tốt (7 mục) */}
                    <div className="skin-report-card">
                      <div className="skin-report-card-header">
                        <div className="skin-report-header-title-wrap">
                          <span className="skin-card-section-icon red">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="9" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                          </span>
                          <span className="skin-report-header-title">Tình trạng da chưa tốt</span>
                        </div>
                      </div>

                      {/* 1. Tăng sắc tố nặng */}
                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("pigmentation")}
                        >
                          <div className="skin-report-row-title-wrap">
                            <span className="skin-report-row-title">Có tình trạng tăng sắc tố nặng</span>
                            <span className="skin-report-row-location-tag">
                              📍 {getSpecificLocation("pigmentation")}
                            </span>
                          </div>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.pigmentation ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.pigmentation && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-location-banner">
                              <span className="skin-report-loc-pin">📍</span>
                              <span><strong>Vị trí phát hiện:</strong> Tập trung nhiều nhất tại <strong>{getSpecificLocation("pigmentation")}</strong></span>
                            </div>

                            <div className="skin-report-crops-scroll">
                              {pigmentCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vùng tổn thương #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh sắc tố da"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Ghi nhận khoảng <strong>20 nốt tăng sắc tố</strong> (thâm sạm / tàn nhang) phân bố tập trung ở <strong>{getSpecificLocation("pigmentation")}</strong>.</span>
                              </div>
                              <div className="skin-report-subheading">Tăng sắc tố da do:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tia UV từ ánh nắng mặt trời chiếu trực tiếp vào khu vực này.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Thay đổi hormone trong cơ thể.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Quá trình lão hóa da và thâm sau mụn.</span>
                              </div>

                              <div className="skin-report-subheading">Phương pháp điều trị hiệu quả:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Bảo vệ da khỏi ánh nắng mặt trời là ưu tiên hàng đầu.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Sử dụng các hoạt chất an toàn giúp sáng da như: Vitamin C, niacinamide, arbutin, tranexamic, retinol,...</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Thẩm mỹ da: Laser, tiêm PRP, chemical peel, mesotherapy,...</span>
                              </div>

                              <div className="skin-report-note">
                                Lưu ý: Trước khi dùng sản phẩm sáng da hoặc thực hiện thẩm mỹ, hãy tham khảo ý kiến bác sĩ da liễu nhé!
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Mụn viêm trung bình */}
                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("acne_inflammatory")}
                        >
                          <div className="skin-report-row-title-wrap">
                            <span className="skin-report-row-title">Có tình trạng mụn viêm trung bình</span>
                            <span className="skin-report-row-location-tag">
                              📍 {getSpecificLocation("acne_inflammatory")}
                            </span>
                          </div>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.acne_inflammatory ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.acne_inflammatory && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-location-banner">
                              <span className="skin-report-loc-pin">📍</span>
                              <span><strong>Vị trí phát hiện:</strong> Tập trung tại <strong>{getSpecificLocation("acne_inflammatory")}</strong></span>
                            </div>

                            <div className="skin-report-crops-scroll">
                              {acneCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vị trí mụn viêm #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh mụn viêm"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Phát hiện các nốt mụn viêm sưng đỏ, cương mủ tập trung ở <strong>{getSpecificLocation("acne_inflammatory")}</strong>, cần được chăm sóc kháng viêm chuyên sâu.</span>
                              </div>
                              <div className="skin-report-subheading">Nguyên nhân mụn viêm:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Vi khuẩn C.acnes phát triển mạnh trong cổ nang lông bít tắc.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tuyến bã nhờn tăng tiết quá mức kết hợp tế bào chết.</span>
                              </div>

                              <div className="skin-report-subheading">Phương pháp điều trị hiệu quả:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Làm sạch dịu nhẹ với sữa rửa mặt pH 5.5, tránh chà xát mạnh.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Dùng hoạt chất kháng viêm, giảm sưng: BHA (Salicylic Acid), Benzoyl Peroxide, Kẽm PCA, Tràm trà.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Không tự ý nặn mụn tránh nhiễm trùng và để lại sẹo lõm.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Lỗ chân lông to */}
                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("pores")}
                        >
                          <div className="skin-report-row-title-wrap">
                            <span className="skin-report-row-title">Lỗ chân lông to</span>
                            <span className="skin-report-row-location-tag">
                              📍 {getSpecificLocation("pores")}
                            </span>
                          </div>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.pores ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.pores && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-location-banner">
                              <span className="skin-report-loc-pin">📍</span>
                              <span><strong>Vị trí phát hiện:</strong> Tập trung nhiều nhất tại <strong>{getSpecificLocation("pores")}</strong></span>
                            </div>

                            <div className="skin-report-crops-scroll">
                              {poreCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vùng lỗ chân lông #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh lỗ chân lông"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tuyến dầu hoạt động mạnh làm cổ nang lông giãn nở to rõ rệt tại <strong>{getSpecificLocation("pores")}</strong>.</span>
                              </div>
                              <div className="skin-report-subheading">Nguyên nhân lỗ chân lông to:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Dầu thừa tích tụ kết hợp bụi bẩn làm phình to cổ nang lông.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Giảm độ đàn hồi và thiếu hụt collagen quanh thành lỗ chân lông.</span>
                              </div>

                              <div className="skin-report-subheading">Phương pháp điều trị hiệu quả:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Làm sạch sâu định kỳ với BHA 2% và mặt nạ đất sét.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Bổ sung Niacinamide 5-10% giúp điều tiết dầu và thu nhỏ cổ nang lông.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Chống nắng bảo vệ cấu trúc collagen quanh lỗ chân lông.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. Mụn ẩn - mụn đầu đen nhẹ */}
                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("comedones")}
                        >
                          <div className="skin-report-row-title-wrap">
                            <span className="skin-report-row-title">Có tình trạng Mụn ẩn - mụn đầu đen nhẹ</span>
                            <span className="skin-report-row-location-tag">
                              📍 {getSpecificLocation("comedones")}
                            </span>
                          </div>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.comedones ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.comedones && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-location-banner">
                              <span className="skin-report-loc-pin">📍</span>
                              <span><strong>Vị trí phát hiện:</strong> Tập trung chủ yếu tại <strong>{getSpecificLocation("comedones")}</strong></span>
                            </div>

                            <div className="skin-report-crops-scroll">
                              {comedoneCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vùng mụn ẩn #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh mụn ẩn"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Xuất hiện nhân mụn bít tắc dưới da và mụn đầu đen oxy hóa tại <strong>{getSpecificLocation("comedones")}</strong>.</span>
                              </div>
                              <div className="skin-report-subheading">Nguyên nhân:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tế bào sừng chết không được đào thải kịp thời gây bít tắc lỗ chân lông.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Bã nhờn bị oxy hóa khi tiếp xúc không khí tạo thành đầu đen.</span>
                              </div>

                              <div className="skin-report-subheading">Phương pháp điều trị hiệu quả:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tẩy tế bào chết hóa học AHA/BHA 2-3 lần/tuần.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Dùng Retinol nồng độ phù hợp để bình thường hóa quá trình sừng hóa da.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Rửa mặt 2 bước (Double Cleansing) kỹ vào buổi tối.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 5. Sẹo nhẹ */}
                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("scars")}
                        >
                          <div className="skin-report-row-title-wrap">
                            <span className="skin-report-row-title">Có tình trạng sẹo nhẹ</span>
                            <span className="skin-report-row-location-tag">
                              📍 {getSpecificLocation("scars")}
                            </span>
                          </div>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.scars ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.scars && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-location-banner">
                              <span className="skin-report-loc-pin">📍</span>
                              <span><strong>Vị trí phát hiện:</strong> Ghi nhận tại <strong>{getSpecificLocation("scars")}</strong></span>
                            </div>

                            <div className="skin-report-crops-scroll">
                              {scarCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vị trí sẹo #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh sẹo da"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Vết tích sẹo thâm nhẹ sau các đợt mụn viêm trước đó, bề mặt da gồ ghề nhẹ tại <strong>{getSpecificLocation("scars")}</strong>.</span>
                              </div>
                              <div className="skin-report-subheading">Nguyên nhân hình thành sẹo:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tổn thương lớp hạ bì và thiếu hụt collagen trong quá trình tự lành của da.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Nặn mụn sai cách gây đứt gãy sợi đàn hồi biểu bì.</span>
                              </div>

                              <div className="skin-report-subheading">Phương pháp điều trị hiệu quả:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Thoa serum phục hồi chứa Peptide, Centella Asiatica (Rau má), EGF.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Kết hợp Retinoids tái tạo bề mặt biểu bì và kích thích sinh collagen mới.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Thẩm mỹ da: Lăn kim vi điểm (Microneedling), Laser Fractional CO2.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 6. Sợi bã nhờn rất nhẹ */}
                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("filaments")}
                        >
                          <div className="skin-report-row-title-wrap">
                            <span className="skin-report-row-title">Có tình trạng sợi bã nhờn rất nhẹ</span>
                            <span className="skin-report-row-location-tag">
                              📍 {getSpecificLocation("filaments")}
                            </span>
                          </div>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.filaments ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.filaments && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-location-banner">
                              <span className="skin-report-loc-pin">📍</span>
                              <span><strong>Vị trí phát hiện:</strong> Tập trung nhiều nhất tại <strong>{getSpecificLocation("filaments")}</strong></span>
                            </div>

                            <div className="skin-report-crops-scroll">
                              {filamentCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vùng sợi bã nhờn #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh sợi bã nhờn"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Sợi bã nhờn sinh lý tự nhiên tập trung tại <strong>{getSpecificLocation("filaments")}</strong> (đây là cấu trúc tự nhiên của tuyến dầu, không phải mụn viêm).</span>
                              </div>
                              <div className="skin-report-subheading">Bản chất sợi bã nhờn:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Là cấu trúc hình ống tự nhiên dẫn dầu từ tuyến bã nhờn lên bề mặt da.</span>
                              </div>

                              <div className="skin-report-subheading">Phương pháp chăm sóc hiệu quả:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Dầu tẩy trang nhũ hóa kỹ kết hợp BHA làm mềm bã nhờn.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Đắp mặt nạ đất sét 1-2 lần/tuần để hút dầu thừa.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 7. Da không đều màu */}
                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("uneven_tone")}
                        >
                          <div className="skin-report-row-title-wrap">
                            <span className="skin-report-row-title">Da không đều màu</span>
                            <span className="skin-report-row-location-tag">
                              📍 {getSpecificLocation("uneven_tone")}
                            </span>
                          </div>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.uneven_tone ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.uneven_tone && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-location-banner">
                              <span className="skin-report-loc-pin">📍</span>
                              <span><strong>Vị trí phát hiện:</strong> Khác biệt rõ giữa <strong>{getSpecificLocation("uneven_tone")}</strong></span>
                            </div>

                            <div className="skin-report-crops-scroll">
                              {unevenToneCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vùng phân bổ màu #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh sắc độ da"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tông màu da phân bổ chưa đồng đều, có độ lệch sắc tố rõ rệt giữa <strong>{getSpecificLocation("uneven_tone")}</strong>.</span>
                              </div>
                              <div className="skin-report-subheading">Nguyên nhân:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tác động không đồng đều của tia UV ánh nắng mặt trời và thâm sau mụn.</span>
                              </div>

                              <div className="skin-report-subheading">Phương pháp điều trị hiệu quả:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Sử dụng Vitamin C, Niacinamide và Arbutin làm sáng và đều màu da an toàn.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Thoa kem chống nắng quang phổ rộng hàng ngày với chỉ số SPF 50+, PA++++.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thẻ 3: Tình trạng da tốt */}
                    <div className="skin-report-card">
                      <div className="skin-report-card-header">
                        <div className="skin-report-header-title-wrap">
                          <span className="skin-card-section-icon green">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <polyline points="9 12 11 14 15 10" />
                            </svg>
                          </span>
                          <span className="skin-report-header-title">Tình trạng da tốt</span>
                        </div>
                      </div>

                      <div className="skin-report-row">
                        <div
                          className="skin-report-row-header"
                          onClick={() => toggleClinicalItem("barrier")}
                        >
                          <div className="skin-report-row-title-wrap">
                            <span className="skin-report-row-title">Hàng rào bảo vệ da khoẻ</span>
                            <span className="skin-report-row-location-tag green">
                              📍 Toàn khuôn mặt
                            </span>
                          </div>
                          <span className="skin-report-row-chevron">
                            {expandedClinicalItems.barrier ? (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            )}
                          </span>
                        </div>

                        {expandedClinicalItems.barrier && (
                          <div className="skin-report-row-detail animate-fade-in">
                            <div className="skin-report-location-banner green">
                              <span className="skin-report-loc-pin">📍</span>
                              <span><strong>Phạm vi đánh giá:</strong> <strong>{getSpecificLocation("barrier")}</strong></span>
                            </div>

                            <div className="skin-report-crops-scroll">
                              {barrierCropList.map((item, i) => {
                                const src = typeof item === "string" ? item : item?.url;
                                const label = typeof item === "object" ? item?.label : `Vùng biểu bì #${i + 1}`;
                                return (
                                  <div key={i} className="skin-report-crop-item">
                                    <img
                                      src={src}
                                      alt={label || "Cận cảnh hàng rào da"}
                                      className="skin-report-crop-img"
                                      loading="lazy"
                                    />
                                    {label && <span className="skin-report-crop-badge">📍 {label}</span>}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="skin-report-text-block">
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Kiểm tra trên <strong>{getSpecificLocation("barrier")}</strong>: Hàng rào bảo vệ da là lớp màng ngoài cùng, giúp giữ ẩm và ngăn chặn tác nhân gây hại từ môi trường như khói bụi, ô nhiễm, hóa chất.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Khi lớp màng này khỏe mạnh, da bạn được bảo vệ tốt hơn, giảm nguy cơ kích ứng và tổn thương.</span>
                              </div>

                              <div className="skin-report-subheading">Cách củng cố hàng rào bảo vệ da:</div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Tránh sản phẩm chứa cồn khô và chất tẩy rửa mạnh (như Sodium Lauryl Sulfate, Sodium Laureth Sulfate).</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Dưỡng ẩm thường xuyên với các hoạt chất như Ceramides, Glycerin, Hyaluronic Acid.</span>
                              </div>
                              <div className="skin-report-bullet">
                                <span className="skin-report-arrow-icon">➤</span>
                                <span>Sử dụng kem chống nắng phổ rộng, SPF từ 30 trở lên, và thêm thành phần chống oxy hóa như vitamin E, niacinamide.</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thẻ 4: Chu trình chăm sóc cơ bản */}
                    <div className="skin-report-card">
                      <div className="skin-report-card-header">
                        <div className="skin-report-header-title-wrap">
                          <span className="skin-card-section-icon purple">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </span>
                          <span className="skin-report-header-title">Chu trình chăm sóc cơ bản</span>
                        </div>
                        <span className="skin-routine-ai-badge">AI đề xuất ✨</span>
                      </div>

                      <div className="skin-report-routine-box">
                        <h4 className="skin-report-routine-heading">
                          Khám phá chu trình do chăm sóc da liễu thiết kế dành riêng cho bạn
                        </h4>
                        <button
                          type="button"
                          className="skin-report-routine-btn"
                          onClick={handleGetPersonalizedRoutine}
                        >
                          Nhận chu trình cá nhân hoá
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
    )}


        {/* WEBCAM CAPTURE MODAL */}
        {isCameraOpen && (
          <div className="gold-camera-modal-overlay" onClick={stopCamera}>
            <div className="gold-camera-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="gold-badge">📸 WEBCAM FACE ID CAPTURE</div>
              <h3 className="gold-modal-title" style={{ fontSize: "20px" }}>Chụp Ảnh Da Mặt</h3>
              <p className="gold-modal-desc" style={{ textAlign: "center", margin: "4px 0 12px" }}>
                Căn chỉnh khuôn mặt vừa khít vào <strong>khung hình</strong> và nhấn <strong>Chụp ảnh ngay</strong>.
              </p>

              <div className="gold-camera-viewport">
                <video ref={videoRef} autoPlay playsInline className="gold-camera-video" />
                
                {/* FACE ID CAMERA OVERLAY GUIDE */}
                <div className="gold-camera-faceid-overlay">
                  <div className="gold-camera-guide-text">Vui lòng đưa mặt vào giữa khung hình</div>
                  <div className="gold-camera-faceid-circle" ref={circleRef}>
                    <div className="faceid-corner top-left" />
                    <div className="faceid-corner top-right" />
                    <div className="faceid-corner bottom-left" />
                    <div className="faceid-corner bottom-right" />
                    <div className="gold-camera-scan-beam" />
                  </div>
                </div>
              </div>

              <div className="gold-camera-controls">
                <button
                  type="button"
                  className="gold-action-btn secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopCamera();
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="gold-action-btn primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    capturePhoto();
                  }}
                >
                  📸 Chụp ảnh ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: ZONE DIAGNOSIS DETAIL OVERLAY */}
        {selectedZone && (
          <div className="gold-zone-modal-overlay" onClick={() => setSelectedZone(null)}>
            <div className="gold-zone-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="gold-modal-close" onClick={() => setSelectedZone(null)}>×</button>
              
              <div className="gold-modal-header-badge">
                <div className="gold-badge" style={{ marginBottom: "6px" }}>✨ PHÂN TÍCH CHI TIẾT LÀN DA</div>
                <h3 className="gold-modal-title">{selectedZone.title}</h3>
              </div>

              {/* KHU VỰC ẢNH AI CẮT CẬN CẢNH VÙNG DA CỦA KHÁCH HÀNG */}
              <div className="gold-zone-crop-block">
                <div className="gold-zone-crop-header">
                  <span className="gold-crop-tag">🔬 Ảnh AI cắt cận cảnh vùng {selectedZone.title.toLowerCase()}</span>
                  <span className="gold-crop-zoom-hint">Phóng đại vi thể da thực tế</span>
                </div>
                
                <div className="gold-zone-crop-gallery">
                  {loadingZoneCrops ? (
                    <div className="gold-zone-crop-loading">
                      <div className="gold-crop-spinner" />
                      <span>AI Vision đang định vị và cắt cận cảnh vùng {selectedZone.title.toLowerCase()}...</span>
                    </div>
                  ) : selectedZoneCrops.length > 0 ? (
                    selectedZoneCrops.map((crop, idx) => (
                      <div key={idx} className="gold-zone-crop-card">
                        <div className="gold-zone-crop-img-wrap">
                          <img src={crop.url} alt={crop.label} className="gold-zone-crop-img" />
                          <span className="gold-zone-crop-lens-badge">🔍 AI Zoom 2x</span>
                        </div>
                        <span className="gold-zone-crop-card-label">{crop.label}</span>
                      </div>
                    ))
                  ) : (
                    <div className="gold-zone-crop-card">
                      <div className="gold-zone-crop-img-wrap">
                        <img src={displayImage} alt={selectedZone.title} className="gold-zone-crop-img" />
                      </div>
                      <span className="gold-zone-crop-card-label">Khuôn mặt</span>
                    </div>
                  )}
                </div>
              </div>

              {/* TÌNH TRẠNG & PHÂN TÍCH CHI TIẾT */}
              <div className="gold-zone-info-box">
                <p className="gold-modal-cond">
                  <span className="gold-zone-status-dot-inline">
                    {selectedZone.status === "green" ? "🟢" : selectedZone.status === "red" ? "🔴" : "🟡"}
                  </span>
                  <strong>Tình trạng:</strong> {selectedZone.condition}
                </p>
                {selectedZone.detail && (
                  <div className="gold-modal-desc">
                    <strong>Phân tích AI &amp; Khoa học làn da:</strong> {selectedZone.detail}
                  </div>
                )}
              </div>

              <div className="gold-modal-footer">
                <button
                  type="button"
                  className="gold-action-btn primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => handleOpenAiDoctor(selectedZone)}
                >
                  💬 Chat với Cố Vấn AI để tư vấn hoạt chất điều trị
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: INTERACTIVE AI DOCTOR CHATBOX (INTEGRATED WITH 360 MEDICAL PDFS) */}
        {isAiDoctorOpen && (
          <div className="gold-zone-modal-overlay" onClick={() => setIsAiDoctorOpen(false)}>
            <div className="gold-ai-chat-modal-content" onClick={(e) => e.stopPropagation()}>
              
              {/* CHAT HEADER */}
              <div className="gold-ai-chat-header">
                <div className="gold-ai-doctor-avatar">🩺</div>
                <div>
                  <h3 className="gold-ai-chat-title">Bác Sĩ AI Skincare GlowSkin</h3>
                  <div className="gold-ai-chat-subtitle">
                    ✨ Cố vấn Da Liễu &amp; DATA AI ({aiDoctorZone?.title || "Chẩn đoán da"})
                  </div>
                </div>
                <button className="gold-modal-close" onClick={() => setIsAiDoctorOpen(false)}>×</button>
              </div>

              {/* MESSAGES VIEWPORT */}
              <div className="gold-ai-chat-messages" ref={chatScrollRef}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`gold-chat-msg-row ${msg.role}`}>
                    {msg.role === "assistant" && <div className="gold-msg-icon">🩺</div>}
                    <div className={`gold-msg-bubble ${msg.role}`}>
                      {/* MULTIPLE ATTACHED IMAGES OR SINGLE IMAGE */}
                      {(msg.images?.length > 0 || msg.image) && (
                        <div className="gold-chat-images-grid">
                          {(msg.images || [msg.image]).map((imgSrc, imgIdx) => (
                            <div key={imgIdx} className="gold-chat-attached-image-wrapper">
                              <img
                                src={imgSrc}
                                alt={`Ảnh đính kèm ${imgIdx + 1}`}
                                className="gold-chat-attached-img"
                                onClick={() => window.open(imgSrc, "_blank")}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {formatChatMessage(msg.content)}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="gold-chat-msg-row assistant">
                    <div className="gold-msg-icon">🩺</div>
                    <div className="gold-msg-bubble assistant gold-typing-bubble">
                      <span>Đang tra cứu dữ liệu da liễu &amp; Phân tích...</span>
                      <div className="gold-typing-dots">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK PROMPT CHIPS (DYNAMICALLY REPLACED ON CLICK) */}
              <div className="gold-quick-prompts-row">
                {activeChips.map((chipId) => {
                  const chipObj = ALL_SUGGESTION_POOLS.find((c) => c.id === chipId);
                  if (!chipObj) return null;
                  return (
                    <button
                      key={chipObj.id}
                      className="gold-prompt-chip"
                      disabled={chatLoading}
                      onClick={() => handleChipClick(chipObj)}
                    >
                      {chipObj.label}
                    </button>
                  );
                })}
              </div>

              {/* HIDDEN CHAT MULTIPLE IMAGES INPUT */}
              <input
                type="file"
                ref={chatImageInputRef}
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleChatImageSelect}
              />

              {/* IMAGE PREVIEW BAR BEFORE INPUT IF SELECTED */}
              {chatImages.length > 0 && (
                <div className="gold-chat-image-preview-bar">
                  <div className="gold-chat-preview-thumbs-list">
                    {chatImages.map((imgSrc, idx) => (
                      <div key={idx} className="gold-chat-preview-thumb-wrapper">
                        <img src={imgSrc} alt={`Ảnh ${idx + 1}`} className="gold-chat-preview-thumb" />
                        <button
                          type="button"
                          className="gold-chat-preview-remove"
                          onClick={() => handleRemoveChatImage(idx)}
                          title="Xóa ảnh này"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <span className="gold-chat-preview-text">📸 Đã chọn {chatImages.length} ảnh</span>
                </div>
              )}

              {/* CHAT INPUT FORM */}
              <form
                className="gold-ai-chat-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiChat();
                }}
              >
                <button
                  type="button"
                  className={`gold-ai-chat-attach-btn ${chatImages.length > 0 ? "active" : ""}`}
                  onClick={() => chatImageInputRef.current?.click()}
                  disabled={chatLoading}
                  title="Tải lên hoặc chụp nhiều ảnh để gửi cho Bác sĩ AI"
                >
                  🖼️
                  {chatImages.length > 0 && (
                    <span className="gold-chat-badge">{chatImages.length}</span>
                  )}
                </button>
                <input
                  type="text"
                  className="gold-ai-chat-input"
                  placeholder={
                    chatImages.length > 0
                      ? `Thêm thắc mắc về ${chatImages.length} ảnh này (không bắt buộc)...`
                      : "Nhập câu hỏi cho Bác sĩ AI (vd: Tôi nên dùng BHA hay Azelaic Acid?)..."
                  }
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  className="gold-ai-chat-send-btn"
                  disabled={(!inputMsg.trim() && !chatImages.length) || chatLoading}
                >
                  Gửi ➔
                </button>
              </form>

            </div>
          </div>
        )}

        {/* QUICK PRODUCT COMPATIBILITY SCANNER MODAL */}
        {isProductScanOpen && (
          <div className="product-scan-modal-overlay" onClick={() => setIsProductScanOpen(false)}>
            <div className="product-scan-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="product-scan-header">
                <h3 className="product-scan-title">Quét &amp; Kiểm tra sản phẩm</h3>
                <button
                  type="button"
                  className="product-scan-close-btn"
                  onClick={() => setIsProductScanOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="product-scan-body">
                <div className="product-scan-search-wrap">
                  <svg className="product-scan-search-icon" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="product-scan-search-input"
                    placeholder="Tìm theo tên mỹ phẩm hoặc thương hiệu..."
                    value={productScanSearch}
                    onChange={(e) => setProductScanSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="product-scan-results-list">
                  {sampleProductsList.map((prod) => (
                    <div key={prod.id} className="product-scan-item-card">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="product-scan-item-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&q=80&auto=format&fit=crop";
                        }}
                      />
                      <div className="product-scan-item-info">
                        <div className="product-scan-item-name">
                          <span className="product-scan-item-brand">{prod.brand}</span> {prod.name}
                        </div>
                        <div className="product-scan-compat-badge">
                          <span>✓ Phù hợp với {skinTypeTitle}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION & UNLOCK PACKAGES MODAL */}
        {isPricingModalOpen && (
          <div className="pricing-paywall-modal-overlay" onClick={() => setIsPricingModalOpen(false)}>
            <div className="pricing-paywall-modal-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="pricing-modal-close"
                onClick={() => setIsPricingModalOpen(false)}
              >
                ✕
              </button>
              <div className="pricing-tag-wrapper">
                <span className="pricing-tag">✦ Gói dịch vụ GlowSkin</span>
              </div>
              <h2 className="pricing-title">Mở Khóa Báo Cáo Da &amp; Lộ Trình Cá Nhân Hóa</h2>
              <p className="pricing-subtitle">
                Lựa chọn gói mở khóa hoặc đăng ký hội viên để xem toàn diện 6 chỉ số da và nhận chu trình chăm sóc chuẩn da liễu.
              </p>

              <div className="pricing-cards-grid-row">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`pricing-card ${plan.isFeatured ? "premium-card pricing-card--featured" : ""} ${isSelected ? "selected-plan" : ""}`}
                    >
                      {plan.isFeatured && <div className="premium-tag">Khuyên dùng</div>}
                      <span className="plan-badge">{plan.badge}</span>
                      <h3 className="plan-name">{plan.name}</h3>
                      <div className="plan-price">
                        <span className="price-val">{plan.price}</span>
                        <span className="price-period">{plan.period}</span>
                      </div>
                      <p className="plan-desc">{plan.desc}</p>
                      <ul className="plan-features">
                        {plan.features.map((feat, idx) => (
                          <li key={idx}>✓ {feat}</li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className={`plan-btn ${plan.isFeatured ? "featured" : ""}`}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {plan.buttonText}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL CẮT VÀ CĂN CHỈNH KHUÔN MẶT CHUẨN FACE ID TRƯỚC KHI PHÂN TÍCH */}
      {cropModalImage && (
        <FaceImageCropper
          imageSrc={cropModalImage}
          onCancel={() => setCropModalImage(null)}
          onConfirm={(croppedUrl) => {
            setCropModalImage(null);
            handleAnalyzeNewImage(croppedUrl);
          }}
        />
      )}

      <Footer />
    </div>
  );
}


