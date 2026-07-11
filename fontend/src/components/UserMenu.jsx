import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./UserMenu.css";

export default function UserMenu() {
  const { currentUser, logout } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get capitalized last name (first word from right) for display: e.g. "Nguyen Van Manh" -> "MANH"
  const displayName = currentUser
    ? currentUser.name.trim().split(" ").pop().toUpperCase()
    : "";

  // Time-based greeting: "Good morning", "Good afternoon", "Good evening"
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning 🌞";
    if (hour >= 12 && hour < 18) return "Good afternoon 🌤️";
    return "Good evening 🌙";
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="user-menu-container" ref={dropdownRef}>
      {/* Target icon and name */}
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-menu-avatar-wrap">
          <svg
            className="user-menu-avatar-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <span className="user-menu-display-name">{displayName}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <h4>
              {getGreeting()} {displayName} !
            </h4>
          </div>
          <div className="user-menu-divider"></div>
          <div className="user-menu-body">
            <button
              type="button"
              className="user-menu-item"
              onClick={() => {
                navigate("/profile?tab=account");
                setIsOpen(false);
              }}
            >
              <div className="user-menu-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 8h10M7 12h10M7 16h6" />
                </svg>
              </div>
              <div className="user-menu-item-text">
                <strong>Thông tin tài khoản</strong>
                <span>Tài khoản, Đơn hàng, Địa chỉ giao nhận, Đổi mật khẩu</span>
              </div>
            </button>

            <button
              type="button"
              className="user-menu-item"
              onClick={() => {
                navigate("/profile?tab=orders");
                setIsOpen(false);
              }}
            >
              <div className="user-menu-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div className="user-menu-item-text">
                <strong>Lịch sử đặt hàng</strong>
                <span>Tra cứu đơn hàng đã đặt trước đó</span>
              </div>
            </button>

            {currentUser.role === "admin" && (
              <button
                type="button"
                className="user-menu-item user-menu-item--admin"
                onClick={() => {
                  navigate("/admin");
                  setIsOpen(false);
                }}
              >
                <div className="user-menu-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div className="user-menu-item-text">
                  <strong>Trang Quản lý Admin</strong>
                  <span>Quản lý sản phẩm, đơn hàng và khách hàng</span>
                </div>
              </button>
            )}
          </div>
          <div className="user-menu-divider"></div>
          <div className="user-menu-footer">
            <button
              type="button"
              className="user-menu-logout-btn"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
