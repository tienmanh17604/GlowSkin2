import { useEffect, useState } from "react";
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

const HERO_IMAGES = [
  { src: img("1515377905703-c4788e51af15", 900), alt: "Chăm sóc da tự nhiên" },
  { src: img("1512496015851-a90fb38ba796", 900), alt: "Làn da rạng rỡ" },
  { src: img("1556228720-195a672e8a03", 900), alt: "Skincare routine" },
  { src: img("1598440947619-2c35fc9aa908", 900), alt: "Vẻ đẹp tự nhiên" },
];

const FLOATING_IMAGES = [
  {
    src: img("1556228578-0d85b1a4d571", 400),
    alt: "Serum skincare",
    className: "float-img float-img--1",
  },
  {
    src: img("1522335789203-aabd1fc54bc9", 400),
    alt: "Makeup beauty",
    className: "float-img float-img--2",
  },
  {
    src: img("1612817288484-6f916006741a", 400),
    alt: "Mỹ phẩm",
    className: "float-img float-img--3",
  },
];

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

export default function Home() {
  const navigate = useNavigate();
  const { currentUser, logout, setIsLoginOpen } = useApp();
  const { setIsCartOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [activeHero, setActiveHero] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHero((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <Logo />

        <ul className="nav-links">
          {NAV_LINKS.map((link, index) => (
            <li key={link.label} style={{ animationDelay: `${0.1 + index * 0.07}s` }}>
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

      <section className="hero" id="home">
        <div className="hero-content">
          <span className="badge">✨ Nền tảng Làm đẹp AI</span>

          <h1>
            Khám phá
            <br />
            Làn da Hoàn mỹ
          </h1>

          <p>
            AI phân tích da, review mỹ phẩm và đề xuất skincare
            routine cá nhân hóa dành riêng cho từng người dùng.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate("/analyze")}
            >
              Phân tích da ngay
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Xem đánh giá
            </button>
          </div>
        </div>

        <div className="hero-gallery">
          <div className="hero-carousel">
            {HERO_IMAGES.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                className={`hero-slide ${index === activeHero ? "hero-slide--active" : ""}`}
              />
            ))}
            <div className="hero-dots">
              {HERO_IMAGES.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`hero-dot ${index === activeHero ? "hero-dot--active" : ""}`}
                  onClick={() => setActiveHero(index)}
                  aria-label={`Ảnh ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {FLOATING_IMAGES.map((image) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className={image.className}
            />
          ))}
        </div>
      </section>

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

      <footer id="contact">
        <h3>GlowSkin AI</h3>
        <p>EXE101 Startup Project © 2026</p>
      </footer>
    </>
  );
}
