import { Link } from "react-router-dom";
import Logo from "./Logo";
import "./Footer.css";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="main-footer">
      <div className="footer-top">
        <div className="footer-brand-section">
          <div className="footer-logo-wrapper">
            <Logo className="footer-logo" />
            <span className="footer-brand-name">GlowSkin</span>
          </div>
          <p className="footer-brand-desc">
            Phân tích làn da thông minh bằng công nghệ AI, kiến tạo chu trình skincare cá nhân hóa và đồng hành cùng hành trình tìm lại vẻ đẹp tự nhiên của bạn.
          </p>
          <div className="footer-social-icons">
            <a 
              href="https://www.facebook.com/profile.php?id=61594571464006" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon-link" 
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-links-grid">
          <div className="footer-links-col">
            <h4>TÍNH NĂNG</h4>
            <ul>
              <li><Link to="/analyze" onClick={scrollToTop}>Phân tích da AI</Link></li>
              <li><Link to="/analyze" onClick={scrollToTop}>Routine cá nhân</Link></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>PHÁP LÝ</h4>
            <ul>
              <li><a href="#privacy">Chính sách bảo mật</a></li>
              <li><a href="#terms">Điều khoản dịch vụ</a></li>
              <li><a href="#refund">Chính sách hoàn tiền</a></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>HỖ TRỢ</h4>
            <ul>
              <li><a href="#help">Trung tâm hỗ trợ</a></li>
              <li><a href="#tutorial">Video hướng dẫn</a></li>
              <li><a href="#faqs">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>CÔNG TY</h4>
            <ul>
              <li><a href="#about">Về chúng tôi</a></li>
              <li><Link to="/contact" onClick={scrollToTop}>Liên hệ</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom-divider"></div>

      <div className="footer-bottom">
        <p className="footer-copy">
          &copy; 2026 GlowSkin. Bảo lưu mọi quyền. Được tạo với <span className="heart-icon">❤</span> cho làn da rạng rỡ.
        </p>
        <div className="footer-bottom-links">
          <a href="#privacy">Bảo mật</a>
          <a href="#terms">Điều khoản</a>
          <a href="#cookies">Cookie</a>
        </div>
      </div>
    </footer>
  );
}
