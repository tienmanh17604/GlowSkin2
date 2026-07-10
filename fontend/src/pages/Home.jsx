import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartButton from "../components/CartButton";
import Logo from "../components/Logo";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import "../App.css";

const NAV_LINKS = [
  { label: "Trang chủ", href: "#home" },
  { label: "Phân tích da", to: "/analyze" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Giỏ hàng", to: "/cart" },
  { label: "Cộng đồng", href: "#community" },
  { label: "Liên hệ", href: "#contact" },
];

const img = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

const FEATURES = [
  {
    title: "Phân tích Da AI",
    desc: "Phân tích da bằng AI từ hình ảnh.",
    image: img("1616394584738-fc6e612e71b9", 600),
    to: "/analyze",
  },
  {
    title: "Đánh giá Mỹ phẩm",
    desc: "Đọc review chân thực từ cộng đồng.",
    image: img("1608571423902-eed4a5ad8108", 600),
    to: "/products",
  },
  {
    title: "Gợi ý thông minh",
    desc: "Đề xuất mỹ phẩm phù hợp với da.",
    image: img("1571781926291-c477ebfd024b", 600),
    to: "/products",
  },
  {
    title: "Lập Lộ trình Skincare",
    desc: "Xây dựng routine skincare cá nhân.",
    image: img("1556228720-195a672e8a03", 600),
    to: "/analyze",
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

export default function Home({ videoReady = false }) {
  const navigate = useNavigate();
  const { currentUser, logout, setIsLoginOpen } = useApp();
  const { setIsCartOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef(null);

  // States and Handlers for the 3D rotating carousel
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const dragStartX = useRef(0);
  const startRotation = useRef(0);
  const targetRotationRef = useRef(0);
  const animFrameRef = useRef(null);

  // Smooth lerp animation toward target rotation
  const animateRotation = () => {
    setRotation(prev => {
      const diff = targetRotationRef.current - prev;
      if (Math.abs(diff) < 0.05) return targetRotationRef.current;
      return prev + diff * 0.08; // smooth lerp factor
    });
    animFrameRef.current = requestAnimationFrame(animateRotation);
  };

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animateRotation);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desktop Hover: mouse position directly controls which card faces front
  const handleFeaturesMouseMove = (e) => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    setCursorPos({ x: e.clientX, y: e.clientY });
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = (x / width) - 0.5;
    targetRotationRef.current = -percent * (90 * FEATURES.length);
  };

  const handleFeaturesMouseEnter = () => {
    if (window.matchMedia("(hover: hover)").matches) setShowCursor(true);
  };

  const handleFeaturesMouseLeave = () => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    setShowCursor(false);
    const snapped = Math.round(-targetRotationRef.current / 90) * -90;
    targetRotationRef.current = snapped;
  };

  // Mobile Touch Swipe handlers
  const handleDragStart = (e) => {
    if (window.matchMedia("(hover: hover)").matches) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    startRotation.current = targetRotationRef.current;
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX.current;
    targetRotationRef.current = startRotation.current + diff * 0.5;
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const snapped = Math.round(-targetRotationRef.current / 90) * -90;
    targetRotationRef.current = snapped;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Always scroll to top when Home mounts (after splash)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Play video from the start only after the splash panels have fully slid open
  useEffect(() => {
    if (!videoReady || !videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => { });
  }, [videoReady]);

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <Logo />

        <ul className="nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              {link.to ? (
                link.to === "/cart" ? (
                  <button
                    type="button"
                    className="nav-link-btn"
                    onClick={() => setIsCartOpen(true)}
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link to={link.to}>{link.label}</Link>
                )
              ) : (
                <a href={link.href}>{link.label}</a>
              )}
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {!currentUser ? (
            <button
              type="button"
              className="nav-user-login-btn"
              onClick={() => setIsLoginOpen(true)}
            >
              <svg className="nav-icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Đăng nhập</span>
            </button>
          ) : (
            <div className="user-nav-profile">
              <span className="user-nav-name">
                Xin chào, {currentUser.name.split(" ").pop()}
                <span className={`user-badge user-badge--${currentUser.membership.toLowerCase()}`}>
                  {currentUser.membership}
                </span>
              </span>
              {currentUser.role === "admin" && (
                <Link to="/admin" className="nav-admin-link">
                  ⚙️ Quản lý
                </Link>
              )}
              <button type="button" className="nav-logout-btn" onClick={logout}>
                Đăng xuất
              </button>
            </div>
          )}

          <button type="button" className="nav-wishlist-btn" aria-label="Yêu thích">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          <CartButton />
        </div>
      </nav>

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
            <div className="nuve-trust-badge">
              <div className="nuve-avatars">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop" alt="User 1" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop" alt="User 2" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop" alt="User 3" />
              </div>
              <span className="nuve-trust-text">Được tin dùng bởi hơn 10.000+ người</span>
            </div>

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
        className="features" 
        id="analysis"
        onMouseMove={handleFeaturesMouseMove}
        onMouseEnter={handleFeaturesMouseEnter}
        onMouseLeave={handleFeaturesMouseLeave}
      >
        <div className="features-overlay-bg"></div>
        
        {/* Custom cursor dot */}
        <div
          className={`features-cursor-hint ${showCursor ? "visible" : ""}`}
          style={{ left: cursorPos.x, top: cursorPos.y }}
        >
          ↔
        </div>
        
        <div className="features-content-wrap">
          <h2 className="features-title-3d">TÍNH NĂNG NỔI BẬT</h2>

          <p className="features-subtitle-3d">
            Công nghệ Beauty AI giúp bạn hiểu làn da của mình
            và lựa chọn sản phẩm phù hợp hơn.
          </p>

          <div className="features-carousel-container">
            <div 
              className="features-carousel-stage"
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              {FEATURES.map((feature, index) => {
                const cardAngle = index * 90;
                let diffAngle = cardAngle + rotation;
                
                // Normalize to [-180, 180]
                let normalizedDiff = ((diffAngle + 180) % 360);
                if (normalizedDiff < 0) normalizedDiff += 360;
                normalizedDiff -= 180;

                const rad = normalizedDiff * Math.PI / 180;

                // Wider X spread (340px), strong Z depth (160px)
                const x = Math.sin(rad) * 340;
                const z = Math.cos(rad) * 160;

                // Scale: front card = 1.0, side = 0.82, back = 0.65
                const cosNorm = (Math.cos(rad) + 1) / 2;
                const scale = 0.65 + cosNorm * 0.35;

                // rotateY: strong angle on side cards (~55deg), flat on front
                const rotateY = -normalizedDiff * 0.62;

                // Opacity: front fully visible, sides 75%, back 20%
                const opacity = 0.20 + cosNorm * 0.80;

                const zIndex = Math.round(z + 200);
                const isActive = Math.abs(normalizedDiff) < 45;

                return (
                  <div
                    key={feature.title}
                    className={`carousel-3d-card ${isActive ? "is-active" : ""}`}
                    style={{
                      transform: `translateX(${x}px) translateZ(${z}px) scale(${scale}) rotateY(${rotateY}deg)`,
                      zIndex: zIndex,
                      opacity: opacity,
                      // No CSS transition — lerp loop handles all smoothness
                      transition: "box-shadow 0.3s ease",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                    onClick={() => isActive && navigate(feature.to)}
                    onKeyDown={(e) => e.key === "Enter" && isActive && navigate(feature.to)}
                    role="button"
                    tabIndex={isActive ? 0 : -1}
                  >
                    <div className="carousel-card-img-wrap">
                      <img src={feature.image} alt={feature.title} className="carousel-card-img" />
                      <div className="carousel-card-img-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M22 22l-4.35-4.35" />
                        </svg>
                      </div>
                    </div>
                    <div className="carousel-card-content">
                      <h3 className="carousel-card-title">{feature.title}</h3>
                      <p className="carousel-card-desc">{feature.desc}</p>
                      <div className="carousel-card-footer">
                        <span className="carousel-card-index">{`0${index + 1}/0${FEATURES.length}`}</span>
                        <span className="carousel-card-badge">Khám phá</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="features-bottom-action">
            <button 
              type="button" 
              className="features-cta-3d"
              onClick={() => navigate("/analyze")}
            >
              Trải nghiệm ngay
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cta-arrow">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
      <footer id="contact">
        <h3>GlowSkin AI</h3>
        <p>EXE101 Startup Project © 2026</p>
      </footer>
    </>
  );
}
