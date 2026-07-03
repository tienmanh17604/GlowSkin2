import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Logo from "./Logo";
import "./LoginModal.css";

export default function LoginModal() {
  const navigate = useNavigate();
  const { isLoginOpen, setIsLoginOpen, login, register } = useApp();

  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isLoginOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoginOpen]);

  if (!isLoginOpen) return null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setFormData({ name: "", email: "", password: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Vui lòng điền đầy đủ email và mật khẩu!");
      return;
    }

    if (activeTab === "login") {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setIsLoginOpen(false);
        if (result.user.role === "admin") {
          navigate("/admin");
        }
      } else {
        setError(result.message);
      }
    } else {
      if (!formData.name) {
        setError("Vui lòng nhập họ tên!");
        return;
      }
      const result = await register(formData.name, formData.email, formData.password);
      if (result.success) {
        setIsLoginOpen(false);
      } else {
        setError(result.message);
      }
    }
  };

  const quickFill = (role) => {
    if (role === "admin") {
      setFormData({
        name: "",
        email: "admin@glowskin.com",
        password: "admin123",
      });
      setActiveTab("login");
    } else {
      setFormData({
        name: "",
        email: "user@glowskin.com",
        password: "user123",
      });
      setActiveTab("login");
    }
  };

  return (
    <div className="login-modal-overlay" onClick={() => setIsLoginOpen(false)}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="login-modal-close-btn"
          onClick={() => setIsLoginOpen(false)}
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="login-modal-header">
          <div className="login-modal-logo">
            <Logo />
          </div>
          <h2>GlowSkin AI</h2>
          <p>Phân tích làn da & Đề xuất mỹ phẩm thông minh</p>
        </div>

        <form className="login-modal-form" onSubmit={handleSubmit}>
          {error && <div className="login-modal-error">{error}</div>}

          {activeTab === "register" && (
            <div className="modal-form-group">
              <label htmlFor="modal-reg-name">Họ và tên</label>
              <input
                id="modal-reg-name"
                type="text"
                name="name"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <div className="modal-form-group">
            <label htmlFor="modal-email">Email của bạn</label>
            <input
              id="modal-email"
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="modal-form-group">
            <label htmlFor="modal-password">Mật khẩu</label>
            <input
              id="modal-password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" className="login-modal-submit-btn">
            {activeTab === "login" ? "Đăng Nhập" : "Tạo Tài Khoản"}
          </button>

          <div className="login-modal-toggle">
            {activeTab === "login" ? (
              <p>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className="login-modal-toggle-btn"
                  onClick={() => handleTabChange("register")}
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  className="login-modal-toggle-btn"
                  onClick={() => handleTabChange("login")}
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Quick Demo Credentials Helper */}
        <div className="login-modal-quick-demo">
          <h3>Đăng nhập nhanh để test:</h3>
          <div className="login-modal-quick-grid">
            <button
              type="button"
              className="login-modal-quick-btn"
              onClick={() => quickFill("admin")}
            >
              <strong>Admin</strong>
              admin@glowskin.com
            </button>
            <button
              type="button"
              className="login-modal-quick-btn"
              onClick={() => quickFill("user")}
            >
              <strong>Khách</strong>
              user@glowskin.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
