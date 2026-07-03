import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import "./LoginRegister.css";

export default function LoginRegister() {
  const navigate = useNavigate();
  const { login, register } = useApp();

  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

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
        if (result.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
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
        navigate("/");
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
    <div className="login-page">
      <div className="login-bg-circle login-bg-circle--1"></div>
      <div className="login-bg-circle login-bg-circle--2"></div>

      <div className="login-card-container">
        <Link to="/" className="login-back-home">
          ← Về trang chủ
        </Link>

        <div className="login-card">
          <div className="login-header">
            <div className="login-header-logo">
              <Logo />
            </div>
            <h1>GlowSkin AI</h1>
            <p>Phân tích làn da & Đề xuất mỹ phẩm thông minh</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error-alert">{error}</div>}

            {activeTab === "register" && (
              <div className="form-group">
                <label htmlFor="reg-name">Họ và tên</label>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="login-email">Email của bạn</label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Mật khẩu</label>
              <input
                id="login-password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="login-btn">
              {activeTab === "login" ? "Đăng Nhập" : "Tạo Tài Khoản"}
            </button>

            <div className="login-toggle-mode">
              {activeTab === "login" ? (
                <p>
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    className="login-toggle-btn"
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
                    className="login-toggle-btn"
                    onClick={() => handleTabChange("login")}
                  >
                    Đăng nhập
                  </button>
                </p>
              )}
            </div>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="login-quick-demo">
            <h3>Đăng nhập nhanh để test thử:</h3>
            <div className="login-quick-grid">
              <button
                type="button"
                className="login-quick-btn"
                onClick={() => quickFill("admin")}
              >
                <strong>Tài khoản Admin</strong>
                Role: Administrator
              </button>
              <button
                type="button"
                className="login-quick-btn"
                onClick={() => quickFill("user")}
              >
                <strong>Tài khoản Khách</strong>
                Role: Member (Free)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
