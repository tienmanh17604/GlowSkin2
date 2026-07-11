import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

export default function SkinAnalysis() {
  const { products, currentUser, logout, setIsLoginOpen, updateUserMembership } = useApp();
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
  const [showPaywall, setShowPaywall] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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
      alert("Bạn đã hủy thanh toán gói hội viên. Bạn có thể thử lại bất cứ lúc nào!");
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
      const amount = level === "VIP" ? 299000 : 150000;
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      
      const res = await fetch(`${API_URL}/payments/create-membership-payos-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          userId: currentUser.id,
          membership: level === "VIP" ? "VIP" : "VIP",
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
    const analysis = [...messages].reverse().find((m) => m.role === "assistant" && !m.isError);
    return analysis?.content || "";
  }, [messages]);

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
      const botMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: skinAnalysis.content,
        isDemo: skinAnalysis.isDemo,
      };
      setMessages((prev) => [...prev, botMsg]);
      
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image || null,
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
  };

  const hasAnalysis = Boolean(recommendations?.products.length);

  return (
    <div className="analyze-page">
      <Navbar />

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
                {msg.image && (
                  <img src={msg.image} alt="Ảnh gửi" className="analyze-msg-image" />
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

          <form className="analyze-input-form" onSubmit={handleSendMessage}>
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
              placeholder="Hỏi thêm về da, routine, sản phẩm..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || messages.length === 0}
            />
            <button type="submit" disabled={loading || !input.trim() || messages.length === 0}>
              Gửi
            </button>
          </form>
        </main>
      </div>

      {hasAnalysis && (
        <div ref={productsRef} className="skin-analysis-recs">
          <ProductRecommendations
            products={recommendations.products}
            profile={recommendations.profile}
            title="Sản phẩm gợi ý phù hợp với da bạn"
            subtitle="Dựa trên kết quả phân tích AI — sắp xếp theo mức độ phù hợp"
          />
          <div className="analyze-products-more">
            <Link to="/products" className="analyze-btn analyze-btn--secondary">
              Xem tất cả sản phẩm →
            </Link>
          </div>
        </div>
      )}

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
              {/* Gói Cơ Bản */}
              <div className="pricing-card">
                <div className="pricing-card-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <h3>Gói Cơ Bản (Basic)</h3>
                <p className="pricing-card-desc">Kiểm tra da định kỳ cơ bản hàng tháng.</p>
                <div className="pricing-card-price">
                  <strong>150.000 đ</strong>
                  <span>/ tháng</span>
                </div>
                <ul className="pricing-features-list">
                  <li>✓ Phân tích 3 chỉ số da cơ bản</li>
                  <li>✓ Gợi ý routine skincare cơ bản</li>
                  <li>✓ Tối đa 2 lượt quét da / tháng</li>
                  <li>✓ Lưu lịch sử quét 30 ngày</li>
                </ul>
                <button type="button" className="pricing-buy-btn" onClick={() => handleUpgrade("Basic")}>
                  MUA NGAY
                </button>
              </div>

              {/* Gói Premium */}
              <div className="pricing-card pricing-card--featured">
                <div className="pricing-featured-badge">ĐƯỢC KHUYÊN DÙNG</div>
                <div className="pricing-card-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3>Gói Premium (VIP)</h3>
                <p className="pricing-card-desc">Lựa chọn tốt nhất để cải thiện da chuyên sâu.</p>
                <div className="pricing-card-price">
                  <strong>299.000 đ</strong>
                  <span>/ tháng</span>
                </div>
                <ul className="pricing-features-list">
                  <li>✓ Phân tích sâu 10 chỉ số da AI</li>
                  <li>✓ Gợi ý routine skincare chuẩn 100%</li>
                  <li>✓ Không giới hạn số lượt quét da</li>
                  <li>✓ Kết nối Bác sĩ Da Liễu trực tuyến</li>
                  <li>✓ Biểu đồ theo dõi lịch sử trọn đời</li>
                  <li>✓ Ưu đãi giảm 5% khi mua mỹ phẩm</li>
                </ul>
                <button type="button" className="pricing-buy-btn" onClick={() => handleUpgrade("VIP")}>
                  MUA NGAY
                </button>
              </div>

              {/* Gói Spa */}
              <div className="pricing-card">
                <div className="pricing-card-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3>Spa / Doanh Nghiệp</h3>
                <p className="pricing-card-desc">Tích hợp AI cho các spa và clinic thẩm mỹ.</p>
                <div className="pricing-card-price">
                  <strong>Liên Thế</strong>
                </div>
                <ul className="pricing-features-list">
                  <li>✓ Tích hợp API quét da AI riêng</li>
                  <li>✓ Tùy biến giao diện (White-label)</li>
                  <li>✓ Khắc logo thương hiệu trên báo cáo</li>
                  <li>✓ Thống kê phân tích tệp khách hàng</li>
                  <li>✓ Hỗ trợ kỹ thuật ưu tiên 24/7</li>
                </ul>
                <Link to="/contact" className="pricing-buy-btn pricing-buy-btn--contact">
                  NHẬN BÁO GIÁ
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
