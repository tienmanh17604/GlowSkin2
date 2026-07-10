import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import Logo from "../components/Logo";
import CartButton from "../components/CartButton";
import Footer from "../components/Footer";
import "./Contact.css";

export default function Contact() {
  const { currentUser, logout, setIsLoginOpen, wishlist } = useApp();
  const { setIsCartOpen } = useCart();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus(null);
    
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    
    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubmitStatus({
          type: "success",
          text: data.message || "Gửi liên hệ thành công! Chúng tôi sẽ liên hệ lại sớm nhất."
        });
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          subject: "",
          message: ""
        });
      } else {
        setSubmitStatus({
          type: "error",
          text: data.message || "Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau."
        });
      }
    } catch (error) {
      console.error("Lỗi gửi liên hệ:", error);
      setSubmitStatus({
        type: "error",
        text: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau hoặc gọi Hotline trực tiếp."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const wishlistCount = Object.values(wishlist || {}).filter(Boolean).length;

  return (
    <div className="contact-page-wrapper">
      {/* Header / Top Navigation Bar */}
      <header className="contact-header">
        <Logo />
        <div className="contact-header-actions">
          <Link to="/products" className="contact-nav-link">
            Sản phẩm
          </Link>
          <Link to="/analyze" className="contact-nav-link contact-nav-link--accent">
            Phân tích da AI →
          </Link>
          <Link to="/" className="contact-nav-link contact-nav-link--muted">
            ← Về trang chủ
          </Link>

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
                <Link to="/admin" className="nav-admin-link">⚙️ Quản lý</Link>
              )}
              <button type="button" className="nav-logout-btn" onClick={logout}>Đăng xuất</button>
            </div>
          )}

          <button
            type="button"
            className="nav-wishlist-btn"
            aria-label="Yêu thích"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="wishlist-badge">{wishlistCount}</span>
            )}
          </button>

          <CartButton />
        </div>
      </header>

      {/* Main Page Area */}
      <main className="contact-main">
        {/* Contact Header text */}
        <div className="contact-hero">
          <div className="contact-tag-wrapper">
            <span className="contact-tag">💬 LIÊN HỆ</span>
          </div>
          <h1>Kết Nối Với GlowSkin</h1>
          <p>
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng gửi tin nhắn hoặc gọi điện trực tiếp cho chúng tôi. Đội ngũ GlowSkin luôn túc trực hỗ trợ bạn.
          </p>
        </div>

        {/* 2-Column Contact Info and Form Box */}
        <div className="contact-content-container">
          {/* Left Columns - Address, phone, email info cards */}
          <div className="contact-info-cards">
            <div className="info-card">
              <div className="info-card-icon-wrap">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="info-card-content">
                <h3>HOTLINE HỖ TRỢ</h3>
                <p className="info-highlight">0899821764</p>
                <p className="info-sub">Hỗ trợ kỹ thuật & đặt mua (8:00 - 22:00 hàng ngày)</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon-wrap">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="info-card-content">
                <h3>EMAIL LIÊN HỆ</h3>
                <p className="info-highlight email-highlight">tienmanhworkcontact@gmail.com</p>
                <p className="info-sub">Phản hồi thông tin & đề xuất hợp tác doanh nghiệp</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon-wrap">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="info-card-content">
                <h3>VĂN PHÒNG ĐẠI DIỆN</h3>
                <p className="info-highlight">Tòa nhà GlowSkin, Khu Công Nghệ Cao<br />Hòa Lạc, Thạch Thất, Hà Nội</p>
                <p className="info-sub">Trụ sở nghiên cứu & phát triển sản phẩm</p>
              </div>
            </div>
          </div>

          {/* Right Column - Contact message submission form */}
          <div className="contact-form-card">
            <h3>Gửi Tin Nhắn Cho GlowSkin</h3>
            <form onSubmit={handleContactSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>HỌ VÀ TÊN <span className="required-star">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>ĐỊA CHỈ EMAIL <span className="required-star">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>SỐ ĐIỆN THOẠI</label>
                  <input
                    type="tel"
                    placeholder="09xx xxx xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>CHỦ ĐỀ <span className="required-star">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Yêu cầu hỗ trợ kỹ thuật..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>LỜI NHẮN CHI TIẾT <span className="required-star">*</span></label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nhập nội dung thắc mắc của bạn..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button type="submit" className="contact-submit-btn" disabled={submitting}>
                {submitting ? "Đang gửi..." : "Gửi Liên Hệ"} 
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "8px" }}>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>

              {submitStatus && (
                <div className={`contact-status-msg contact-status-msg--${submitStatus.type}`}>
                  {submitStatus.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
