import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../data/products";
import "../components/ProductRecommendations.css";
import "./Cart.css";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "cod",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }
    const code = "GS" + Math.floor(100000 + Math.random() * 900000);
    setOrderCode(code);
    setIsSuccess(true);
    clearCart();
  };

  const handleCloseSuccess = () => {
    setIsSuccess(false);
    setShowCheckout(false);
    setFormData({ name: "", phone: "", address: "", payment: "cod" });
  };

  return (
    <div className="cart-page">
      <header className="cart-header">
        <Logo />
        <div className="cart-header-actions">
          <Link to="/products" className="cart-link">
            Tiếp tục mua sắm
          </Link>
          <Link to="/" className="cart-link cart-link--muted">
            ← Về trang chủ
          </Link>
        </div>
      </header>

      <div className="cart-container">
        <h1>Giỏ hàng của bạn</h1>

        {items.length === 0 && !isSuccess ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛍</div>
            <p>Giỏ hàng đang trống</p>
            <Link to="/products" className="cart-empty-btn">
              Khám phá sản phẩm
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="cart-success">
            <div className="cart-success-icon">✓</div>
            <h2>Đặt hàng thành công!</h2>
            <p>
              Cảm ơn bạn đã lựa chọn GlowSkin. Đơn hàng của bạn đang được chuẩn bị.
              <br />
              Mã đơn hàng: <strong>#{orderCode}</strong>
            </p>
            <div className="cart-success-actions">
              <Link to="/products" className="checkout-btn checkout-btn--primary">
                Tiếp tục mua sắm
              </Link>
              <button
                type="button"
                className="checkout-btn checkout-btn--secondary"
                onClick={handleCloseSuccess}
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <article key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cart-item-info">
                    <p className="cart-item-brand">{item.brand}</p>
                    <h3>{item.name}</h3>
                    <p className="cart-item-price">{formatPrice(item.price)}</p>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-qty">
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
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                    <p className="cart-item-subtotal">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              {!showCheckout ? (
                <>
                  <h2>Tóm tắt đơn hàng</h2>
                  <div className="cart-summary-row">
                    <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="cart-summary-row cart-summary-row--total">
                    <span>Tổng cộng</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <button
                    type="button"
                    className="checkout-btn checkout-btn--primary cart-checkout-btn"
                    onClick={() => setShowCheckout(true)}
                  >
                    Thanh toán
                  </button>
                </>
              ) : (
                <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
                  <h2>Thông tin thanh toán</h2>
                  <div className="form-group">
                    <label htmlFor="cart-name">Họ và tên người nhận</label>
                    <input
                      id="cart-name"
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cart-phone">Số điện thoại</label>
                    <input
                      id="cart-phone"
                      type="tel"
                      required
                      placeholder="Ví dụ: 0912345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cart-address">Địa chỉ nhận hàng</label>
                    <input
                      id="cart-address"
                      type="text"
                      required
                      placeholder="Số nhà, tên đường, quận/huyện, tỉnh/thành"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cart-payment">Phương thức thanh toán</label>
                    <select
                      id="cart-payment"
                      value={formData.payment}
                      onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                    >
                      <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                      <option value="bank">Chuyển khoản ngân hàng (QR Code)</option>
                    </select>
                  </div>
                  <div className="checkout-btns">
                    <button type="submit" className="checkout-btn checkout-btn--primary">
                      Xác nhận đặt hàng
                    </button>
                    <button
                      type="button"
                      className="checkout-btn checkout-btn--secondary"
                      onClick={() => setShowCheckout(false)}
                    >
                      Quay lại
                    </button>
                  </div>
                </form>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
