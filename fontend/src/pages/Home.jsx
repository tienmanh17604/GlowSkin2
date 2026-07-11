import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import Footer from "../components/Footer";
import "../App.css";

const NAV_LINKS = [
  { label: "Trang chủ", href: "#home" },
  { label: "Phân tích da", to: "/analyze" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Giỏ hàng", to: "/cart" },
  { label: "Cộng đồng", href: "#community" },
  { label: "Liên hệ", to: "/contact" },
];

const img = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

const FEATURES = [
  {
    title: "Phân tích Da AI",
    desc: "Khám phá tình trạng làn da của bạn bằng công nghệ phân tích ảnh AI tiên tiến, giúp đưa ra chẩn đoán chính xác về loại da và các vấn đề cần cải thiện.",
    shortDesc: "Chẩn đoán & phân tích loại da",
    image: img("1616394584738-fc6e612e71b9", 600),
    to: "/analyze",
    bg: "#ebdcd0",
    panel: "#f7f0eb",
    btnBg: "#8b6e56",
  },
  {
    title: "Đánh giá Mỹ phẩm",
    desc: "Tra cứu cơ sở dữ liệu hàng ngàn sản phẩm, xem đánh giá chi tiết và các trải nghiệm chân thực từ cộng đồng người dùng trước khi quyết định mua sắm.",
    shortDesc: "Đánh giá chi tiết từ cộng đồng",
    image: img("1608571423902-eed4a5ad8108", 600),
    to: "/products",
    bg: "#dfcebe",
    panel: "#eadbc8",
    btnBg: "#736454",
  },
  {
    title: "Gợi ý thông minh",
    desc: "Nhận danh sách đề xuất các dòng mỹ phẩm chăm sóc da (skincare) tối ưu nhất, được cá nhân hóa hoàn toàn dựa trên chỉ số da của riêng bạn.",
    shortDesc: "Đề xuất sản phẩm phù hợp",
    image: img("1571781926291-c477ebfd024b", 600),
    to: "/products",
    bg: "#c4a484",
    panel: "#d3b89e",
    btnBg: "#a07553",
  },
  {
    title: "Lập Lộ trình Skincare",
    desc: "Xây dựng routine chăm sóc da khoa học sáng và tối, thiết lập lịch nhắc nhở và theo dõi hành trình thay đổi làn da khỏe đẹp mỗi ngày.",
    shortDesc: "Lộ trình chăm sóc da khoa học",
    image: img("1556228720-195a672e8a03", 600),
    to: "/analyze",
    bg: "#e2d4c9",
    panel: "#eedfd2",
    btnBg: "#806651",
  },
];

const GALLERY_IMAGES = [
  img("1515377905703-c4788e51af15", 500),
  img("1512496015851-a90fb38ba796", 500),
  img("1556228720-195a672e8a03", 500),
  img("1522335789203-aabd1fc54bc9", 500),
  img("1616394584738-fc6e612e71b9", 500),
  img("1612817288484-6f916006741a", 500),
  img("1571781926291-c477ebfd024b", 500),
  img("1598440947619-2c35fc9aa908", 500),
];

const WHY_ITEMS = [
  {
    emoji: "✨",
    title: "Phân tích da AI",
    image: img("1616394584738-fc6e612e71b9", 700),
  },
  {
    emoji: "💖",
    title: "Lộ trình cá nhân hóa",
    image: img("1556228720-195a672e8a03", 700),
  },
  {
    emoji: "🛍",
    title: "Gợi ý thông minh",
    image: img("1556228578-0d85b1a4d571", 700),
  },
  {
    emoji: "🌎",
    title: "Cộng đồng làm đẹp",
    image: img("1522335789203-aabd1fc54bc9", 700),
  },
];

// ── Draggable Vertical Slider Component ──────────────────────────────────────
function VerticalSlider({ count, activeIndex, onChange, color }) {
  const TRACK_H = 160; // px height of track
  const thumbRef = useRef(null);
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const indexToY = useCallback(
    (idx) => (idx / (count - 1)) * TRACK_H,
    [count]
  );

  const yToIndex = useCallback(
    (y) => Math.round(Math.max(0, Math.min(count - 1, (y / TRACK_H) * (count - 1)))),
    [count]
  );

  const handleMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;

    const onMove = (ev) => {
      if (!dragging.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const rawY = ev.clientY - rect.top;
      onChange(yToIndex(rawY));
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleTrackClick = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const rawY = e.clientY - rect.top;
    onChange(yToIndex(rawY));
  };

  const thumbY = indexToY(activeIndex);

  return (
    <div
      style={{
        position: "absolute",
        right: "2.5%",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0",
        userSelect: "none",
      }}
    >
      {/* Counter top */}
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: color,
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          transition: "color 0.3s ease",
          marginBottom: "10px",
          letterSpacing: "0.04em",
        }}
      >
        {String(activeIndex + 1).padStart(2, "0")}
      </span>

      {/* Draggable track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        style={{
          width: "28px",
          height: `${TRACK_H}px`,
          position: "relative",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* Rail line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            width: "2px",
            height: "100%",
            background: "rgba(180,160,140,0.2)",
            borderRadius: "2px",
          }}
        />
        {/* Filled rail */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            width: "2px",
            borderRadius: "2px",
            height: `${thumbY}px`,
            background: color,
            transition: "height 0.5s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease",
          }}
        />

        {/* Draggable thumb */}
        <div
          ref={thumbRef}
          onMouseDown={handleMouseDown}
          style={{
            position: "absolute",
            left: "50%",
            top: `${thumbY}px`,
            transform: "translate(-50%, -50%)",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "white",
            border: `3px solid ${color}`,
            boxShadow: `0 0 0 4px ${color}33, 0 4px 12px rgba(0,0,0,0.2)`,
            cursor: "grab",
            transition: "top 0.5s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease, box-shadow 0.3s ease",
            zIndex: 2,
          }}
        />

        {/* Slide snap markers */}
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            onClick={(e) => { e.stopPropagation(); onChange(i); }}
            style={{
              position: "absolute",
              left: "50%",
              top: `${indexToY(i)}px`,
              transform: "translate(-50%, -50%)",
              width: i === activeIndex ? "6px" : "4px",
              height: i === activeIndex ? "6px" : "4px",
              borderRadius: "50%",
              background: i <= activeIndex ? color : "rgba(180,160,140,0.35)",
              transition: "all 0.4s ease",
              cursor: "pointer",
              zIndex: 3,
            }}
          />
        ))}
      </div>

      {/* Counter bottom */}
      <span
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: "rgba(100,80,60,0.45)",
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          marginTop: "10px",
          letterSpacing: "0.04em",
        }}
      >
        {String(count).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function Home({ videoReady = false }) {

  const navigate = useNavigate();
  const { currentUser, setIsLoginOpen } = useApp();
  const { setIsCartOpen } = useCart();

  const videoRef = useRef(null);

  // Carousel states for interactive 3D layout
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // Dùng ref để track isAnimating mà không trigger re-render interval
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    FEATURES.forEach((item) => {
      const img = new Image();
      img.src = item.image;
    });
  }, []);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const navigateCarousel = (direction) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setActiveIndex((prev) =>
      direction === "next" ? (prev + 1) % 4 : (prev + 3) % 4
    );
    setTimeout(() => {
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }, 650);
  };

  // Autoplay: xoay ngẫu nhiên mọi 2 giây — KHÔNG THỂ DỪNG
  useEffect(() => {
    const timer = setInterval(() => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      setIsAnimating(true);
      setActiveIndex((prev) => {
        let next;
        do { next = Math.floor(Math.random() * 4); } while (next === prev);
        return next;
      });
      setTimeout(() => {
        isAnimatingRef.current = false;
        setIsAnimating(false);
      }, 650);
    }, 2000);
    return () => clearInterval(timer);
  }, []); // [] = tạo 1 lần, không bao giờ bị reset hay dừng

  const centerCard = activeIndex;
  const leftCard = (activeIndex + 3) % 4;
  const rightCard = (activeIndex + 1) % 4;
  const backCard = (activeIndex + 2) % 4;

  const getStyle = (index) => {
    const easing = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const duration = 700;
    const common = {
      position: "absolute",
      width: isMobile ? "150px" : "185px",
      height: isMobile ? "230px" : "260px",
      top: "auto",
      transform: "translateX(-50%) scale(1)",
      transition: `transform ${duration}ms ${easing}, filter ${duration}ms ${easing}, opacity ${duration}ms ${easing}, left ${duration}ms ${easing}, bottom ${duration}ms ${easing}`,
      willChange: "transform, filter, opacity",
    };

    // ── ACTIVE: phóng to hẳn, đẩy lên cao ──
    if (index === centerCard)
      return {
        ...common,
        left: "50%",
        bottom: isMobile ? "22%" : "35%",
        transform: `translateX(-50%) scale(${isMobile ? 1.2 : 1.35})`,
        filter: "blur(0px)",
        opacity: 1,
        zIndex: 20,
      };

    // ── LEFT: bé tí, kéo vào gần hơn ──
    if (index === leftCard)
      return {
        ...common,
        left: isMobile ? "22%" : "37%",
        bottom: isMobile ? "28%" : "37%",
        transform: `translateX(-50%) scale(${isMobile ? 0.45 : 0.38})`,
        filter: "blur(2px)",
        opacity: 0.55,
        zIndex: 10,
      };

    // ── RIGHT: bé tí, kéo vào gần hơn ──
    if (index === rightCard)
      return {
        ...common,
        left: isMobile ? "78%" : "63%",
        bottom: isMobile ? "28%" : "37%",
        transform: `translateX(-50%) scale(${isMobile ? 0.45 : 0.38})`,
        filter: "blur(2px)",
        opacity: 0.55,
        zIndex: 10,
      };

    // ── BACK: gần như biến mất ──
    return {
      ...common,
      left: "50%",
      bottom: isMobile ? "28%" : "37%",
      transform: `translateX(-50%) scale(${isMobile ? 0.25 : 0.2})`,
      filter: "blur(12px)",
      opacity: 0.06,
      zIndex: 5,
    };
  };


  // Play video from the start only after the splash panels have fully slid open
  useEffect(() => {
    if (!videoReady || !videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => { });
  }, [videoReady]);

  return (
    <>
      <Navbar />

      {/* 1. Nuvé Fullscreen Hero Section */}
      <section className="nuve-hero" id="home">
        {/* Fullscreen Video Background layer */}
        <div className="nuve-video-bg">
          <video
            ref={videoRef}
            src="https://res.cloudinary.com/buevamso/video/upload/v1783521218/glowskin/hero/skincare_hero_video.mp4"
            className="nuve-bg-video"
            loop
            muted
            playsInline
          />
          <div className="nuve-video-overlay"></div>
        </div>

        {/* Content Container overlaid on top of video */}
        <div className="nuve-hero-container">
          {/* Cột trái */}
          <div className="nuve-left-col">


            <h1 className="nuve-hero-title">
              Đánh thức
              <br />
              <span className="nuve-hero-accent">tiềm năng</span>
              <br />
              làn da bạn
            </h1>

            <p className="nuve-hero-subtitle">
              Công nghệ AI quét khuôn mặt và
              <br />
              chỉ ra các điểm cần cải thiện
            </p>

            <button
              type="button"
              className="nuve-cta-btn"
              onClick={() => navigate("/analyze")}
            >
              Phân tích da ngay
            </button>
          </div>

          {/* Cột phải */}
          <div className="nuve-right-col">
            <div className="nuve-stat-item">
              <div className="nuve-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="nuve-stat-info">
                <h3>95%</h3>
                <p>phân tích da chính xác</p>
              </div>
            </div>

            <div className="nuve-stat-item">
              <div className="nuve-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12a4 4 0 1 1 8 0 4 4 0 1 1-8 0" />
                </svg>
              </div>
              <div className="nuve-stat-info">
                <h3>30+</h3>
                <p>vấn đề da được phân tích</p>
              </div>
            </div>

            <div className="nuve-stat-item">
              <div className="nuve-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                </svg>
              </div>
              <div className="nuve-stat-info">
                <h3>7 ngày</h3>
                <p>lộ trình cá nhân hóa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section (Tính năng nổi bật) */}
      <section 
        className="features-interactive-3d"
        id="analysis"
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: FEATURES[activeIndex].bg,
          transition: "background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
        onMouseEnter={() => setAutoplayPaused(true)}
        onMouseLeave={() => setAutoplayPaused(false)}
      >
        {/* Grain overlay */}
        <div
          className="absolute-grain-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 50,
            opacity: 0.35,
            backgroundSize: "200px 200px",
            backgroundRepeat: "repeat",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Ghost Text */}
        <div
          className="ghost-text-background"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "18%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', 'Montserrat', sans-serif",
              fontSize: "clamp(80px, 16vw, 250px)",
              fontWeight: 900,
              color: "rgba(255, 255, 255, 0.12)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            GLOWSKIN
          </span>
        </div>

        {/* ── RIGHT SIDE: Draggable vertical slider ── */}
        {!isMobile && (
          <VerticalSlider
            count={FEATURES.length}
            activeIndex={activeIndex}
            onChange={setActiveIndex}
            color={FEATURES[activeIndex].btnBg}
          />
        )}


        {/* Carousel Stage */}
        <div
          className="carousel-stage-wrapper"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3,
          }}
        >
          {FEATURES.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <div 
                key={index} 
                style={getStyle(index)}
                className={`carousel-3d-card ${isActive ? "is-active" : ""}`}
                onClick={() => isActive && navigate(item.to)}
                onKeyDown={(e) => e.key === "Enter" && isActive && navigate(item.to)}
                role="button"
                tabIndex={isActive ? 0 : -1}
              >
                <div className="carousel-card-img-wrap" style={{ flexGrow: 1, overflow: "hidden", position: "relative", minHeight: 0 }}>
                  <img
                    src={item.image}
                    draggable={false}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                  <div className="carousel-card-img-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M22 22l-4.35-4.35" />
                    </svg>
                  </div>
                </div>
                
                <div className="carousel-card-content" style={{ padding: "12px 14px", flexShrink: 0, background: "#ffffff", textAlign: "left" }}>
                  <h3 className="carousel-card-title" style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 700, fontStyle: "italic", margin: "0 0 3px 0", color: "#121318", fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.2 }}>{item.title}</h3>
                  <p className="carousel-card-desc" style={{ fontSize: "10px", color: "#777", lineHeight: 1.3, margin: "0 0 8px 0" }}>{item.shortDesc}</p>
                  <div className="carousel-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "7px" }}>
                    <span className="carousel-card-index" style={{ fontSize: "10px", color: "#aaa", fontWeight: 600 }}>{`0${index + 1}/04`}</span>
                    <span className="carousel-card-badge" style={{ fontSize: "10px", color: FEATURES[index].btnBg, fontWeight: 600 }}>Khám phá</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── TOP-LEFT corner: dynamic info text ── */}
        {!isMobile && activeIndex % 2 === 0 && (
          <div
            className="features-dynamic-info"
            key={`tl-${activeIndex}`}
            style={{
              position: "absolute",
              top: "15%",
              left: "5%",
              width: "320px",
              zIndex: 15,
            }}
          >
            <div style={{ width: "50px", height: "4px", backgroundColor: FEATURES[activeIndex].btnBg, marginBottom: "18px", borderRadius: "2px", transition: "background-color 0.3s ease" }} />
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "38px", fontWeight: 700, fontStyle: "italic", lineHeight: 1.15, margin: "0 0 14px 0", color: "#1a1008", letterSpacing: "-0.01em" }}>
              {FEATURES[activeIndex].title}
            </h3>
            <p style={{ fontSize: "14px", lineHeight: 1.65, color: "#555", margin: 0, fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
              {FEATURES[activeIndex].desc}
            </p>
          </div>
        )}

        {/* ── TOP-RIGHT corner: dynamic info text ── */}
        {!isMobile && activeIndex % 2 !== 0 && (
          <div
            className="features-dynamic-info"
            key={`tr-${activeIndex}`}
            style={{
              position: "absolute",
              top: "15%",
              right: "5%",
              width: "320px",
              zIndex: 15,
              textAlign: "left",
            }}
          >
            <div style={{ width: "50px", height: "4px", backgroundColor: FEATURES[activeIndex].btnBg, marginBottom: "18px", borderRadius: "2px", transition: "background-color 0.3s ease" }} />
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "38px", fontWeight: 700, fontStyle: "italic", lineHeight: 1.15, margin: "0 0 14px 0", color: "#1a1008", letterSpacing: "-0.01em" }}>
              {FEATURES[activeIndex].title}
            </h3>
            <p style={{ fontSize: "14px", lineHeight: 1.65, color: "#555", margin: 0, fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>
              {FEATURES[activeIndex].desc}
            </p>
          </div>
        )}

        {/* ── BOTTOM-LEFT corner: slide indicator + short desc ── */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "5%",
            zIndex: 60,
            maxWidth: isMobile ? "55%" : "280px",
            textAlign: "left",
          }}
        >
          <p style={{ margin: "0 0 5px 0", fontSize: isMobile ? "13px" : "15px", fontWeight: 800, color: FEATURES[activeIndex].btnBg, transition: "color 0.3s ease", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
            {`0${activeIndex + 1} / 0${FEATURES.length}`}
          </p>
          <p style={{ margin: 0, fontSize: isMobile ? "11px" : "12px", lineHeight: 1.55, color: "#666", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
            {FEATURES[activeIndex].shortDesc}
          </p>
        </div>

        {/* ── BOTTOM-CENTER: Navigation buttons — same row as CTA ── */}
        <div
          style={{
            position: "absolute",
            bottom: isMobile ? "10%" : "8%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "14px",
            zIndex: 60,
          }}
        >
          <button
            onClick={() => navigateCarousel("prev")}
            style={{
              width: "46px",
              height: "46px",
              color: "white",
              background: FEATURES[activeIndex].btnBg,
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <button
            onClick={() => navigateCarousel("next")}
            style={{
              width: "46px",
              height: "46px",
              color: "white",
              background: FEATURES[activeIndex].btnBg,
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* ── BOTTOM-RIGHT corner: CTA button ── */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            right: "5%",
            zIndex: 60,
          }}
        >
          <Link
            to={FEATURES[activeIndex].to}
            style={{
              background: FEATURES[activeIndex].btnBg,
              color: "white",
              padding: isMobile ? "11px 22px" : "13px 30px",
              borderRadius: "30px",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: isMobile ? "13px" : "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 22px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.15)";
            }}
          >
            Khám phá ngay
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </section>

      {/* 3. Gallery Section (Khoảnh khắc Làm đẹp) */}
      <section className="gallery" id="gallery">
        <h2>Khoảnh khắc Làm đẹp</h2>
        <p className="section-text">
          Cảm hứng làm đẹp từ cộng đồng GlowSkin
        </p>

        <div className="gallery-track-wrap">
          <div className="gallery-track">
            {[...GALLERY_IMAGES, ...GALLERY_IMAGES].map((src, index) => (
              <div key={`${src}-${index}`} className="gallery-item">
                <img src={src} alt={`Gallery ${(index % GALLERY_IMAGES.length) + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="gallery-grid">
          {GALLERY_IMAGES.slice(0, 6).map((src, index) => (
            <div
              key={src}
              className="gallery-grid-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img src={src} alt={`Inspiration ${index + 1}`} />
              <div className="gallery-overlay">
                <span>GlowSkin ✦</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Why Section (Tại sao chọn GlowSkin?) */}
      <section className="why" id="community">
        <h2>Tại sao chọn GlowSkin?</h2>

        <div className="why-grid">
          {WHY_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className="why-card"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="why-card-image">
                <img src={item.image} alt={item.title} />
              </div>
              <p>
                {item.emoji} {item.title}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}
