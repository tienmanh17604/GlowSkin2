import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useApp } from "../context/AppContext";
import { formatPrice } from "../data/products";
import "./CartDrawer.css";

export default function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const { placeOrder, products, orders, currentUser } = useApp();

  const displayOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(o => o.customerName === currentUser.name);
  }, [orders, currentUser]);

  const [activeTab, setActiveTab] = useState("delivery"); // "delivery" | "orders"
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "cod",
  });

  const [selectedAddressType, setSelectedAddressType] = useState("");

  // Prefill details and address selection when entering checkout
  useEffect(() => {
    if (isCheckingOut && currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name || prev.name,
        phone: currentUser.phone || prev.phone,
      }));

      if (currentUser.addresses && currentUser.addresses.length > 0) {
        setSelectedAddressType(currentUser.addresses[0]);
        setFormData((prev) => ({ ...prev, address: currentUser.addresses[0] }));
      } else {
        setSelectedAddressType("new");
      }
    }
  }, [isCheckingOut, currentUser]);

  // Online Payment Simulation States
  const [isPayingOnline, setIsPayingOnline] = useState(false);
  const [payTimer, setPayTimer] = useState(300);

  useEffect(() => {
    let timer;
    if (isPayingOnline && payTimer > 0) {
      timer = setInterval(() => {
        setPayTimer((prev) => prev - 1);
      }, 1000);
    } else if (payTimer === 0 && isPayingOnline) {
      setIsPayingOnline(false);
      alert("Giao dịch thanh toán đã hết hạn! Vui lòng thử lại.");
    }
    return () => clearInterval(timer);
  }, [isPayingOnline, payTimer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Sync selected item IDs when cart items change
  useEffect(() => {
    // Keep items that are still in the cart, add new items by default
    setSelectedItemIds((prev) => {
      const currentIds = items.map((i) => i.id);
      const stillValid = prev.filter((id) => currentIds.includes(id));
      const brandNew = currentIds.filter((id) => !prev.includes(id));
      return [...stillValid, ...brandNew];
    });
  }, [items]);

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  // Calculate selected total
  const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItemIds(items.map((item) => item.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSelectItem = (id, checked) => {
    if (checked) {
      setSelectedItemIds((prev) => [...prev, id]);
    } else {
      setSelectedItemIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }
    
    if (formData.payment === "payos" || formData.payment === "vnpay") {
      const tempOrderCode = "GS" + Math.floor(100000 + Math.random() * 900000);
      const checkoutPayload = {
        formData,
        selectedItems,
        selectedTotal,
        tempOrderCode
      };
      // Save state to localStorage to recover after redirect
      localStorage.setItem("glowskin_pending_checkout", JSON.stringify(checkoutPayload));

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const endpoint = formData.payment === "payos" 
        ? "/payments/create-payos-url" 
        : "/payments/create-vnpay-url";

      fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedTotal, orderId: tempOrderCode }),
      })
      .then((res) => {
        if (!res.ok) throw new Error("Thanh toán lỗi");
        return res.json();
      })
      .then((data) => {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          alert("Lỗi tạo liên kết thanh toán từ Gateway!");
        }
      })
      .catch((err) => {
        alert("Lỗi kết nối cổng thanh toán! Vui lòng thử lại.");
      });
    } else {
      // Place order for selected items
      const code = placeOrder(formData, selectedItems, selectedTotal);
      setOrderCode(code);
      setIsSuccess(true);

      // Remove ordered items from cart
      selectedItems.forEach((item) => removeFromCart(item.id));
      setIsCheckingOut(false);
    }
  };

  const handleCloseSuccess = () => {
    setIsSuccess(false);
    setIsCartOpen(false);
    setFormData({ name: "", phone: "", address: "", payment: "cod" });
  };

  // Helper to check stock status from AppContext products
  const checkStock = (productId) => {
    const p = products.find((prod) => prod.id === productId);
    return p ? p.stock : 50; // default to 50 if not found
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div
        className="cart-drawer-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="cart-drawer-header">
          <h2>Giỏ hàng của tôi</h2>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={() => setIsCartOpen(false)}
            aria-label="Đóng"
          >
            ✕
          </button>
        </header>

        {isSuccess ? (
          /* Order Success Panel */
          <div className="cart-drawer-success">
            <div className="success-icon-wrap">
              <div className="success-icon">✓</div>
            </div>
            <h2>Đặt hàng thành công!</h2>
            <p>
              Cảm ơn bạn đã lựa chọn GlowSkin. Đơn hàng của bạn đang được chuẩn bị.
            </p>
            <div className="order-code-box">
              Mã đơn hàng: <strong>#{orderCode}</strong>
            </div>
            <div className="success-actions">
              <button
                type="button"
                className="drawer-btn drawer-btn--primary"
                onClick={handleCloseSuccess}
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        ) : isCheckingOut ? (
          /* Checkout Form Panel */
          <div className="cart-drawer-checkout">
            <header className="checkout-sub-header">
              <button
                type="button"
                className="checkout-back-btn"
                onClick={() => setIsCheckingOut(false)}
              >
                ← Quay lại giỏ hàng
              </button>
              <h3>Thông tin thanh toán</h3>
            </header>

            <form className="checkout-drawer-form" onSubmit={handleCheckoutSubmit}>
              <div className="checkout-summary-mini">
                <span>Tổng thanh toán ({selectedItems.length} sản phẩm):</span>
                <strong>{formatPrice(selectedTotal)}</strong>
              </div>

              <div className="drawer-form-group">
                <label htmlFor="drawer-name">Họ và tên người nhận</label>
                <input
                  id="drawer-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="drawer-form-group">
                <label htmlFor="drawer-phone">Số điện thoại</label>
                <input
                  id="drawer-phone"
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="drawer-form-group">
                <label htmlFor="drawer-address">Địa chỉ nhận hàng</label>
                {currentUser && currentUser.addresses && currentUser.addresses.length > 0 ? (
                  <div className="checkout-address-selector-container">
                    <select
                      id="drawer-address-select"
                      value={selectedAddressType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedAddressType(val);
                        if (val === "new") {
                          setFormData((prev) => ({ ...prev, address: "" }));
                        } else {
                          setFormData((prev) => ({ ...prev, address: val }));
                        }
                      }}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #e1deda",
                        width: "100%",
                        fontSize: "13.5px",
                        fontFamily: "inherit",
                        marginBottom: selectedAddressType === "new" ? "8px" : "0"
                      }}
                    >
                      {currentUser.addresses.map((addr, index) => (
                        <option key={index} value={addr}>
                          {addr}
                        </option>
                      ))}
                      <option value="new">-- Nhập địa chỉ mới --</option>
                    </select>
                    {selectedAddressType === "new" && (
                      <input
                        id="drawer-address"
                        type="text"
                        required
                        placeholder="Số nhà, tên đường, quận, tỉnh/thành"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        style={{ marginTop: "8px" }}
                      />
                    )}
                  </div>
                ) : (
                  <input
                    id="drawer-address"
                    type="text"
                    required
                    placeholder="Số nhà, tên đường, quận, tỉnh/thành"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                )}
              </div>

              <div className="drawer-form-group">
                <label htmlFor="drawer-payment">Phương thức thanh toán</label>
                <select
                  id="drawer-payment"
                  value={formData.payment}
                  onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                >
                  <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                  <option value="payos">PayOS (Thanh toán trực tuyến)</option>
                </select>
              </div>

              <button type="submit" className="drawer-btn drawer-btn--primary submit-order-btn">
                Xác nhận đặt hàng
              </button>
            </form>
          </div>
        ) : (
          /* Cart Items Panel */
          <>
            {/* Delivery Tabs */}
            <div className="cart-drawer-tabs">
              <button
                type="button"
                className={`drawer-tab-btn ${activeTab === "delivery" ? "active" : ""}`}
                onClick={() => setActiveTab("delivery")}
              >
                Giỏ hàng ({selectedItems.length})
              </button>
              <button
                type="button"
                className={`drawer-tab-btn ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Đơn hàng của tôi ({displayOrders.length})
              </button>
            </div>

            {activeTab === "orders" ? (
              displayOrders.length === 0 ? (
                <div className="cart-drawer-empty">
                  <div className="empty-icon">📋</div>
                  <p>Bạn chưa có đơn hàng nào.</p>
                  <button
                    type="button"
                    className="drawer-btn drawer-btn--secondary"
                    onClick={() => setActiveTab("delivery")}
                  >
                    Xem sản phẩm trong giỏ
                  </button>
                </div>
              ) : (
                <div className="cart-drawer-orders">
                  {displayOrders.map((order) => (
                    <div key={order.id} className="drawer-order-card">
                      <div className="drawer-order-header">
                        <span className="order-id">Mã đơn: #{order.id}</span>
                        <span className={`order-status status-${order.status === "Chờ xử lý" ? "pending" : "done"}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="drawer-order-date">{order.date}</div>
                      <div className="drawer-order-items">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="drawer-order-item-row">
                            <img src={item.image} alt={item.name} className="order-item-thumb" />
                            <div className="order-item-name-qty">
                              <span className="name">{item.name}</span>
                              <span className="qty">x{item.quantity}</span>
                            </div>
                            <span className="price">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="drawer-order-total">
                        <span>Tổng tiền:</span>
                        <strong>{formatPrice(order.totalPrice)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : items.length === 0 ? (
              <div className="cart-drawer-empty">
                <div className="empty-icon">🛍</div>
                <p>Giỏ hàng của bạn đang trống</p>
                <button
                  type="button"
                  className="drawer-btn drawer-btn--secondary"
                  onClick={() => setIsCartOpen(false)}
                >
                  Khám phá sản phẩm
                </button>
              </div>
            ) : (
              <div className="cart-drawer-content">
                {/* Select All */}
                <div className="cart-select-all">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={
                        items.length > 0 && selectedItemIds.length === items.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <span className="checkmark-box"></span>
                    <span className="select-all-text">Chọn tất cả</span>
                  </label>
                </div>

                {/* Items List */}
                <div className="cart-drawer-items">
                  {items.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const stock = checkStock(item.id);
                    const isOutOfStock = stock === 0;

                    return (
                      <article key={item.id} className="drawer-item">
                        <div className="drawer-item-select">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isOutOfStock}
                              onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                            />
                            <span className="checkmark-box"></span>
                          </label>
                        </div>

                        <div className="drawer-item-img">
                          <img src={item.image} alt={item.name} />
                        </div>

                        <div className="drawer-item-details">
                          <div className="drawer-item-brand">{item.brand}</div>
                          <h4 className="drawer-item-name">{item.name}</h4>
                          <div className="drawer-item-sku">SKU: {item.id}</div>
                          {isOutOfStock && <span className="item-out-badge">Hết hàng</span>}
                          <div className="drawer-item-price">{formatPrice(item.price)}</div>
                        </div>

                        <div className="drawer-item-actions">
                          <div className="qty-controls">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Giảm số lượng"
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity + 1 > stock) {
                                  alert(`Chỉ còn ${stock} sản phẩm trong kho!`);
                                  return;
                                }
                                updateQuantity(item.id, item.quantity + 1);
                              }}
                              aria-label="Tăng số lượng"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="item-delete-btn"
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Xóa"
                          >
                            Xóa
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Footer calculation */}
                <footer className="cart-drawer-footer">
                  <div className="calc-row">
                    <span>Giỏ hàng:</span>
                    <strong>{formatPrice(selectedTotal)}</strong>
                  </div>
                  <div className="calc-row font-muted">
                    <span>Click & Collect:</span>
                    <span>0đ</span>
                  </div>
                  <button
                    type="button"
                    className="drawer-btn drawer-btn--primary checkout-trigger-btn"
                    disabled={selectedItems.length === 0}
                    onClick={() => setIsCheckingOut(true)}
                  >
                    Tiếp tục với hình thức giao hàng
                  </button>
                </footer>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
