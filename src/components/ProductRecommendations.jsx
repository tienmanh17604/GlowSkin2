import { useState } from "react";
import { formatPrice, CATEGORIES } from "../data/products";
import { SKIN_TYPES, CONCERNS } from "../services/recommendProducts";
import "./ProductRecommendations.css";

function StarRating({ rating }) {
  return (
    <span className="product-stars">
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span className="product-rating-num">{rating}</span>
    </span>
  );
}

const MOCK_REVIEWS_POOL = [
  { user: "Nguyễn Thảo", rating: 5, comment: "Sản phẩm dùng rất êm, lành tính và kiềm dầu cực kỳ tốt." },
  { user: "Trần Minh", rating: 5, comment: "Rất đáng tiền, chính hãng, giao hàng nhanh và đóng gói cẩn thận." },
  { user: "Lê Hoa", rating: 4, comment: "Cấp ẩm sâu, da mịn màng hẳn ra. Dùng lâu sẽ thấy rõ hiệu quả." },
  { user: "Phạm Vy", rating: 5, comment: "Hợp da mình vô cùng, không bị kích ứng gì cả. Sẽ mua lại lần sau!" },
  { user: "Đỗ Hùng", rating: 4, comment: "Sản phẩm tốt, thấm nhanh, không bết dính. Đóng gói đẹp." }
];

function getProductReviews(productId) {
  const hash = productId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const r1 = MOCK_REVIEWS_POOL[hash % MOCK_REVIEWS_POOL.length];
  const r2 = MOCK_REVIEWS_POOL[(hash + 1) % MOCK_REVIEWS_POOL.length];
  const r3 = MOCK_REVIEWS_POOL[(hash + 2) % MOCK_REVIEWS_POOL.length];
  return [
    { ...r1, user: r1.user + " " + (hash % 2 === 0 ? "A." : "N.") },
    { ...r2, user: r2.user + " " + ((hash + 2) % 3 === 0 ? "T." : "M.") },
    { ...r3, user: r3.user + " " + ((hash + 4) % 2 === 0 ? "L." : "H.") }
  ];
}

export default function ProductRecommendations({
  products,
  profile,
  title = "Sản phẩm gợi ý cho bạn",
  subtitle,
  compact = false,
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "cod",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  if (!products?.length) return null;

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    setCheckoutProduct(null);
    setIsSuccess(false);
  };

  const handleOpenCheckout = () => {
    setCheckoutProduct(selectedProduct);
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }
    const code = "GS" + Math.floor(100000 + Math.random() * 900000);
    setOrderCode(code);
    setIsSuccess(true);
  };

  const handleCloseAll = () => {
    setSelectedProduct(null);
    setCheckoutProduct(null);
    setIsSuccess(false);
    setFormData({ name: "", phone: "", address: "", payment: "cod" });
  };

  return (
    <section className={`product-rec ${compact ? "product-rec--compact" : ""}`}>
      <div className="product-rec-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="product-rec-subtitle">{subtitle}</p>}
        </div>

        {profile && (
          <div className="product-rec-tags">
            {profile.skinTypes.map((type) => (
              <span key={type} className="product-tag product-tag--skin">
                {SKIN_TYPES[type]?.emoji} {SKIN_TYPES[type]?.label}
              </span>
            ))}
            {profile.concerns.slice(0, 3).map((c) => (
              <span key={c} className="product-tag product-tag--concern">
                {CONCERNS[c]?.emoji} {CONCERNS[c]?.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="product-grid">
        {products.map((product, index) => (
          <article
            key={product.id}
            className="product-card"
            style={{ animationDelay: `${index * 0.08}s` }}
            onClick={() => handleOpenDetail(product)}
          >
            <div className="product-card-image">
              <img src={product.image} alt={product.name} loading="lazy" />
              <span className="product-category">
                {CATEGORIES[product.category]}
              </span>
              {product.matchScore && (
                <span className="product-match">
                  {Math.min(99, Math.round(product.matchScore * 8 + 60))}% phù hợp
                </span>
              )}
            </div>

            <div className="product-card-body">
              <p className="product-brand">{product.brand}</p>
              <h3>{product.name}</h3>
              <p className="product-desc">{product.description}</p>

              <div className="product-ingredients">
                {product.ingredients.slice(0, 3).map((ing) => (
                  <span key={ing}>{ing}</span>
                ))}
              </div>

              {product.matchReasons?.length > 0 && (
                <ul className="product-reasons">
                  {product.matchReasons.map((reason) => (
                    <li key={reason}>✓ {reason}</li>
                  ))}
                </ul>
              )}

              <div className="product-footer">
                <StarRating rating={product.rating} />
                <span className="product-price">{formatPrice(product.price)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* DETAIL & CHECKOUT MODAL */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={handleCloseAll}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="product-modal-close" onClick={handleCloseAll}>×</button>
            
            <div className="product-modal-left">
              <div className="product-modal-img-wrap">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>
            </div>

            <div className="product-modal-right">
              {isSuccess ? (
                <div className="order-success">
                  <div className="success-icon">✓</div>
                  <h3>Đặt hàng thành công!</h3>
                  <p>
                    Cảm ơn bạn đã lựa chọn GlowSkin. Đơn hàng của bạn đang được chuẩn bị.
                    <br />
                    Mã đơn hàng: <strong>#{orderCode}</strong>
                  </p>
                  <button className="checkout-btn checkout-btn--primary" onClick={handleCloseAll}>
                    Đóng cửa sổ
                  </button>
                </div>
              ) : checkoutProduct ? (
                <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
                  <h3>Thông tin thanh toán</h3>
                  <div className="form-group">
                    <label>Họ và tên người nhận</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0912345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Địa chỉ nhận hàng</label>
                    <input
                      type="text"
                      required
                      placeholder="Số nhà, tên đường, quận/huyện, tỉnh/thành"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phương thức thanh toán</label>
                    <select
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
                      onClick={() => setCheckoutProduct(null)}
                    >
                      Quay lại
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="product-brand" style={{ fontSize: "13px", marginBottom: "4px" }}>{selectedProduct.brand}</p>
                  <h3>{selectedProduct.name}</h3>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                    <span className="product-price" style={{ fontSize: "22px", fontWeight: "800", color: "#8c6239" }}>
                      {formatPrice(selectedProduct.price)}
                    </span>
                    <span style={{ color: "#ebdcd0", fontSize: "18px" }}>|</span>
                    <StarRating rating={selectedProduct.rating} />
                    <span style={{ color: "#888", fontSize: "13.5px" }}>
                      ({selectedProduct.reviews} đánh giá)
                    </span>
                  </div>

                  <div className="product-modal-meta">
                    <span className="product-category" style={{ position: "static" }}>
                      {CATEGORIES[selectedProduct.category]}
                    </span>
                    {selectedProduct.matchScore && (
                      <span className="product-match" style={{ position: "static" }}>
                        Độ tương thích: {Math.min(99, Math.round(selectedProduct.matchScore * 8 + 60))}%
                      </span>
                    )}
                  </div>
                  
                  <h4>Mô tả sản phẩm</h4>
                  <p className="product-modal-desc">{selectedProduct.description}</p>
                  
                  <h4>Thành phần chính</h4>
                  <div className="product-modal-ingredients">
                    {selectedProduct.ingredients.map((ing) => (
                      <span key={ing}>{ing}</span>
                    ))}
                  </div>

                  <div style={{ marginTop: "16px", marginBottom: "24px" }}>
                    <button className="checkout-btn checkout-btn--primary" onClick={handleOpenCheckout} style={{ maxWidth: "200px" }}>
                      Thanh toán ngay
                    </button>
                  </div>

                  <div className="product-reviews">
                    <h4>Đánh giá từ khách hàng</h4>
                    {getProductReviews(selectedProduct.id).map((review, i) => (
                      <div key={i} className="review-item">
                        <div className="review-header">
                          <span className="review-user">{review.user}</span>
                          <span className="review-rating">{"★".repeat(review.rating)}</span>
                        </div>
                        <p className="review-comment">“{review.comment}”</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
