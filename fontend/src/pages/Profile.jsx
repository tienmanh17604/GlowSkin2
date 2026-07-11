import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import Logo from "../components/Logo";
import CartButton from "../components/CartButton";
import UserMenu from "../components/UserMenu";
import "./Profile.css";

export default function Profile() {
  const { currentUser, orders, updateProfile, wishlist } = useApp();
  const { setIsCartOpen } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get active tab from URL query search params, default to "account"
  const activeTab = searchParams.get("tab") || "account";

  // Redirect to home if user is not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Form states for account tab
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // Address form states
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressText, setNewAddressText] = useState("");

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    const currentAddresses = currentUser.addresses || [];
    const updated = [...currentAddresses, newAddressText.trim()];
    const res = await updateProfile(currentUser.id, currentUser.name, currentUser.email, currentUser.phone, updated);
    if (res.success) {
      setNewAddressText("");
      setShowAddAddressForm(false);
    } else {
      alert("Lỗi khi thêm địa chỉ!");
    }
  };

  const handleDeleteAddress = async (addrToDelete) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    const currentAddresses = currentUser.addresses || [];
    const updated = currentAddresses.filter((a) => a !== addrToDelete);
    await updateProfile(currentUser.id, currentUser.name, currentUser.email, currentUser.phone, updated);
  };

  // Set form details when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      const names = currentUser.name.trim().split(" ");
      const first = names[0] || "";
      const last = names.slice(1).join(" ") || "";
      setFirstName(first);
      setLastName(last);
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
    }
  }, [currentUser]);

  // Orders sub-tab filter (Tất cả, Chờ xác nhận, Đang chuẩn bị đơn hàng, Đang giao hàng, Đã giao hàng, Đã hủy)
  const [orderSubTab, setOrderSubTab] = useState("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  if (!currentUser) return null;

  // Handle saving profile info
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setSaveStatus({ type: "error", text: "Vui lòng nhập họ và tên đầy đủ!" });
      setSaving(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setSaveStatus({ type: "error", text: "Địa chỉ email không hợp lệ!" });
      setSaving(false);
      return;
    }

    if (phone.trim()) {
      const phoneRegex = /^(0|\+84|84)?(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(phone.trim().replace(/\s+/g, ""))) {
        setSaveStatus({ type: "error", text: "Số điện thoại không hợp lệ!" });
        setSaving(false);
        return;
      }
    }

    const result = await updateProfile(currentUser.id, fullName, email.trim(), phone.trim());
    if (result.success) {
      setSaveStatus({ type: "success", text: "Cập nhật thông tin thành công!" });
    } else {
      setSaveStatus({ type: "error", text: result.message || "Có lỗi xảy ra khi cập nhật." });
    }
    setSaving(false);
  };

  // Filter user orders
  const myOrders = (orders || []).filter(
    (order) =>
      order.customerName &&
      order.customerName.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
  );

  // Filter orders by sub-tab and search query
  const filteredOrders = myOrders.filter((order) => {
    // 1. Status Filter
    if (orderSubTab === "pending" && order.status !== "Chờ xử lý" && order.status !== "Chờ xác nhận") return false;
    if (orderSubTab === "preparing" && order.status !== "Đang chuẩn bị" && order.status !== "Đang chuẩn bị đơn hàng") return false;
    if (orderSubTab === "shipping" && order.status !== "Đang giao hàng") return false;
    if (orderSubTab === "delivered" && order.status !== "Đã giao hàng") return false;
    if (orderSubTab === "cancelled" && order.status !== "Đã hủy") return false;

    // 2. Search Filter
    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(query);
      const matchItem = order.items && order.items.some(item => item.name.toLowerCase().includes(query));
      return matchId || matchItem;
    }

    return true;
  });

  const changeTab = (tabName) => {
    setSearchParams({ tab: tabName });
    setSaveStatus(null);
  };

  return (
    <div className="profile-page-wrapper">
      {/* Header section with UserMenu on the far right */}
      <header className="profile-header">
        <Logo />
        <div className="profile-header-actions">
          <Link to="/products" className="profile-nav-link">
            Sản phẩm
          </Link>
          <Link to="/analyze" className="profile-nav-link profile-nav-link--accent">
            Phân tích da AI →
          </Link>
          <Link to="/" className="profile-nav-link profile-nav-link--muted">
            ← Về trang chủ
          </Link>

          <button
            type="button"
            className="nav-wishlist-btn"
            aria-label="Yêu thích"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlist && wishlist.length > 0 && (
              <span className="wishlist-badge">{wishlist.length}</span>
            )}
          </button>

          <CartButton />

          {/* UserMenu is the last item on the absolute far right */}
          <UserMenu />
        </div>
      </header>

      <main className="profile-main-container">
        <div className="profile-layout-grid">
          
          {/* Left Column: User Card & Navigation */}
          <aside className="profile-sidebar">
            <div className="profile-user-card">
              {/* Avatar Outline Circle & Username */}
              <div className="profile-card-header">
                <div className="profile-card-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="profile-card-username">{currentUser.name.toUpperCase()}</h3>
              </div>

              {/* Barcode section */}
              <div className="profile-card-barcode-section">
                <div className="profile-barcode-graphic">
                  <svg viewBox="0 0 100 24" preserveAspectRatio="none">
                    <rect x="2" width="2" height="24" fill="black" />
                    <rect x="6" width="1" height="24" fill="black" />
                    <rect x="9" width="3" height="24" fill="black" />
                    <rect x="14" width="1" height="24" fill="black" />
                    <rect x="17" width="2" height="24" fill="black" />
                    <rect x="21" width="4" height="24" fill="black" />
                    <rect x="27" width="1" height="24" fill="black" />
                    <rect x="30" width="3" height="24" fill="black" />
                    <rect x="35" width="2" height="24" fill="black" />
                    <rect x="39" width="1" height="24" fill="black" />
                    <rect x="42" width="4" height="24" fill="black" />
                    <rect x="48" width="2" height="24" fill="black" />
                    <rect x="52" width="1" height="24" fill="black" />
                    <rect x="55" width="3" height="24" fill="black" />
                    <rect x="60" width="2" height="24" fill="black" />
                    <rect x="64" width="1" height="24" fill="black" />
                    <rect x="67" width="4" height="24" fill="black" />
                    <rect x="73" width="2" height="24" fill="black" />
                    <rect x="77" width="1" height="24" fill="black" />
                    <rect x="80" width="3" height="24" fill="black" />
                    <rect x="85" width="2" height="24" fill="black" />
                    <rect x="89" width="1" height="24" fill="black" />
                    <rect x="92" width="4" height="24" fill="black" />
                    <rect x="98" width="1" height="24" fill="black" />
                  </svg>
                </div>
                <div className="profile-barcode-labels">
                  <span>SĐT tích điểm</span>
                  <strong>{currentUser.phone || "84962758923"}</strong>
                </div>
              </div>

              {/* Membership Loyalty Card */}
              <div className={`profile-card-loyalty-pass ${currentUser.membership.toLowerCase()}`}>
                <div className="loyalty-header">
                  <span>{currentUser.membership.toUpperCase()}</span>
                  <span>0 HSVPoint</span>
                </div>
                <div className="loyalty-progress-wrap">
                  <div className="loyalty-progress-track">
                    <div className="loyalty-progress-fill" style={{ width: "20%" }}></div>
                    <div className="loyalty-progress-crown">👑</div>
                  </div>
                </div>
                <p className="loyalty-subtext">
                  Nhận thêm 100 điểm nữa để nâng hạng lên SILVER
                </p>
                <div className="loyalty-footer-link">
                  <span>Xem tất cả quyền lợi</span>
                  <span className="arrow-btn">&gt;</span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Options */}
            <nav className="profile-sidebar-nav">
              <button
                type="button"
                className={`profile-nav-item ${activeTab === "account" ? "active" : ""}`}
                onClick={() => changeTab("account")}
              >
                Tài khoản
              </button>
              <button
                type="button"
                className={`profile-nav-item ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => changeTab("orders")}
              >
                Đơn hàng
              </button>
              <button
                type="button"
                className={`profile-nav-item ${activeTab === "address" ? "active" : ""}`}
                onClick={() => changeTab("address")}
              >
                Địa chỉ giao nhận
              </button>
              <button
                type="button"
                className={`profile-nav-item ${activeTab === "rewards" ? "active" : ""}`}
                onClick={() => changeTab("rewards")}
              >
                Ưu đãi của tôi
              </button>
              <button
                type="button"
                className={`profile-nav-item ${activeTab === "qna" ? "active" : ""}`}
                onClick={() => changeTab("qna")}
              >
                Câu hỏi của tôi
              </button>
              <button
                type="button"
                className={`profile-nav-item ${activeTab === "events" ? "active" : ""}`}
                onClick={() => changeTab("events")}
              >
                Sự kiện của tôi
              </button>
            </nav>
          </aside>

          {/* Right Column: Dynamic Content Panel */}
          <section className="profile-content-panel">
            
            {/* 1. Account Info Tab */}
            {activeTab === "account" && (
              <div className="profile-tab-content">
                <div className="profile-breadcrumb">
                  <span>Trang chủ</span> &gt; <span>Tài khoản</span>
                </div>
                
                <h2 className="profile-panel-title">Tài khoản</h2>

                <form className="profile-details-form" onSubmit={handleSaveProfile}>
                  <div className="profile-form-grid">
                    <div className="profile-input-group">
                      <label>Tên *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        placeholder="Nhập tên"
                      />
                    </div>
                    <div className="profile-input-group">
                      <label>Họ *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        placeholder="Nhập họ và tên đệm"
                      />
                    </div>
                    <div className="profile-input-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="profile-input-group">
                      <label>Số điện thoại *</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="+84..."
                      />
                    </div>
                  </div>

                  {saveStatus && (
                    <div className={`profile-status-message profile-status-message--${saveStatus.type}`}>
                      {saveStatus.text}
                    </div>
                  )}

                  <div className="profile-form-actions">
                    <button
                      type="submit"
                      className="profile-save-btn"
                      disabled={saving}
                    >
                      {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. Order History Tab */}
            {activeTab === "orders" && (
              <div className="profile-tab-content">
                <div className="profile-breadcrumb">
                  <span>Trang chủ</span> &gt; <span>Đơn hàng</span>
                </div>
                
                <h2 className="profile-panel-title">Đơn hàng</h2>

                {/* Sub-tabs mapping categories */}
                <div className="profile-orders-tabs">
                  <button
                    type="button"
                    className={`orders-tab-btn ${orderSubTab === "all" ? "active" : ""}`}
                    onClick={() => setOrderSubTab("all")}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    className={`orders-tab-btn ${orderSubTab === "pending" ? "active" : ""}`}
                    onClick={() => setOrderSubTab("pending")}
                  >
                    Chờ xác nhận
                  </button>
                  <button
                    type="button"
                    className={`orders-tab-btn ${orderSubTab === "preparing" ? "active" : ""}`}
                    onClick={() => setOrderSubTab("preparing")}
                  >
                    Đang chuẩn bị đơn hàng
                  </button>
                  <button
                    type="button"
                    className={`orders-tab-btn ${orderSubTab === "shipping" ? "active" : ""}`}
                    onClick={() => setOrderSubTab("shipping")}
                  >
                    Đang giao hàng
                  </button>
                  <button
                    type="button"
                    className={`orders-tab-btn ${orderSubTab === "delivered" ? "active" : ""}`}
                    onClick={() => setOrderSubTab("delivered")}
                  >
                    Đã giao hàng
                  </button>
                  <button
                    type="button"
                    className={`orders-tab-btn ${orderSubTab === "cancelled" ? "active" : ""}`}
                    onClick={() => setOrderSubTab("cancelled")}
                  >
                    Đã hủy
                  </button>
                </div>

                {/* Search query */}
                <div className="orders-search-wrapper">
                  <div className="orders-search-bar">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Tìm kiếm"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Orders Content */}
                {filteredOrders.length === 0 ? (
                  <div className="orders-empty-state">
                    <div className="empty-state-icon-wrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z" />
                        <line x1="12" y1="10" x2="12" y2="16" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                      </svg>
                    </div>
                    <span className="empty-state-text">No Data</span>
                  </div>
                ) : (
                  <div className="orders-list-wrapper">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="profile-order-record-card">
                        <div className="order-record-header">
                          <div>
                            <strong>Mã Đơn Hàng: #{order.id.substring(0, 10).toUpperCase()}</strong>
                            <span className="order-record-date">{order.date}</span>
                          </div>
                          <span className={`order-record-status ${order.status.toLowerCase().replace(/\s/g, "-")}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="order-record-items">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="order-record-item-row">
                              <span className="item-name">{item.name}</span>
                              <span className="item-brand">{item.brand}</span>
                              <span className="item-qty">x{item.quantity}</span>
                              <span className="item-price">
                                {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="order-record-footer">
                          <span>Địa chỉ giao nhận: <small>{order.address}</small></span>
                          <div className="order-record-total-row">
                            <span>Tổng thanh toán:</span>
                            <strong className="order-record-total">
                              {order.totalPrice.toLocaleString("vi-VN")} đ
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Shipping Address Management Tab */}
            {activeTab === "address" && (
              <div className="profile-tab-content">
                <div className="profile-breadcrumb">
                  <span>Trang chủ</span> &gt; <span>Địa chỉ giao nhận</span>
                </div>
                
                <div className="profile-addresses-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h2 className="profile-panel-title" style={{ margin: 0 }}>Địa chỉ giao nhận</h2>
                  <button 
                    type="button" 
                    className="profile-save-btn"
                    style={{ padding: "8px 24px", fontSize: "12.5px" }}
                    onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                  >
                    {showAddAddressForm ? "Hủy bỏ" : "+ Thêm địa chỉ"}
                  </button>
                </div>

                {showAddAddressForm && (
                  <form className="add-address-form" onSubmit={handleAddNewAddress} style={{ background: "#faf9f6", padding: "20px", borderRadius: "12px", border: "1px solid #f1eee9", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="profile-input-group">
                      <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Nhập địa chỉ giao nhận mới</label>
                      <input
                        type="text"
                        required
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                        value={newAddressText}
                        onChange={(e) => setNewAddressText(e.target.value)}
                        style={{ padding: "12px", border: "1px solid #e1deda", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="submit" className="profile-save-btn" style={{ padding: "10px 30px", fontSize: "13px" }}>Lưu địa chỉ</button>
                    </div>
                  </form>
                )}

                {(!currentUser.addresses || currentUser.addresses.length === 0) ? (
                  <div className="orders-empty-state">
                    <div className="empty-state-icon-wrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                    </div>
                    <span className="empty-state-text">Chưa lưu địa chỉ giao nhận nào</span>
                  </div>
                ) : (
                  <div className="profile-addresses-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {currentUser.addresses.map((addr, idx) => (
                      <div key={idx} className="profile-address-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#ffffff", border: "1px solid #f1eeeb", borderRadius: "12px", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "20px" }}>🏠</span>
                          <span style={{ fontSize: "13.5px", color: "#111111", fontWeight: "600", textAlign: "left" }}>{addr}</span>
                        </div>
                        <button
                          type="button"
                          style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", padding: "4px" }}
                          aria-label="Xóa địa chỉ"
                          onClick={() => handleDeleteAddress(addr)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Placeholder Tabs (Rewards, QnA, Events) */}
            {activeTab !== "account" && activeTab !== "orders" && activeTab !== "address" && (
              <div className="profile-tab-content">
                <div className="profile-breadcrumb">
                  <span>Trang chủ</span> &gt; <span>Tài khoản</span>
                </div>
                
                <h2 className="profile-panel-title">
                  {activeTab === "rewards" && "Ưu đãi của tôi"}
                  {activeTab === "qna" && "Câu hỏi của tôi"}
                  {activeTab === "events" && "Sự kiện của tôi"}
                </h2>

                <div className="orders-empty-state">
                  <div className="empty-state-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <span className="empty-state-text">Chưa có dữ liệu nào ở mục này</span>
                </div>
              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
}
