import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import "./UpgradeModal.css";

export default function UpgradeModal() {
  const {
    currentUser,
    isUpgradeModalOpen,
    closeUpgradeModal,
    upgradeModalPlan,
    setIsLoginOpen,
  } = useApp();

  const [selectedPlan, setSelectedPlan] = useState(upgradeModalPlan || "Premium");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync selected plan when modal opens
  React.useEffect(() => {
    if (upgradeModalPlan) {
      setSelectedPlan(upgradeModalPlan);
    }
  }, [upgradeModalPlan, isUpgradeModalOpen]);

  if (!isUpgradeModalOpen) return null;

  const PLANS = {
    Premium: {
      name: "Premium",
      badge: "Khuyên Dùng",
      price: "99.000đ",
      period: "/ tháng",
      amount: 99000,
      membershipCode: "Premium",
      features: [
        "Quét da AI chuyên sâu không giới hạn số lần",
        "Báo cáo toàn diện 6 chỉ số da liễu chuẩn khoa học",
        "Đánh giá độ nhạy cảm & chẩn đoán loại da chuẩn xác",
        "Gợi ý thành phần mỹ phẩm & chu trình skincare tối ưu",
        "Lưu lịch sử & theo dõi tiến trình hồi phục da 28 ngày",
        "Mở khóa toàn bộ bài kiểm tra & phân tích chuyên sâu",
      ],
    },
    Professional: {
      name: "Professional",
      badge: "Chuyên Nghiệp",
      price: "249.000đ",
      period: "/ tháng",
      amount: 249000,
      membershipCode: "VIP",
      features: [
        "Đầy đủ toàn bộ quyền lợi cao cấp của gói Premium",
        "Xuất báo cáo phân tích chuyên sâu định dạng PDF chuẩn hồ sơ",
        "Kết nối tư vấn 1-1 trực tiếp với Bác sĩ Da Liễu chuyên khoa",
        "Công cụ quản lý hồ sơ da cho khách hàng & người thân",
        "Ưu tiên hỗ trợ riêng từ đội ngũ chuyên gia da liễu 24/7",
      ],
    },
  };

  const currentPlanData = PLANS[selectedPlan] || PLANS.Premium;

  const handlePayOSPayment = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/payments/create-membership-payos-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentPlanData.amount,
          userId: currentUser.id || currentUser._id,
          membership: currentPlanData.membershipCode,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể tạo liên kết thanh toán từ máy chủ");
      }

      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Không nhận được liên kết thanh toán từ PayOS");
      }
    } catch (err) {
      console.error("Lỗi khởi tạo thanh toán:", err);
      setErrorMessage(err.message || "Lỗi kết nối cổng thanh toán. Vui lòng thử lại!");
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!currentUser) {
      closeUpgradeModal();
      setIsLoginOpen(true);
      return;
    }
    handlePayOSPayment();
  };

  const isCurrentMembership =
    currentUser &&
    (currentUser.membership === currentPlanData.membershipCode ||
      (currentPlanData.membershipCode === "Premium" && currentUser.membership === "VIP"));

  return (
    <div className="upgrade-modal-backdrop" onClick={closeUpgradeModal}>
      <div className="upgrade-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng */}
        <button
          type="button"
          className="upgrade-modal-close"
          onClick={closeUpgradeModal}
          aria-label="Đóng"
        >
          ✕
        </button>

        {/* Header */}
        <div className="upgrade-modal-header">
          <div className="upgrade-badge-pill">
            <span className="sparkle">✦</span> HỘI VIÊN CAO CẤP GLOWSKIN
          </div>
          <h2 className="upgrade-modal-title">Nâng Cấp Gói Tài Khoản</h2>
          <p className="upgrade-modal-desc">
            Trải nghiệm trọn vẹn công nghệ AI phân tích da chuẩn da liễu & thiết lập chu trình phục hồi làn da hoàn hảo.
          </p>
        </div>

        {/* Tab chuyển đổi gói */}
        <div className="upgrade-plan-tabs">
          <button
            type="button"
            className={`upgrade-plan-tab ${selectedPlan === "Premium" ? "active" : ""}`}
            onClick={() => setSelectedPlan("Premium")}
          >
            <div className="tab-tag">Khuyên dùng</div>
            <div className="tab-name">Premium</div>
            <div className="tab-price">99.000đ<span>/tháng</span></div>
          </button>

          <button
            type="button"
            className={`upgrade-plan-tab ${selectedPlan === "Professional" ? "active" : ""}`}
            onClick={() => setSelectedPlan("Professional")}
          >
            <div className="tab-tag pro">Chuyên nghiệp</div>
            <div className="tab-name">Professional</div>
            <div className="tab-price">249.000đ<span>/tháng</span></div>
          </button>
        </div>

        {/* Nội dung chi tiết gói được chọn */}
        <div className="upgrade-plan-details">
          <div className="details-header">
            <div>
              <span className="details-badge">{currentPlanData.badge}</span>
              <h3 className="details-title">Gói {currentPlanData.name}</h3>
            </div>
            <div className="details-price-wrap">
              <span className="details-price">{currentPlanData.price}</span>
              <span className="details-period">{currentPlanData.period}</span>
            </div>
          </div>

          <div className="upgrade-features-list">
            <h4 className="features-headline">Quyền lợi dành riêng cho bạn:</h4>
            <ul>
              {currentPlanData.features.map((item, index) => (
                <li key={index}>
                  <span className="check-icon">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Thông tin tài khoản & Phương thức thanh toán */}
        {currentUser ? (
          <div className="upgrade-account-info">
            <div className="account-row">
              <span className="account-label">Tài khoản nâng cấp:</span>
              <span className="account-value">
                {currentUser.name || currentUser.preferredName || "Khách hàng"} ({currentUser.email || "Đã đăng nhập"})
              </span>
            </div>
            <div className="account-row">
              <span className="account-label">Hạng hiện tại:</span>
              <span className={`membership-pill ${currentUser.membership?.toLowerCase() || "free"}`}>
                {currentUser.membership || "Free"}
              </span>
            </div>

            {/* Phương thức thanh toán PayOS */}
            <div className="upgrade-payment-summary">
              <div className="payment-summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div className="payment-summary-info">
                <div className="summary-title">Thanh toán an toàn qua PayOS (VietQR)</div>
                <div className="summary-sub">Quét mã QR từ mọi ứng dụng ngân hàng hoặc ví điện tử để kích hoạt tức thì</div>
              </div>
              <span className="vietqr-pill">VietQR</span>
            </div>
          </div>
        ) : (
          <div className="upgrade-not-logged-in-alert">
            <div className="alert-icon">💡</div>
            <div className="alert-content">
              <strong>Bạn chưa đăng nhập!</strong>
              <p>Vui lòng đăng nhập tài khoản để gói hội viên được gắn liền với hồ sơ da và nhật ký của bạn.</p>
            </div>
          </div>
        )}

        {/* Thông báo lỗi */}
        {errorMessage && <div className="upgrade-alert error">{errorMessage}</div>}

        {/* Footer actions */}
        <div className="upgrade-modal-actions">
          {currentUser ? (
            isCurrentMembership ? (
              <button type="button" className="upgrade-btn-submit disabled" disabled>
                ✓ Bạn đang sử dụng gói này ({currentUser.membership})
              </button>
            ) : (
              <button
                type="button"
                className="upgrade-btn-submit"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner-wrap">Đang khởi tạo thanh toán PayOS...</span>
                ) : (
                  `Thanh toán ${currentPlanData.price} qua PayOS`
                )}
              </button>
            )
          ) : (
            <button
              type="button"
              className="upgrade-btn-submit"
              onClick={() => {
                closeUpgradeModal();
                setIsLoginOpen(true);
              }}
            >
              Đăng nhập để nâng cấp ngay
            </button>
          )}

          <p className="upgrade-guarantee-note">
            🔒 Cam kết bảo mật thông tin & Hỗ trợ kỹ thuật 24/7 từ GlowSkin.
          </p>
        </div>
      </div>
    </div>
  );
}
