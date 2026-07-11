import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import CartButton from "./CartButton";
import UserMenu from "./UserMenu";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";

const NAV_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Phân tích da", to: "/analyze" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Giỏ hàng", isCart: true },
  { label: "Cộng đồng", href: "#community" },
  { label: "Liên hệ", to: "/contact" },
];

export default function Navbar() {
  const { currentUser, setIsLoginOpen, wishlist } = useApp();
  const { setIsCartOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once to set the initial state
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to) => to && location.pathname === to;

  const wishlistCount = Object.values(wishlist || {}).filter(Boolean).length;

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
        <button type="button" className="nav-wishlist-btn" aria-label="Yêu thích">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {wishlistCount > 0 && (
            <span className="wishlist-badge">{wishlistCount}</span>
          )}
        </button>

        <CartButton />

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
