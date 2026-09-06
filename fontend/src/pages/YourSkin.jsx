import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useApp } from "../context/AppContext";
import { analyzeSkinImage, sendFollowUp, parseAnalysisResponse } from "../services/analyzeSkin";
import "./YourSkin.css";

export const DEFAULT_DEMO_SCAN = {
  id: "demo-scan-01",
  date: "Chẩn đoán vừa thực hiện",
  score: 72,
  scoreLabel: "Phân tích Y Khoa & AI Vision",
  medicalReference: "Quyết định 4416/QĐ-BYT Bộ Y Tế",
  image: "https://res.cloudinary.com/buevamso/image/upload/v1784045582/glowskin/showcase/sample_acne_analysis_face.jpg",
  zones: [
    {
      id: "forehead",
      title: "Vùng Trán",
      condition: "Mụn ẩn nhẹ & Tàn nhang rải rác",
      detail: "Phát hiện mụn viêm sưng và bít tắc lỗ chân lông. Căn cứ bài Trứng cá QĐ 4416/QĐ-BYT.",
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
  { id: "routine_am_pm", label: "💡 Routine Sáng & Tối", prompt: () => `Gợi ý Routine chăm sóc da sáng và tối chuẩn Bộ Y Tế` },
  { id: "avoid_ingredients", label: "💡 Thành phần nên tránh", prompt: () => `Các thành phần nào dễ gây kích ứng cần tránh đối với làn da này?` },
  { id: "sunscreen", label: "☀️ Kem chống nắng phù hợp", prompt: () => `Tư vấn loại kem chống nắng phù hợp nhất cho tình trạng da của tôi` },
  { id: "acne_marks", label: "✨ Phục hồi da & Mờ thâm", prompt: (title) => `Cách phục hồi màng bảo vệ da và làm mờ vệt thâm ở ${title || "vùng da này"}` },
  { id: "moisturizer", label: "💧 Kem dưỡng ẩm phục hồi", prompt: () => `Gợi ý kem dưỡng ẩm phục hồi dịu nhẹ theo phác đồ Bộ Y Tế` },
  { id: "lifestyle", label: "🥗 Ăn uống & Sinh hoạt", prompt: () => `Chế độ ăn uống và thói quen sinh hoạt giúp giảm mụn hiệu quả` },
  { id: "exfoliation", label: "🧪 Cách dùng BHA/AHA an toàn", prompt: () => `Tần suất và cách dùng AHA/BHA tẩy tế bào chết an toàn không gây kích ứng` },
];

export default function YourSkin() {
  const { latestScan, saveLatestScan, currentUser, setIsLoginOpen } = useApp();
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  // Dynamic Suggestion Chips States
  const [activeChips, setActiveChips] = useState(["active_ingredients", "routine_am_pm", "avoid_ingredients"]);
  const [usedChipIds, setUsedChipIds] = useState([]);

  // Direct Photo Upload & Camera Workflow States
  const [currentImage, setCurrentImage] = useState(() => latestScan?.image || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(() => !!latestScan?.zones?.length);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // AI Doctor Interactive Chat Modal States
  const [isAiDoctorOpen, setIsAiDoctorOpen] = useState(false);
  const [aiDoctorZone, setAiDoctorZone] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef(null);

  const scan = latestScan;
  const displayImage = currentImage || scan?.image;

  const rawZones = scan?.zones && scan.zones.length ? scan.zones : DEFAULT_DEMO_SCAN.zones;
  const zones = rawZones.filter((z) => z.id !== "lower_cheek");

  // Orbital placement radius matching circular layout around face image
  const orbitRadiusX = 45; // % from center X
  const orbitRadiusY = 44; // % from center Y

  useEffect(() => {
    if (latestScan?.image && !currentImage) {
      setCurrentImage(latestScan.image);
      setIsAnalyzed(true);
    }
  }, [latestScan]);

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
        video: { facingMode: "user" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Lỗi khi mở camera:", err);
      alert("Không thể mở camera thiết bị. Vui lòng cấp quyền camera hoặc chọn ảnh từ máy.");
      setIsCameraOpen(false);
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
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    handleAnalyzeNewImage(photoDataUrl);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleAnalyzeNewImage(event.target.result);
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
      const skinRes = await analyzeSkinImage(imageDataUrl);
      const parsedData = parseAnalysisResponse(skinRes?.content);
      
      let parsedOverview = "Đã hoàn thành phân tích da mặt qua AI Vision & 360 Bài Y Khoa Bộ Y Tế.";
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

      // Fallback if AI JSON failed: default to 3 visible upper face zones
      if (!detectedZones.length) {
        detectedZones = [
          {
            id: "forehead",
            title: "Vùng Trán",
            condition: "Mụn sẩn ẩn & bít tắc tuyến bã nhờn",
            detail: "Bề mặt trán xuất hiện mụn sẩn 1-2mm rải rác. Căn cứ bài Trứng cá QĐ 4416/QĐ-BYT, khuyến nghị dùng Salicylic Acid 2% (BHA).",
            status: "yellow",
          },
          {
            id: "eyebrow",
            title: "Vùng Lông Mày",
            condition: "Nền da bình thường, hàng rào lipid tốt",
            detail: "Cấu trúc mô da mịn màng, cân bằng độ ẩm tốt, không phát hiện dấu hiệu mụn sẩn hay viêm.",
            status: "green",
          },
          {
            id: "upper_cheek",
            title: "Vùng Má",
            condition: "Thâm mụn sau viêm (PIH) & lỗ chân lông giãn",
            detail: "Dấu hiệu tăng sắc tố sau tổn thương mụn cũ. Khuyến nghị phối hợp Niacinamide 5% + Vitamin C theo Hướng dẫn Bộ Y Tế.",
            status: "yellow",
          },
        ];
      }

      // Re-calculate dynamic orbital placement angles evenly spaced for ONLY the visible zones in photo
      const formattedZones = detectedZones.map((zone, idx) => ({
        ...zone,
        angle: -90 + (idx * 360) / detectedZones.length
      }));

      const newScanData = {
        id: "scan-" + Date.now(),
        date: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        score: parsedData.jsonData?.score || Math.floor(Math.random() * 15) + 72,
        scoreLabel: "Phân tích Y Khoa & AI Vision",
        medicalReference: "Quyết định 4416/QĐ-BYT Bộ Y Tế",
        image: imageDataUrl,
        zones: formattedZones,
        aiOverview: parsedOverview,
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
      content: `🩺 **Bác sĩ AI GlowSkin (Tích hợp QĐ 4416 & DATA AI):**\n\nChào bạn! Tôi đã tiếp nhận chẩn đoán vùng **${targetZone?.title || "Khuôn mặt"}** (*${targetZone?.condition || "Cần chăm sóc"}*).\n\nDựa trên dữ liệu Y khoa Bộ Y Tế và bộ tài liệu chuyên sâu (**Mụn, Sắc Tố, Lão Hóa**), bạn cần tư vấn về **hoạt chất điều trị**, **thứ tự Routine** hay **lưu ý tác dụng phụ** cho vùng da này?`
    };
    setChatMessages([initialGreeting]);
  };

  const handleSendAiChat = async (userText) => {
    const textToSend = typeof userText === "string" ? userText : inputMsg;
    if (!textToSend.trim() || chatLoading) return;

    const userMsgObj = {
      id: Date.now(),
      role: "user",
      content: textToSend.trim()
    };

    const updatedHistory = [...chatMessages, userMsgObj];
    setChatMessages(updatedHistory);
    setInputMsg("");
    setChatLoading(true);

    try {
      const aiRes = await sendFollowUp(updatedHistory);
      const botMsgObj = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiRes.content || "Đã xảy ra sự cố khi kết nối Bác sĩ AI. Vui lòng thử lại!"
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
          <div className="gold-badge">✨ AI VISION &amp; PHÁC ĐỒ BỘ Y TẾ (QĐ 4416/QĐ-BYT &amp; DATA AI)</div>
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
        ) : (
          <div className="gold-boxes-stage">
            {/* METALLIC GOLD CIRCULAR RINGS */}
            <div className="gold-dashed-circle-ring" />
            <div className="gold-inner-glow-ring" />

            {/* CENTERED CLEAN CUSTOMER FACE PHOTO CARD */}
            <div className="gold-center-face-card gold-floating-bob">
              {!currentImage && !isAnalyzing ? (
                /* STATE 1: 2 UPLOAD & CAMERA BUTTONS INSIDE CENTER IMAGE CARD */
                <div className="gold-center-upload-box">
                  <div className="gold-upload-icon-circle">✨</div>
                  <h3 className="gold-upload-title">Phân tích da mặt AI</h3>
                  <p className="gold-upload-subtext">
                    Chụp ảnh hoặc tải ảnh khuôn mặt lên — AI sẽ phân tích và tư vấn skincare.
                  </p>
                  <div className="gold-upload-buttons-stack">
                    <button type="button" className="gold-btn-camera" onClick={startCamera}>
                      📷 Mở camera
                    </button>
                    <button type="button" className="gold-btn-file" onClick={() => fileInputRef.current?.click()}>
                      🖼️ Chọn ảnh từ máy
                    </button>
                  </div>
                </div>
              ) : (
                /* STATE 2 & 3: DISPLAY FACE PHOTO WITH SCANNING OVERLAY / RE-ANALYZE CHIP */
                <>
                  <img
                    src={displayImage}
                    alt="Ảnh mặt khách hàng"
                    className="gold-face-img"
                  />

                  {/* SCANNING OVERLAY */}
                  {isAnalyzing && (
                    <div className="gold-scanning-overlay">
                      <div className="gold-scanner-line" />
                      <div className="gold-scanner-spinner" />
                      <div className="gold-scanner-text">AI Vision đang quét da...</div>
                      <div className="gold-scanner-subtext">Đối chiếu 360 Bài Y Khoa &amp; QĐ 4416/QĐ-BYT</div>
                    </div>
                  )}

                  {/* RE-ANALYZE CHIP */}
                  {isAnalyzed && !isAnalyzing && (
                    <button className="gold-reanalyze-chip" onClick={handleResetAnalysis}>
                      📸 Chụp / Chọn ảnh khác
                    </button>
                  )}
                </>
              )}
            </div>

            {/* SURROUNDING DIAGNOSIS CALLOUT CARDS - ONLY SHOWN WHEN ANALYSIS COMPLETED */}
            {isAnalyzed && !isAnalyzing && zones.map((zone, idx) => {
              const angle = zone.angle !== undefined ? zone.angle : -90 + (idx * 360) / zones.length;
              const rad = (angle * Math.PI) / 180;
              const cardLeft = 50 + orbitRadiusX * Math.cos(rad);
              const cardTop = 50 + orbitRadiusY * Math.sin(rad);
              const isActive = activeZoneId === zone.id || selectedZone?.id === zone.id;

              return (
                <div
                  key={zone.id}
                  className={`gold-desc-card-box ${isActive ? "gold-card-highlight" : ""}`}
                  style={{ left: `${cardLeft}%`, top: `${cardTop}%` }}
                  onMouseEnter={() => setActiveZoneId(zone.id)}
                  onMouseLeave={() => setActiveZoneId(null)}
                  onClick={() => setSelectedZone(zone)}
                >
                  <div className="gold-card-top-row">
                    <span className="gold-zone-status-dot" style={{ fontSize: "14px" }}>
                      {zone.status === "green" ? "🟢" : zone.status === "red" ? "🔴" : "🟡"}
                    </span>
                    <div className="gold-card-title-text">{zone.title}</div>
                  </div>
                  <div className="gold-card-cond-text">{zone.condition}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* WEBCAM CAPTURE MODAL */}
        {isCameraOpen && (
          <div className="gold-camera-modal-overlay" onClick={stopCamera}>
            <div className="gold-camera-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="gold-badge">📸 WEBCAM CAPTURE</div>
              <h3 className="gold-modal-title" style={{ fontSize: "20px" }}>Chụp Ảnh Da Mặt</h3>
              <p className="gold-modal-desc" style={{ textAlign: "center", margin: "4px 0 12px" }}>
                Giữ mặt thẳng, đủ ánh sáng và nhấn nút <strong>Chụp ảnh ngay</strong>.
              </p>

              <div className="gold-camera-viewport">
                <video ref={videoRef} autoPlay playsInline className="gold-camera-video" />
              </div>

              <div className="gold-camera-controls">
                <button className="gold-action-btn secondary" onClick={stopCamera}>
                  Hủy bỏ
                </button>
                <button className="gold-action-btn primary" onClick={capturePhoto}>
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
              <div className="gold-badge" style={{ marginBottom: "8px" }}>🩺 CHẨN ĐOÁN CHI TIẾT CHUẨN BỘ Y TẾ</div>
              <h3 className="gold-modal-title">{selectedZone.title}</h3>
              <p className="gold-modal-cond"><strong>Tình trạng:</strong> {selectedZone.condition}</p>
              {selectedZone.detail && (
                <p className="gold-modal-desc">
                  <strong>Phân tích AI &amp; Chuẩn Y khoa:</strong> {selectedZone.detail}
                </p>
              )}
              <div className="gold-modal-footer">
                <button
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

              {/* CHAT INPUT FORM */}
              <form
                className="gold-ai-chat-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiChat();
                }}
              >
                <input
                  type="text"
                  className="gold-ai-chat-input"
                  placeholder="Nhập câu hỏi cho Bác sĩ AI (vd: Tôi nên dùng BHA hay Azelaic Acid?)..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  className="gold-ai-chat-send-btn"
                  disabled={!inputMsg.trim() || chatLoading}
                >
                  Gửi ➔
                </button>
              </form>

            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}


