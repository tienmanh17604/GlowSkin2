import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./UserMenu.css";

export default function UserMenu() {
  const { currentUser, logout, setIsNameModalOpen } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Display preferred calling name if set, otherwise fallback to last name (e.g., "NHI", "KHÁNH BU")
  const displayName = currentUser
    ? (currentUser.preferredName
        ? currentUser.preferredName.trim().toUpperCase()
        : currentUser.name?.trim().split(" ").pop()?.toUpperCase() || "BẠN")
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
                <span>Quản lý thông tin cá nhân & hồ sơ</span>
              </div>
            </button>

            <button
              type="button"
              className="user-menu-item"
              onClick={() => {
                navigate("/your-skin");
                setIsOpen(false);
              }}
            >
              <div className="user-menu-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2-2v-2" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="user-menu-item-text">
                <strong>Báo cáo Da của bạn</strong>
                <span>Xem chẩn đoán AI & phác đồ chăm sóc da cá nhân</span>
              </div>
            </button>

            <button
              type="button"
              className="user-menu-item"
              onClick={() => {
                navigate("/diary");
                setIsOpen(false);
              }}
            >
              <div className="user-menu-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="user-menu-item-text">
                <strong>Nhật ký làn da (28 ngày)</strong>
                <span>Lịch chụp theo dõi ảnh và chu trình da</span>
              </div>
            </button>

            <button
              type="button"
              className="user-menu-item"
              onClick={() => {
                setIsNameModalOpen(true);
                setIsOpen(false);
              }}
            >
              <div className="user-menu-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div className="user-menu-item-text">
                <strong>Tên gọi thân mật</strong>
                <span>Đổi tên bạn muốn GlowSkin gọi</span>
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
