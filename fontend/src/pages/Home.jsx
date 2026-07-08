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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
              tiềm năng
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
      <section className="features" id="analysis">
        <h2>Tính năng nổi bật</h2>

        <p className="section-text">
          Công nghệ Beauty AI giúp bạn hiểu làn da của mình
          và lựa chọn sản phẩm phù hợp hơn.
        </p>

        <div className="card-container">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="card card--clickable"
              style={{ animationDelay: `${index * 0.12}s` }}
              onClick={() => navigate(feature.to)}
              onKeyDown={(e) => e.key === "Enter" && navigate(feature.to)}
              role="button"
              tabIndex={0}
            >
              <div className="card-image-wrap">
                <img src={feature.image} alt={feature.title} className="card-image" />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
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
