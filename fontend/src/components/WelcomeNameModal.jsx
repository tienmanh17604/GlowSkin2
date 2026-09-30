import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import "./WelcomeNameModal.css";

export default function WelcomeNameModal() {
  const { currentUser, isNameModalOpen, setIsNameModalOpen, updatePreferredName } = useApp();
  const [nameInput, setNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // When modal opens, pre-fill with existing preferredName or first/last name
  useEffect(() => {
    if (isNameModalOpen) {
      const initialName =
        currentUser?.preferredName ||
        currentUser?.name ||
        "";
      setNameInput(initialName);

      // Lock body scroll
      document.body.style.overflow = "hidden";

      // Auto-focus input
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 150);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isNameModalOpen, currentUser]);

  // Check if user is logged in but doesn't have preferredName yet on initial load
  useEffect(() => {
    if (currentUser && !currentUser.preferredName) {
      const hasDismissed = sessionStorage.getItem(`glowskin_name_prompt_dismissed_${currentUser.id || currentUser._id}`);
      if (!hasDismissed) {
        setIsNameModalOpen(true);
      }
    }
  }, [currentUser, setIsNameModalOpen]);

  if (!isNameModalOpen || !currentUser) return null;

  const handleClose = () => {
    if (currentUser) {
      sessionStorage.setItem(`glowskin_name_prompt_dismissed_${currentUser.id || currentUser._id}`, "true");
    }
    setIsNameModalOpen(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      handleClose();
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Immediately update preferredName in AppContext, localStorage and backend
      await updatePreferredName(trimmed);

      // 2. Mark prompt as completed
      const userKey = currentUser.id || currentUser._id || currentUser.email || "user";
      sessionStorage.setItem(`glowskin_name_prompt_dismissed_${userKey}`, "true");

      // 3. Immediately close modal so user sees the change right away
      setIsNameModalOpen(false);
    } catch (err) {
      console.error("Lỗi cập nhật tên gọi thân mật:", err);
      setIsNameModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="welcome-name-overlay" onClick={handleClose}>
      <div className="welcome-name-card" onClick={(e) => e.stopPropagation()}>
        {/* Subtle close button */}
        <button
          type="button"
          className="welcome-name-close-btn"
          onClick={handleClose}
          aria-label="Đóng"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Ambient top light gradient */}
        <div className="welcome-name-glow"></div>

        {/* Top Header Logo */}
        <div className="welcome-name-brand">
          <span className="welcome-name-logo-text">GLOWSKIN</span>
          <span className="welcome-name-logo-ai">Ai</span>
        </div>

        {/* Content Box */}
        <div className="welcome-name-content">
          <p className="welcome-name-subtitle">Hãy bắt đầu hành trình mới</p>
          <h2 className="welcome-name-title">
            Bạn muốn GlowSkin gọi bạn là gì nào?
          </h2>

          <form onSubmit={handleSubmit} className="welcome-name-form">
            <div className="welcome-name-input-wrap">
              <input
                ref={inputRef}
                type="text"
                className="welcome-name-input"
                placeholder="Ví dụ: Khánh Bu"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={40}
                required
              />
              {nameInput && (
                <button
                  type="button"
                  className="welcome-name-clear-btn"
                  onClick={() => {
                    setNameInput("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Xóa"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="welcome-name-hint">
              Tên này sẽ hiển thị trên góc tài khoản và cách trợ lý AI đồng hành cùng bạn.
            </p>

            {/* Bottom Button */}
            <div className="welcome-name-action">
              <button
                type="submit"
                className="welcome-name-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="welcome-name-loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                ) : (
                  "Tiếp tục"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
