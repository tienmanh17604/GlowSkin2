import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Analysis", to: "/analyze" },
  { label: "Products", to: "/products" },
  { label: "Community", href: "#community" },
  { label: "Contact", href: "#contact" },
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
    title: "AI Analysis",
    desc: "Phân tích da bằng AI từ hình ảnh.",
    image: img("1616394584738-fc6e612e71b9", 600),
    to: "/analyze",
  },
  {
    title: "Product Review",
    desc: "Đọc review chân thực từ cộng đồng.",
    image: img("1608571423902-eed4a5ad8108", 600),
    to: "/products",
  },
  {
    title: "Recommendation",
    desc: "Đề xuất mỹ phẩm phù hợp với da.",
    image: img("1571781926291-c477ebfd024b", 600),
    to: "/products",
  },
  {
    title: "Routine Builder",
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
    title: "AI Skin Analysis",
    image: img("1616394584738-fc6e612e71b9", 700),
  },
  {
    emoji: "💖",
    title: "Personalized Routine",
    image: img("1556228720-195a672e8a03", 700),
  },
  {
    emoji: "🛍",
    title: "Smart Recommendation",
    image: img("1556228578-0d85b1a4d571", 700),
  },
  {
    emoji: "🌎",
    title: "Beauty Community",
    image: img("1522335789203-aabd1fc54bc9", 700),
  },
];

export default function Home() {
  const navigate = useNavigate();
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
        <Link to="/" className="logo">
          <span className="logo-icon">✦</span>
          GlowSkin
        </Link>

        <ul className="nav-links">
          {NAV_LINKS.map((link, index) => (
            <li key={link.label} style={{ animationDelay: `${0.1 + index * 0.07}s` }}>
              {link.to ? (
                <Link to={link.to}>{link.label}</Link>
              ) : (
                <a href={link.href}>{link.label}</a>
              )}
            </li>
          ))}
        </ul>

        <Link to="/analyze" className="nav-cta">
          Get Started
        </Link>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <span className="badge">✨ AI Beauty Platform</span>

          <h1>
            Discover Your
            <br />
            Perfect Skin
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
              Analyze My Skin
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore Reviews
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
        <h2>Our Features</h2>

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
        <h2>Beauty Gallery</h2>
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
        <h2>Why GlowSkin?</h2>

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
