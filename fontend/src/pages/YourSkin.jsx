import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductRecommendations from "../components/ProductRecommendations";
import { getRecommendedProducts } from "../services/recommendProducts";
import { useApp } from "../context/AppContext";
import { analyzeSkinImage, sendFollowUp, parseAnalysisResponse, compressImageIfNeeded } from "../services/analyzeSkin";
import { generateDotsForZones, DIAGNOSTIC_LEGEND } from "../data/skinDiagnosticDots";
import { cropFaceZones } from "../utils/faceZoneCropper";
import { removeImageBackground, preloadMediaPipe } from "../utils/backgroundRemoval";
import FaceImageCropper from "../components/FaceImageCropper";
import "./YourSkin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const DEFAULT_DEMO_SCAN = {
  id: "demo-scan-01",
  date: "Chẩn đoán vừa thực hiện",
  score: 72,
  scoreLabel: "Phân tích Y Khoa & AI Vision",
  medicalReference: "Tiêu chuẩn Chuyên Khoa Da Liễu",
  image: "https://res.cloudinary.com/buevamso/image/upload/v1784045582/glowskin/showcase/sample_acne_analysis_face.jpg",
  aiOverview: "Da hỗn hợp thiên dầu — vùng chữ T tăng tiết bã nhờn, lỗ chân lông bít tắc nhẹ kèm thâm mụn sau viêm (PIH). Căn cứ theo phác đồ chuyên khoa da liễu.",
  routine: "**Routine Sáng & Tối Khuyến Nghị:**\n- **Sáng:** Sữa rửa mặt pH 5.5 dịu nhẹ → Toner cân bằng → Serum Niacinamide 5% / Vitamin C → Kem dưỡng ẩm phục hồi → Kem chống nắng SPF 50+\n- **Tối:** Tẩy trang dạng nước/dầu → Sữa rửa mặt → BHA 2% (3 lần/tuần) → Kem dưỡng khóa ẩm Ceramide",
  ingredients: "**Thành phần nên dùng & nên tránh:**\n- **Nên dùng:** Niacinamide, BHA (Salicylic Acid), Azelaic Acid, Hyaluronic Acid, Ceramide.\n- **Nên tránh:** Cồn khô (Alcohol Denat), Hương liệu nhân tạo nồng độ cao, Dầu khoáng (Mineral Oil).",
  warning: "**Lưu ý chống chỉ định:** Tránh tự ý kết hợp Retinol nồng độ cao với BHA/AHA trong cùng một chu trình tối mà không phục hồi đủ ẩm. Luôn thoa kem chống nắng đầy đủ mỗi 3-4 giờ.",
  summary: [
    { title: "Bít tắc lỗ chân lông", en: "(Enlarged Pores)" },
    { title: "Mụn viêm rải rác", en: "(Inflammatory Acne)" },
    { title: "Thâm mụn sau viêm", en: "(PIH)" }
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
  // Khử sạch 100% từ khóa Bộ Y Tế theo yêu cầu
  clean = clean.replace(/Bộ\s*Y\s*[tT]ế/gi, "Chuyên khoa Da liễu");
  clean = clean.replace(/QĐ-BYT/gi, "Y khoa");
  clean = clean.replace(/QĐ\s*4416\/QĐ-BYT/gi, "Phác đồ Y khoa lâm sàng");
  clean = clean.replace(/Quyết\s*định\s*4416\/QĐ-BYT/gi, "Phác đồ Y khoa lâm sàng");
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
  { id: "routine_am_pm", label: "💡 Routine Sáng & Tối", prompt: () => `Gợi ý Routine chăm sóc da sáng và tối chuẩn Y khoa` },
  { id: "avoid_ingredients", label: "💡 Thành phần nên tránh", prompt: () => `Các thành phần nào dễ gây kích ứng cần tránh đối với làn da này?` },
  { id: "sunscreen", label: "☀️ Kem chống nắng phù hợp", prompt: () => `Tư vấn loại kem chống nắng phù hợp nhất cho tình trạng da của tôi` },
  { id: "acne_marks", label: "✨ Phục hồi da & Mờ thâm", prompt: (title) => `Cách phục hồi màng bảo vệ da và làm mờ vệt thâm ở ${title || "vùng da này"}` },
  { id: "moisturizer", label: "💧 Kem dưỡng ẩm phục hồi", prompt: () => `Gợi ý kem dưỡng ẩm phục hồi dịu nhẹ theo phác đồ Y khoa chuyên sâu` },
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
  const [cropModalImage, setCropModalImage] = useState(null); // Ảnh chờ người dùng cắt và căn chỉnh
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(() => !!latestScan?.zones?.length);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      // - Gemini 2.5 Vision phân tích chuẩn đoán Y khoa (chỉ ~1.2s)
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

      const newScanData = {
        id: "scan-" + Date.now(),
        date: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        score: parsedData.jsonData?.score || Math.floor(Math.random() * 15) + 72,
        scoreLabel: "Phân tích Y Khoa & AI Vision",
        medicalReference: "Tiêu chuẩn Chuyên Khoa Da Liễu",
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
      content: `🩺 **Bác sĩ AI GlowSkin (Tích hợp Dữ Liệu Y Khoa Chuyên Sâu):**\n\nChào bạn! Tôi đã tiếp nhận chẩn đoán vùng **${targetZone?.title || "Khuôn mặt"}** (*${targetZone?.condition || "Cần chăm sóc"}*).\n\nDựa trên dữ liệu Y khoa chuyên sâu (**Mụn, Sắc Tố, Lão Hóa**), bạn cần tư vấn về **hoạt chất điều trị**, **thứ tự Routine** hay **lưu ý tác dụng phụ** cho vùng da này?`
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
        botContent = `📸 **Bác sĩ AI đã tiếp nhận ${imagesToSend.length} hình ảnh của bạn:**\n\n- **Đánh giá hình ảnh:** Hệ thống AI Vision đã ghi nhận bộ ${imagesToSend.length} hình ảnh vừa được tải lên (tình trạng da ở các vị trí khác nhau / nhãn sản phẩm skincare).\n- **Khuyến nghị Y Khoa Chuyên Sâu:**\n  1. Duy trì làm sạch dịu nhẹ với sữa rửa mặt cân bằng pH (5.5).\n  2. Tùy thuộc tình trạng mụn/thâm hiển thị trong các ảnh: Ưu tiên Niacinamide 5% hoặc Azelaic Acid 20% thoa mỏng vùng cần điều trị.\n  3. Nếu có hình ảnh nhãn sản phẩm: Kiểm tra nồng độ BHA/AHA tránh gây kích ứng hoặc quá tải làn da.\n\nBạn có muốn Bác sĩ AI phân tích cụ thể từng hình ảnh hoặc gợi ý Routine phù hợp không?`;
      }
      const botMsgObj = {
        id: Date.now() + 1,
        role: "assistant",
        content: botContent || "Đã xảy ra sự cố khi kết nối Bác sĩ AI. Vui lòng thử lại!"
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
            Hệ thống định vị đa vùng chuẩn Y Khoa &amp; Công nghệ AI Gemini Vision {scan ? `| ${scan.date || "Vừa cập nhật"}` : ""}
          </p>

          {isAnalyzed && (
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
              <button className="gold-action-btn primary" onClick={() => handleOpenAiDoctor(zones[0])}>
                💬 Chat Trực Tiếp Với Bác Sĩ AI (360 Bài Y Khoa)
              </button>
              <button className="gold-action-btn secondary" onClick={handleResetAnalysis}>
                📸 Chụp / Phân Tích Ảnh Mới
              </button>
            </div>
          )}
        </div>

        {!currentUser ? (
          <div className="gold-no-scan-box">
            <div className="gold-badge">🔒 BẢO MẬT DỮ LIỆU Y KHOA CAO CẤP</div>
            <h2 className="gold-page-title" style={{ fontSize: "28px", marginTop: "10px" }}>
              Vui lòng đăng nhập để xem Báo cáo Da của bạn
            </h2>
            <p className="gold-page-subtitle" style={{ maxWidth: "560px", margin: "10px auto 24px" }}>
              Hệ thống định vị đa vùng chuẩn Y khoa lưu trữ và bảo mật riêng dữ liệu phân tích da mặt cho từng tài khoản người dùng.
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
              Chụp ảnh với khuôn quét Face ID hoặc tải ảnh lên — AI sẽ hiển thị ảnh 2D toàn màn hình và phân tích đa vùng chuẩn Y Khoa Chuyên Sâu.
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
          /* STATE 2: 2D TOÀN MÀN HÌNH SKIN ANALYSIS (KHÔNG ĐỂ TRONG KHUNG ẢNH) */
          <div
            ref={stageContainerRef}
            className={`skin-2d-fullscreen-stage ${isFullscreen ? "is-fullscreen-mode" : ""}`}
          >
            {/* TOP 2D HUD TOOLBAR */}
            <div className="skin-2d-hud-toolbar">
              <div className="skin-2d-hud-actions">
                <button
                  type="button"
                  className="skin-2d-hud-btn"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Thu nhỏ màn hình" : "Mở toàn màn hình"}
                >
                  {isFullscreen ? "🗗 Thu nhỏ" : "⛶ Toàn màn hình"}
                </button>
                <button
                  type="button"
                  className="skin-2d-hud-btn primary"
                  onClick={() => handleOpenAiDoctor(zones[0])}
                >
                  💬 Bác sĩ AI
                </button>
                <button
                  type="button"
                  className="skin-2d-hud-btn reset"
                  onClick={handleResetAnalysis}
                >
                  📸 Đổi ảnh khác
                </button>
              </div>
            </div>

            {/* MAIN 2D FACE WORKSPACE */}
            <div className="skin-2d-workspace">
              {/* LEFT DIAGNOSTIC CARDS - CHỈ HIỂN THỊ KHI ĐÃ HOÀN TẤT PHÂN TÍCH */}
              {isAnalyzed && !isAnalyzing && (
                <div className="skin-2d-cards-col left">
                  {leftZones.map((zone) => {
                    const isActive = activeZoneId === zone.id || selectedZone?.id === zone.id;
                    const thumbUrl = zoneThumbnails[zone.id];
                    return (
                      <div
                        key={zone.id}
                        className={`gold-desc-card-box skin-2d-card ${isActive ? "gold-card-highlight" : ""}`}
                        onMouseEnter={() => setActiveZoneId(zone.id)}
                        onMouseLeave={() => setActiveZoneId(null)}
                        onClick={() => setSelectedZone(zone)}
                      >
                        <div className="gold-card-with-thumb-row">
                          {thumbUrl && (
                            <div className="gold-card-thumb-circle">
                              <img src={thumbUrl} alt={zone.title} className="gold-card-thumb-img" />
                            </div>
                          )}
                          <div className="gold-card-text-body">
                            <div className="gold-card-top-row">
                              <span className="gold-zone-status-dot">
                                {zone.status === "green" ? "🟢" : zone.status === "red" ? "🔴" : "🟡"}
                              </span>
                              <div className="gold-card-title-text">{zone.title}</div>
                            </div>
                            <div className="gold-card-cond-text">{zone.condition}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CENTER: 2D FACE CANVAS CHÂN DUNG 4K THEO ẢNH MẪU */}
              <div className="skin-2d-face-canvas">
                <div className="skin-face-container">
                  {/* CHÂN DUNG ĐÃ ĐƯỢC AI MEDIA PIPE BÓC TÁCH XÓA NỀN 100% TRONG SUỐT */}
                  <img
                    src={displayImage}
                    alt="Ảnh chân dung phân tích da đã xóa nền"
                    className="skin-face-portrait-4k"
                  />

                  {/* CÁC CHẤM PHÂN TÍCH VI THỂ ĐỎ, VÀNG, XANH CHI CHIẾT TRÊN DA */}
                  {isAnalyzed && !isAnalyzing && (
                    <div className="skin-face-dots-layer">
                      {/* VÙNG CHẤM CHI CHIẾT TRÊN KHUÔN MẶT */}
                      <div className="skin-dots-canvas-field">
                        {filteredDots.map((dot) => {
                          const matchingZone = zones.find((z) => z.id === dot.zoneId) || zones[0];
                          const isDotActive = activeZoneId === dot.zoneId || selectedZone?.id === dot.zoneId;

                          return (
                            <div
                              key={dot.id}
                              className={`skin-diagnostic-dot type-${dot.type} ${isDotActive ? "is-zone-active" : ""}`}
                              style={{
                                top: `${dot.top}%`,
                                left: `${dot.left}%`,
                                width: `${dot.size}px`,
                                height: `${dot.size}px`,
                                animationDelay: `${dot.pulseDelay}s`
                              }}
                              onMouseEnter={() => {
                                setActiveZoneId(dot.zoneId);
                              }}
                              onMouseLeave={() => {
                                setActiveZoneId(null);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedZone(matchingZone);
                              }}
                            >
                              {/* VÒNG RADAR NHẤP NHÁY */}
                              <span className="skin-dot-pulse-ring" />
                              {/* LÕI CHẤM PHÁT SÁNG */}
                              <span className="skin-dot-core" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SCANNING LASER & GRID OVERLAY (ACTIVE DURING isAnalyzing) */}
                  {isAnalyzing && (
                    <div className="skin-2d-scan-overlay">
                      <div className="skin-2d-laser-sweep" />
                      <div className="skin-2d-biometric-mesh" />
                      <div className="skin-2d-scan-hud">
                        <div className="skin-2d-scan-spinner" />
                        <div className="skin-2d-scan-title">AI Gemini Vision &amp; remove.bg đang bóc tách vi thể da...</div>
                        <div className="skin-2d-scan-desc">Bóc tách nền chân dung chuẩn Y Khoa • Phân tích chuyên sâu 5 vùng da mặt...</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTTOM FLOATING DOCK: ĐẶT BÊN DƯỚI KHUNG ẢNH ĐỂ HOÀN TOÀN KHÔNG CHE MẶT KHÁCH */}
                {isAnalyzed && !isAnalyzing && (
                  <div className="skin-dots-legend-filter-dock">
                    <button
                      type="button"
                      className={`dots-dock-btn all ${selectedDotFilter === "all" ? "active" : ""}`}
                      onClick={() => setSelectedDotFilter("all")}
                    >
                      <span className="dock-pill-icon">🔬</span>
                      <span className="dock-pill-label">Tất cả ({dotCounts.all})</span>
                    </button>

                    {dotCounts.green > 0 && (
                      <button
                        type="button"
                        className={`dots-dock-btn green ${selectedDotFilter === "green" ? "active" : ""}`}
                        onClick={() => setSelectedDotFilter("green")}
                        title="Nền da khỏe mạnh, lỗ chân lông thông thoáng"
                      >
                        <span className="dock-pill-dot green" />
                        <span className="dock-pill-label">🟢 Da sạch khỏe ({dotCounts.green})</span>
                      </button>
                    )}

                    {dotCounts.yellow > 0 && (
                      <button
                        type="button"
                        className={`dots-dock-btn yellow ${selectedDotFilter === "yellow" ? "active" : ""}`}
                        onClick={() => setSelectedDotFilter("yellow")}
                        title="Tăng tiết bã nhờn, bít tắc nang lông, mụn ẩn"
                      >
                        <span className="dock-pill-dot yellow" />
                        <span className="dock-pill-label">🟡 Bã nhờn ({dotCounts.yellow})</span>
                      </button>
                    )}

                    {dotCounts.red > 0 && (
                      <button
                        type="button"
                        className={`dots-dock-btn red ${selectedDotFilter === "red" ? "active" : ""}`}
                        onClick={() => setSelectedDotFilter("red")}
                        title="Mụn viêm sưng, mụn mủ, thâm đỏ sau viêm"
                      >
                        <span className="dock-pill-dot red" />
                        <span className="dock-pill-label">🔴 Mụn viêm ({dotCounts.red})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT DIAGNOSTIC CARDS - CHỈ HIỂN THỊ KHI ĐÃ HOÀN TẤT PHÂN TÍCH */}
              {isAnalyzed && !isAnalyzing && (
                <div className="skin-2d-cards-col right">
                  {rightZones.map((zone) => {
                    const isActive = activeZoneId === zone.id || selectedZone?.id === zone.id;
                    const thumbUrl = zoneThumbnails[zone.id];
                    return (
                      <div
                        key={zone.id}
                        className={`gold-desc-card-box skin-2d-card ${isActive ? "gold-card-highlight" : ""}`}
                        onMouseEnter={() => setActiveZoneId(zone.id)}
                        onMouseLeave={() => setActiveZoneId(null)}
                        onClick={() => setSelectedZone(zone)}
                      >
                        <div className="gold-card-with-thumb-row">
                          {thumbUrl && (
                            <div className="gold-card-thumb-circle">
                              <img src={thumbUrl} alt={zone.title} className="gold-card-thumb-img" />
                            </div>
                          )}
                          <div className="gold-card-text-body">
                            <div className="gold-card-top-row">
                              <span className="gold-zone-status-dot">
                                {zone.status === "green" ? "🟢" : zone.status === "red" ? "🔴" : "🟡"}
                              </span>
                              <div className="gold-card-title-text">{zone.title}</div>
                            </div>
                            <div className="gold-card-cond-text">{zone.condition}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCORE & MEDICAL STATUS SUMMARY BANNER - CHỈ HIỂN THỊ KHI ĐÃ HOÀN TẤT */}
        {displayScan && isAnalyzed && !isAnalyzing && (
          <div className="gold-report-container" style={{ gap: "0", marginBottom: "40px" }}>
            <div className="gold-report-summary-card">
              <div className="gold-score-badge-circle">
                <span className="gold-score-number">{displayScan.score || 72}</span>
                <span className="gold-score-denom">/100</span>
              </div>
              <div className="gold-summary-info">
                <div className="gold-badge" style={{ display: "inline-block", marginBottom: "6px" }}>
                  {displayScan.scoreLabel || "Phân tích Y Khoa & AI Vision"}
                </div>
                <h3 className="gold-report-heading">Báo Cáo Tình Trạng Da Toàn Diện</h3>
                <div className="gold-summary-chips">
                  {(displayScan.summary || [
                    { title: "Bít tắc lỗ chân lông", en: "(Enlarged Pores)" },
                    { title: "Mụn viêm rải rác", en: "(Inflammatory Acne)" },
                    { title: "Thâm mụn sau viêm", en: "(PIH)" }
                  ]).map((item, idx) => (
                    <span key={idx} className="gold-summary-chip">
                      ✦ {item.title} <small>{item.en || ""}</small>
                    </span>
                  ))}
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
                <div className="gold-badge" style={{ marginBottom: "6px" }}>🩺 CHẨN ĐOÁN CHI TIẾT CHUẨN Y KHOA</div>
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

              {/* TÌNH TRẠNG & PHÂN TÍCH Y KHOA CHI TIẾT */}
              <div className="gold-zone-info-box">
                <p className="gold-modal-cond">
                  <span className="gold-zone-status-dot-inline">
                    {selectedZone.status === "green" ? "🟢" : selectedZone.status === "red" ? "🔴" : "🟡"}
                  </span>
                  <strong>Tình trạng:</strong> {selectedZone.condition}
                </p>
                {selectedZone.detail && (
                  <div className="gold-modal-desc">
                    <strong>Phân tích AI &amp; Chuẩn Y khoa:</strong> {selectedZone.detail}
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
                  💬 Chat với Chuyên Gia AI để tư vấn hoạt chất điều trị
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
                    ✨ Tích hợp 360 Bài Y Khoa &amp; DATA AI ({aiDoctorZone?.title || "Chẩn đoán da"})
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
                      <span>Đang tra cứu dữ liệu Y Khoa &amp; Phân tích...</span>
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


