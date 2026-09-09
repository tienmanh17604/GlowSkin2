import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductRecommendations from "../components/ProductRecommendations";
import {
  analyzeSkinImage,
  isUsingDemoMode,
  sendFollowUp,
} from "../services/analyzeSkin";
import { getRecommendedProducts } from "../services/recommendProducts";
import { useApp } from "../context/AppContext";
import "./SkinAnalysis.css";

function formatMessage(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    // 1. Clean horizontal rules (like --- or ---- or ***)
    if (/^[-*_ ]{3,}$/.test(line.trim())) {
      return <hr key={i} className="message-hr" style={{ border: "none", borderTop: "1px solid rgba(195, 156, 115, 0.2)", margin: "16px 0" }} />;
    }

    // 2. Strip leading # characters from headings
    const isHeading = line.startsWith("#");
    const cleanLine = line.replace(/^#+\s*/, "");

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const content = parts.map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );

    return (
      <span key={i} style={{ display: "block", margin: isHeading ? "14px 0 6px" : "4px 0", fontSize: isHeading ? "16.5px" : "inherit", fontWeight: isHeading ? "700" : "inherit", color: isHeading ? "#8c6239" : "inherit" }}>
        {content}
      </span>
    );
  });
}

function parseAnalysis(text) {
  const sections = {
    overview: "",
    routine: "",
    ingredients: "",
    warning: "",
    jsonData: null
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
    // Fallback if ===OVERVIEW=== tag is missing, take everything up to the next tag
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
  
  if (!sections.overview) {
    sections.overview = mainText;
  }
  
  return sections;
}

export default function SkinAnalysis() {
  const { products, currentUser, logout, setIsLoginOpen, updateUserMembership, saveLatestScan } = useApp();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const productsRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState("choose");
  const [image, setImage] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatImages, setChatImages] = useState([]);
  const chatImageInputRef = useRef(null);
  const [showPaywall, setShowPaywall] = useState(false);

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentAnalysisSections, setCurrentAnalysisSections] = useState(null);
  const [flowStep, setFlowStep] = useState(null); // null | "routine_prompt" | "ingredients_prompt" | "warning_prompt" | "completed"

  // Sync scanCount and showPaywall state on mount and currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.membership === "Free") {
        const scans = Number(localStorage.getItem("scanCount_" + currentUser.id) || 0);
        if (scans >= 1) {
          setShowPaywall(true);
        } else {
          setShowPaywall(false);
        }
      } else {
        setShowPaywall(false);
      }
    } else {
      setShowPaywall(false);
    }
  }, [currentUser]);

  // Detect payment redirects
  useEffect(() => {
    const paymentStatus = searchParams.get("paymentStatus");
    const membership = searchParams.get("membership");
    const userId = searchParams.get("userId");

    if (paymentStatus === "success" && membership && currentUser && currentUser.id === userId) {
      updateUserMembership(currentUser.id, membership);
      
      const successMsg = {
        id: Date.now(),
        role: "assistant",
        content: `🎉 Chúc mừng bạn đã nâng cấp thành công gói hội viên **Premium (VIP)** của GlowSkin! Bạn đã được mở khóa số lượt quét da AI không giới hạn, kết nối chuyên gia da liễu và các đặc quyền giảm giá mua sắm. Hãy chọn ảnh hoặc mở camera để bắt đầu phân tích da mặt ngay bây giờ!`,
      };
      setMessages([successMsg]);
      
      // Clear query params to prevent reload loop
      searchParams.delete("paymentStatus");
      searchParams.delete("membership");
      searchParams.delete("userId");
      setSearchParams(searchParams);
      setShowPaywall(false);
    } else if (paymentStatus === "cancel") {
      searchParams.delete("paymentStatus");
      searchParams.delete("userId");
      setSearchParams(searchParams);
    }
  }, [searchParams, currentUser, setSearchParams]);

  const handleUpgrade = async (level) => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }
    setLoading(true);
    try {
      const amount = (level === "VIP" || level === "Premium") ? 99000 : 249000;
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      
      const res = await fetch(`${API_URL}/payments/create-membership-payos-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          userId: currentUser.id,
          membership: "VIP",
        }),
      });
      
      if (!res.ok) throw new Error("Thanh toán lỗi");
      
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert("Lỗi tạo liên kết thanh toán từ Gateway!");
        setLoading(false);
      }
    } catch (err) {
      console.error("Lỗi PayOS:", err);
      alert("Lỗi kết nối cổng thanh toán! Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading]);

  const analysisText = useMemo(() => {
    if (currentAnalysisSections) {
      return `${currentAnalysisSections.overview} ${currentAnalysisSections.routine} ${currentAnalysisSections.ingredients} ${currentAnalysisSections.warning}`;
    }
    const analysis = [...messages].reverse().find((m) => m.role === "assistant" && !m.isError);
    return analysis?.content || "";
  }, [messages, currentAnalysisSections]);

  const recommendations = useMemo(() => {
    if (!analysisText) return null;
    return getRecommendedProducts(products, analysisText);
  }, [products, analysisText]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startCamera = async () => {
    if (currentUser && currentUser.membership === "Free") {
      const scans = Number(localStorage.getItem("scanCount_" + currentUser.id) || 0);
      if (scans >= 1) {
        setShowPaywall(true);
        return;
      }
    }

    setCameraError("");
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Không thể mở camera. Hãy cho phép quyền camera hoặc chọn ảnh từ máy.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    handleImageSelected(dataUrl);
  };

  const handleFileChange = (e) => {
    if (currentUser && currentUser.membership === "Free") {
      const scans = Number(localStorage.getItem("scanCount_" + currentUser.id) || 0);
      if (scans >= 1) {
        setShowPaywall(true);
        return;
      }
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Vui lòng chọn file ảnh (JPG, PNG...).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      handleImageSelected(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleImageSelected = async (dataUrl) => {
    // 1. Force Login Check
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }

    // 2. Enforce Free Scans Limit (1 scan allowed)
    const scans = Number(localStorage.getItem("scanCount_" + currentUser.id) || 0);
    if (currentUser.membership === "Free" && scans >= 1) {
      setShowPaywall(true);
      return;
    }

    setImage(dataUrl);
    setMode("preview");
    setCameraError("");

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: "Đã gửi ảnh da mặt để phân tích.",
      image: dataUrl,
    };
    setMessages([userMsg]);
    setLoading(true);

    try {
      const skinAnalysis = await analyzeSkinImage(dataUrl);
      const parsed = parseAnalysis(skinAnalysis.content);
      setCurrentAnalysisSections(parsed);

      // Save formatted diagnostic scan data for the "Da của bạn" page from AI Vision + Bộ Y Tế JSON
      const jsonRes = parsed.jsonData || {};
      const defaultZones = [
        { id: "forehead", title: "Vùng Trán", condition: "Mụn viêm & Thâm dai dẳng", detail: "Nhận diện lỗ chân lông bít tắc theo QĐ 4416/QĐ-BYT.", angle: -90 },
        { id: "eyebrow", title: "Vùng Lông Mày", condition: "Cần cải thiện nhẹ", detail: "Nền da tương đối ổn định.", angle: -30 },
        { id: "upper_cheek", title: "Vùng Má", condition: "Mụn đầu đen & Thâm mụn", detail: "Dấu hiệu thâm sau viêm (PIH).", angle: 30 },
        { id: "chin", title: "Vùng Cằm", condition: "Mụn ẩn & Bã nhờn", detail: "Cần làm sạch sâu và dùng BHA.", angle: 90 },
        { id: "mouth", title: "Vùng Môi", condition: "Khô nhẹ xung quanh", detail: "Cần duy trì độ ẩm.", angle: 150 },
        { id: "jaw", title: "Vùng Hàm", condition: "Bình thường", detail: "Không phát hiện ổ viêm lớn.", angle: 210 }
      ];

      const newScanData = {
        id: "scan-" + Date.now(),
        date: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + ", " + new Date().toLocaleDateString("vi-VN"),
        score: jsonRes.score || 72,
        scoreLabel: jsonRes.scoreLabel || "Phân tích Y Khoa & AI Vision",
        medicalReference: jsonRes.medicalReference || "Quyết định 4416/QĐ-BYT Bộ Y Tế",
        image: dataUrl,
        aiOverview: parsed.overview,
        routine: parsed.routine,
        ingredients: parsed.ingredients,
        warning: parsed.warning,
        summary: jsonRes.summary || [
          { title: "Phân tích AI Vision", en: "(AI Vision Diagnosis)", desc: "Nhận diện tình trạng từ ảnh khuôn mặt thực tế." }
        ],
        severity: jsonRes.severity || {
          recommendation: "Cần điều trị tích cực và bảo vệ da theo Hướng dẫn Bộ Y Tế."
        },
        zones: (jsonRes.zones && jsonRes.zones.length) ? jsonRes.zones : defaultZones,
      };
      
      saveLatestScan(newScanData);

      const botMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: "🎉 **Đã phân tích da hoàn tất!** Báo cáo đầy đủ đã sẵn sàng.\n\n" + parsed.overview + "\n\n👉 **[Bấm vào đây để xem Bản đồ Định vị Đa vùng HUD tại Da của bạn ➔](/your-skin)**\n\n**Bạn có muốn tôi gợi ý Routine với tình trạng da bạn không?**",
        isDemo: skinAnalysis.isDemo,
      };
      setMessages((prev) => [...prev, botMsg]);
      setFlowStep("routine_prompt");
      
      // Increment and save scan count on successful analysis
      localStorage.setItem("scanCount_" + currentUser.id, String(scans + 1));
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: err.message || "Đã xảy ra lỗi trong quá trình phân tích da.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInteractiveResponse = useCallback((responseType) => {
    if (!currentAnalysisSections) return;
    
    const userText = responseType === "yes" ? "Có" : "Không";
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: userText,
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      
      if (flowStep === "routine_prompt") {
        if (responseType === "yes") {
          const content = (currentAnalysisSections.routine || "Hiện tại không tìm thấy Routine gợi ý cụ thể.") + 
            "\n\n**Bạn có muốn tôi đưa ra những Thành phần nên dùng và nên tránh với tình trạng da bạn không?**";
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content,
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: "Vâng, tôi hiểu.\n\n**Bạn có muốn tôi đưa ra những Thành phần nên dùng và nên tránh với tình trạng da bạn không?**",
            }
          ]);
        }
        setFlowStep("ingredients_prompt");
      }
      
      else if (flowStep === "ingredients_prompt") {
        if (responseType === "yes") {
          const content = (currentAnalysisSections.ingredients || "Hiện tại không tìm thấy thành phần gợi ý cụ thể.") + 
            "\n\n**Bạn có muốn tôi đưa ra những thành phần dễ gây kích ứng với da bạn không?**";
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content,
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: "Vâng, tôi hiểu.\n\n**Bạn có muốn tôi đưa ra những thành phần dễ gây kích ứng với da bạn không?**",
            }
          ]);
        }
        setFlowStep("warning_prompt");
      }
      
      else if (flowStep === "warning_prompt") {
        if (responseType === "yes") {
          const content = (currentAnalysisSections.warning || "Không phát hiện thành phần đặc biệt nhạy cảm nào đối với da bạn.") + 
            "\n\nChúc bạn có một làn da thật khỏe đẹp! Bạn có câu hỏi nào khác cần tôi giải đáp không?";
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content,
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: "Vâng, tôi hiểu. Chúc bạn có một làn da thật khỏe đẹp! Bạn có câu hỏi nào khác cần tôi giải đáp không?",
            }
          ]);
        }
        setFlowStep("completed");
      }
    }, 800);
  }, [currentAnalysisSections, flowStep]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userText = input.trim();
    const imagesToSend = [...chatImages];
    if ((!userText && !imagesToSend.length) || loading) return;

    // Intercept user's yes/no text input if in active flow step
    if (flowStep && flowStep !== "completed" && userText) {
      const cleanText = userText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").trim();
      const isYes = ["có", "co", "yes", "y", "đúng", "dung", "đồng ý", "dong y", "ok", "được", "duc"].includes(cleanText);
      const isNo = ["không", "khong", "no", "n", "chưa", "chua", "hủy", "huy"].includes(cleanText);
      
      if (isYes) {
        setInput("");
        handleInteractiveResponse("yes");
        return;
      } else if (isNo) {
        setInput("");
        handleInteractiveResponse("no");
        return;
      }
    }

    // Force Login Check for custom follow-up questions
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }

    // Block custom follow-up questions for Free membership users and show Paywall
    if (currentUser.membership === "Free") {
      setShowPaywall(true);
      return;
    }

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: userText || `📸 [Đã gửi ${imagesToSend.length} hình ảnh đính kèm]`,
      images: imagesToSend.length ? imagesToSend : null,
      image: imagesToSend[0] || null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setChatImages([]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image || null,
        images: m.images || null
      }));
      const reply = await sendFollowUp(history);
      const botMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: reply.content,
        isDemo: reply.isDemo,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: err.message || "Không thể gửi câu hỏi.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    stopCamera();
    setImage(null);
    setMode("choose");
    setMessages([]);
    setInput("");
    setCameraError("");
    setFlowStep(null);
    setCurrentAnalysisSections(null);
  };

  const hasAnalysis = Boolean(recommendations?.products.length);

  return (
    <div className="analyze-page">
      <Navbar />

      {/* Premium Background Blobs */}
      <div className="analyze-bg-blob blob-1"></div>
      <div className="analyze-bg-blob blob-2"></div>
      <div className="analyze-bg-blob blob-3"></div>

      <div className="analyze-container">
        <aside className="analyze-upload">
              <h1>Phân tích da mặt AI</h1>
              <p className="analyze-subtitle">
                Chụp ảnh hoặc tải ảnh khuôn mặt lên — AI sẽ phân tích và tư vấn skincare.
              </p>

              {isUsingDemoMode() && (
                <div className="analyze-demo-badge">
                  Chế độ demo — thêm API key vào .env để dùng AI thật
                </div>
              )}

              {mode === "choose" && (
                <div className="analyze-actions">
                  <button type="button" className="analyze-btn analyze-btn--primary" onClick={startCamera}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-svg-icon">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    Mở camera
                  </button>
                  <button
                    type="button"
                    className="analyze-btn analyze-btn--secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-svg-icon">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Chọn ảnh từ máy
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    hidden
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {mode === "camera" && (
                <div className="analyze-camera">
                  {cameraError ? (
                    <p className="analyze-error">{cameraError}</p>
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="analyze-video" />
                      <div className="analyze-camera-btns">
                        <button type="button" className="analyze-btn analyze-btn--primary" onClick={capturePhoto}>
                          Chụp ảnh
                        </button>
                        <button
                          type="button"
                          className="analyze-btn analyze-btn--ghost"
                          onClick={() => {
                            stopCamera();
                            setMode("choose");
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {(mode === "preview" || image) && image && (
                <div className="analyze-preview">
                  <img src={image} alt="Ảnh da mặt" />
                  <button type="button" className="analyze-btn analyze-btn--ghost" onClick={handleReset}>
                    Chọn ảnh khác
                  </button>
                </div>
              )}

              {cameraError && mode === "choose" && (
                <p className="analyze-error">{cameraError}</p>
              )}

              <canvas ref={canvasRef} hidden />
        </aside>

        <main className="analyze-chat">
          <div className="analyze-chat-header">
            <span className="analyze-chat-avatar">✦</span>
            <div>
              <h2>GlowSkin AI</h2>
              <p>Chuyên gia phân tích da mặt</p>
            </div>
          </div>

          <div className="analyze-messages" ref={messagesContainerRef}>
            {messages.length === 0 && (
              <div className="analyze-empty">
                <span>✨</span>
                <p>Chọn ảnh hoặc mở camera để bắt đầu phân tích da mặt</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`analyze-msg analyze-msg--${msg.role}`}>
                {(msg.images?.length > 0 || msg.image) && (
                  <div className="analyze-msg-images-grid">
                    {(msg.images || [msg.image]).map((imgSrc, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={imgSrc}
                        alt={`Ảnh gửi ${imgIdx + 1}`}
                        className="analyze-msg-image"
                        onClick={() => window.open(imgSrc, "_blank")}
                      />
                    ))}
                  </div>
                )}
                <div className={`analyze-msg-bubble ${msg.isError ? "analyze-msg-bubble--error" : ""}`}>
                  {formatMessage(msg.content)}
                  {msg.isDemo && (
                    <span className="analyze-msg-tag">Demo</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="analyze-msg analyze-msg--assistant">
                <div className="analyze-msg-bubble analyze-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {flowStep && flowStep !== "completed" && !loading && (
            <div className="analyze-quick-replies">
              <button
                type="button"
                className="quick-reply-btn quick-reply-btn--yes"
                onClick={() => handleInteractiveResponse("yes")}
              >
                Có
              </button>
              <button
                type="button"
                className="quick-reply-btn quick-reply-btn--no"
                onClick={() => handleInteractiveResponse("no")}
              >
                Không
              </button>
            </div>
          )}

          {/* HIDDEN CHAT MULTIPLE IMAGES INPUT */}
          <input
            type="file"
            ref={chatImageInputRef}
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleChatImageSelect}
          />

          {chatImages.length > 0 && (
            <div className="analyze-chat-image-preview">
              <div className="analyze-preview-thumbs-list">
                {chatImages.map((imgSrc, idx) => (
                  <div key={idx} className="analyze-preview-thumb-wrapper">
                    <img src={imgSrc} alt={`Ảnh ${idx + 1}`} />
                    <button
                      type="button"
                      className="analyze-preview-remove"
                      onClick={() => handleRemoveChatImage(idx)}
                      title="Xóa ảnh này"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <span>📸 Đã chọn {chatImages.length} ảnh</span>
            </div>
          )}

          <form className="analyze-input-form" onSubmit={handleSendMessage}>
            <button
              type="button"
              className="analyze-attach-btn"
              onClick={() => chatImageInputRef.current?.click()}
              disabled={loading || messages.length === 0}
              title="Gửi nhiều hình ảnh da/sản phẩm"
            >
              🖼️
              {chatImages.length > 0 && (
                <span className="analyze-attach-badge">{chatImages.length}</span>
              )}
            </button>

            {hasAnalysis && (
              <button
                type="button"
                className="analyze-products-btn"
                onClick={scrollToProducts}
                title="Xem sản phẩm gợi ý"
              >
                🛍
              </button>
            )}
            <input
              type="text"
              placeholder={chatImages.length > 0 ? `Thêm ghi chú về ${chatImages.length} ảnh này...` : "Hỏi thêm về da, routine, sản phẩm..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || messages.length === 0}
            />
            <button type="submit" disabled={loading || (!input.trim() && !chatImages.length) || messages.length === 0}>
              Gửi
            </button>
          </form>
        </main>
      </div>



      {/* 3 Options Pricing Paywall Modal Overlay */}
      {showPaywall && (
        <div className="pricing-paywall-modal-overlay" onClick={() => setShowPaywall(false)}>
          <div className="pricing-paywall-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="pricing-modal-close" onClick={() => setShowPaywall(false)}>×</button>
            <div className="pricing-tag-wrapper">
              <span className="pricing-tag">✦ Gói hội viên</span>
            </div>
            <h2 className="pricing-title">Sở Hữu Làn Da Đẹp Chuẩn Chuyên Gia</h2>
            <p className="pricing-subtitle">
              Tài khoản thường giới hạn 1 lần quét da. Hãy nâng cấp hội viên để mở khóa toàn bộ tính năng phân tích da chuyên sâu.
            </p>

            <div className="pricing-cards-grid-row">
              {/* Gói Free */}
              <div className="pricing-card">
                <span className="plan-badge">Cơ bản</span>
                <h3 className="plan-name">Free</h3>
                <div className="plan-price"><span className="price-val">0đ</span><span className="price-period">/ vĩnh viễn</span></div>
                <p className="plan-desc">Trải nghiệm các tính năng phân tích da và quản lý routine cơ bản.</p>
                <ul className="plan-features">
                  <li>✓ Quét ảnh da mặt AI cơ bản</li>
                  <li>✓ Nhận báo cáo phân tích tổng quan</li>
                  <li>✓ Thiết lập lộ trình skincare cơ bản</li>
                </ul>
                <button type="button" className="plan-btn" onClick={() => setShowPaywall(false)}>
                  Bắt đầu ngay
                </button>
              </div>

              {/* Gói Premium */}
              <div className="pricing-card pricing-card--featured premium-card">
                <div className="premium-tag">Khuyên dùng</div>
                <span className="plan-badge">Nâng cao</span>
                <h3 className="plan-name">Premium</h3>
                <div className="plan-price"><span className="price-val">99.000đ</span><span className="price-period">/ tháng</span></div>
                <p className="plan-desc">Phân tích sâu hơn, gợi ý sản phẩm chi tiết & mở khóa routine nâng cao.</p>
                <ul className="plan-features">
                  <li>✓ Quét da AI chuyên sâu</li>
                  <li>✓ Gợi ý thành phần mỹ phẩm chi tiết</li>
                  <li>✓ Không giới hạn số lần phân tích</li>
                  <li>✓ Lưu lịch sử & theo dõi tiến trình da</li>
                </ul>
                <button type="button" className="plan-btn featured" onClick={() => handleUpgrade("Premium")}>
                  Nâng cấp Premium
                </button>
              </div>

              {/* Gói Professional */}
              <div className="pricing-card">
                <span className="plan-badge">Chuyên nghiệp</span>
                <h3 className="plan-name">Professional</h3>
                <div className="plan-price"><span className="price-val">249.000đ</span><span className="price-period">/ tháng</span></div>
                <p className="plan-desc">Phù hợp cho các chuyên gia da liễu hoặc spa chăm sóc khách hàng.</p>
                <ul className="plan-features">
                  <li>✓ Đầy đủ tính năng gói Premium</li>
                  <li>✓ Báo cáo phân tích chuẩn y khoa PDF</li>
                  <li>✓ Kết nối tư vấn 1-1 với bác sĩ da liễu</li>
                  <li>✓ Công cụ quản lý hồ sơ da khách hàng</li>
                </ul>
                <button type="button" className="plan-btn" onClick={() => handleUpgrade("Professional")}>
                  Đăng ký ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
