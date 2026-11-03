import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";

const NAV_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Phân tích da", isAnalysis: true },
  { label: "Da của bạn", to: "/your-skin" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Nhật ký", isDiary: true },
  { label: "Liên hệ", to: "/contact" },
];

export default function Navbar() {
  const { currentUser, setIsLoginOpen, openLoginModal, setIsNameModalOpen, openUpgradeModal } = useApp();
  const { setIsCartOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once to set the initial state
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to) => to && location.pathname === to;

  const handleDiaryClick = () => {
    if (!currentUser) {
      openLoginModal("Tính năng Nhật Ký Làn Da 28 Ngày chỉ dành riêng cho tài khoản Premium. Vui lòng đăng nhập tài khoản để tiếp tục!");
      return;
    }
    const isPremium =
      currentUser.membership === "Premium" ||
      currentUser.membership === "VIP" ||
      currentUser.membership === "Professional" ||
      currentUser.role === "admin";

    if (!isPremium) {
      openUpgradeModal("Premium");
      return;
    }
    navigate("/diary");
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <Logo />

      <ul className="nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link.label}>
            {link.isCart ? (
              <button
                type="button"
                className="nav-link-btn"
                onClick={() => setIsCartOpen(true)}
              >
                {link.label}
              </button>
            ) : link.isAnalysis ? (
              <button
                type="button"
                className="nav-link-btn"
                onClick={() => {
                  if (!currentUser) {
                    openLoginModal("Chỉ có tài khoản mới được phân tích da. Vui lòng đăng nhập hoặc đăng ký để tiếp tục!");
                    return;
                  }
                  setIsNameModalOpen(true);
                }}
              >
                {link.label}
              </button>
            ) : link.isDiary ? (
              <button
                type="button"
                className={`nav-link-btn ${isActive("/diary") ? "nav-link-active" : ""}`}
                onClick={handleDiaryClick}
              >
                {link.label}
                {(!currentUser || currentUser.membership === "Free") && (
                  <span className="navbar-premium-crown" title="Dành riêng cho gói Premium" style={{ marginLeft: "4px", fontSize: "12px" }}>👑</span>
                )}
              </button>
            ) : link.to ? (
              <Link
                to={link.to}
                className={isActive(link.to) ? "nav-link-active" : ""}
              >
                {link.label}
              </Link>
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
          <UserMenu />
        )}
      </div>
    </nav>
  );
}
