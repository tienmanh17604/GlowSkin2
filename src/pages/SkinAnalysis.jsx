import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CartButton from "../components/CartButton";
import Logo from "../components/Logo";
import ProductRecommendations from "../components/ProductRecommendations";
import {
  analyzeSkinImage,
  isUsingDemoMode,
  sendFollowUp,
} from "../services/analyzeSkin";
import { getRecommendedProducts } from "../services/recommendProducts";
import "./SkinAnalysis.css";

function formatMessage(text) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            part
          )
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

export default function SkinAnalysis() {
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
    return getRecommendedProducts(analysisText);
  }, [analysisText]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startCamera = async () => {
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
      const result = await analyzeSkinImage(dataUrl);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: result.content,
          isDemo: result.isDemo,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `❌ Lỗi: ${err.message}. Kiểm tra API key trong file .env và khởi động lại server.`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: "user", content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      const result = await sendFollowUp(updatedHistory);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: result.content,
          isDemo: result.isDemo,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `❌ Lỗi: ${err.message}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    stopCamera();
    setMode("choose");
    setImage(null);
    setMessages([]);
    setInput("");
    setCameraError("");
  };

  const hasAnalysis = Boolean(recommendations?.products.length);

  return (
    <div className="analyze-page">
      <header className="analyze-header">
        <Logo />
        <div className="analyze-header-actions">
          <CartButton />
          <Link to="/" className="analyze-back">
            ← Về trang chủ
          </Link>
        </div>
      </header>

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
                <span>📷</span>
                Mở camera
              </button>
              <button
                type="button"
                className="analyze-btn analyze-btn--secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <span>🖼</span>
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
              <button type="button" className="analyze-btn analyze-btn--ghost" onClick={resetAll}>
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
        <div ref={productsRef}>
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
    </div>
  );
}
