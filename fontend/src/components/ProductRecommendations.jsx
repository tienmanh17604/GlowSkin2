import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useApp } from "../context/AppContext";
import { formatPrice, CATEGORIES } from "../data/products";
import { SKIN_TYPES, CONCERNS } from "../services/recommendProducts";
import "./ProductRecommendations.css";

function StarRating({ rating }) {
  const rounded = Math.round(rating);
  return (
    <span className="product-stars">
      {"★".repeat(rounded) + "☆".repeat(5 - rounded)}
    </span>
  );
}

// Reviews will be loaded dynamically from the AppContext database.

export default function ProductRecommendations({
  products,
  profile,
  title = "Sản phẩm gợi ý cho bạn",
  subtitle,
  compact = false,
}) {
  const navigate = useNavigate();
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
  const [activeImage, setActiveImage] = useState("");
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: "center center", transform: "scale(1)" });
  const [modalQty, setModalQty] = useState(1);
  
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(1.8)",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)",
    });
  };

  const { addToCart, setIsCartOpen } = useCart();
  const { placeOrder, reviews, addReview, wishlist, toggleWishlist } = useApp();

  const handleBrandClick = (e, brandName) => {
    e.stopPropagation();
    navigate(`/products?brand=${encodeURIComponent(brandName)}`);
  };

  // New review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewUser, setReviewUser] = useState("");
  const [reviewComment, setReviewComment] = useState("");

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewUser || !reviewComment) {
      alert("Vui lòng điền tên và nhận xét!");
      return;
    }
    const result = await addReview(selectedProduct.id, reviewUser, reviewRating, reviewComment);
    if (result.success) {
      setReviewUser("");
      setReviewComment("");
      setReviewRating(5);
    } else {
      alert(result.message || "Không thể gửi đánh giá.");
    }
  };

  const productReviews = selectedProduct
    ? (reviews || []).filter((r) => r.productId === selectedProduct.id)
    : [];

  if (!products?.length) return null;

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    setCheckoutProduct(null);
    setIsSuccess(false);
    setActiveImage(product.image);
    setZoomStyle({ transformOrigin: "center center", transform: "scale(1)" });
    setModalQty(1);
  };

  const handleAddToCart = (product, qty = 1, e) => {
    e?.stopPropagation();
    addToCart(product, qty);
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
    
    if (formData.payment === "momo") {
      const tempOrderCode = "GS" + Math.floor(100000 + Math.random() * 900000);
      const checkoutPayload = {
        formData,
        selectedItems: [{ ...checkoutProduct, quantity: modalQty }],
        selectedTotal: checkoutProduct.price * modalQty,
        tempOrderCode
      };
      // Save state to localStorage to recover after redirect
      localStorage.setItem("glowskin_pending_checkout", JSON.stringify(checkoutPayload));

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      fetch(`${API_URL}/payments/create-momo-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: checkoutProduct.price * modalQty, orderId: tempOrderCode }),
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
        console.error("Lỗi:", err);
        alert("Lỗi kết nối cổng thanh toán! Vui lòng thử lại.");
      });
    } else {
      const directItems = [{ ...checkoutProduct, quantity: modalQty }];
      const code = placeOrder(formData, directItems, checkoutProduct.price * modalQty);
      setOrderCode(code);
      setIsSuccess(true);
    }
  };

  const handleCloseAll = () => {
    setSelectedProduct(null);
    setCheckoutProduct(null);
    setIsSuccess(false);
    setModalQty(1);
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
            className={`product-card beauty-box-card ${product.hoverImage ? "has-hover-image" : ""}`}
            style={{ animationDelay: `${index * 0.08}s` }}
            onClick={() => handleOpenDetail(product)}
          >
            <div className="product-card-image">
              <img
                src={product.image}
                alt={product.name}
                className="primary-img"
                loading="lazy"
              />
              {product.hoverImage && (
                <img
                  src={product.hoverImage}
                  alt={`${product.name} hover`}
                  className="hover-img"
                  loading="lazy"
                />
              )}
              
              {/* Heart icon on top right */}
              <button
                type="button"
                className={`wishlist-heart-btn ${wishlist[product.id] ? "wishlist-heart-btn--active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
              >
                {wishlist[product.id] ? "♥" : "♡"}
              </button>

              {/* Gradient "Xem nhanh" button on hover */}
              <div className="quick-view-btn-gradient">
                <span>Xem nhanh</span>
              </div>

              {product.matchScore && (
                <span className="product-match-tag">
                  {Math.min(99, Math.round(product.matchScore * 8 + 60))}% phù hợp
                </span>
              )}

              {product.stock === 0 && (
                <span className="product-stock-badge product-stock-badge--out">Hết hàng</span>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <span className="product-stock-badge product-stock-badge--low">Chỉ còn {product.stock} sp!</span>
              )}
            </div>

            <div className="product-card-body centered-body" onClick={(e) => e.stopPropagation()}>
              <p className="product-brandcentered" onClick={(e) => handleBrandClick(e, product.brand)}>
                {product.brand}
              </p>
              <h3 
                className="product-namecentered" 
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                {product.name}
              </h3>
              <p 
                className="product-pricecentered" 
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                {formatPrice(product.price)}
              </p>
              <div className="product-ratingcentered">
                <StarRating rating={product.rating} />
                <span className="reviews-count">({product.reviews || 0})</span>
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
              {/* Vertical gallery thumbnails list */}
              <div className="product-modal-gallery">
                <button className="gallery-arrow gallery-arrow--up" onClick={() => {
                  const el = document.getElementById("gallery-thumbs-scroll");
                  if (el) el.scrollTop -= 70;
                }}>
                  ▲
                </button>
                <div className="gallery-thumbnails-viewport" id="gallery-thumbs-scroll">
                  {Array.from(new Set([
                    selectedProduct.image,
                    selectedProduct.hoverImage,
                    ...(selectedProduct.images || [])
                  ])).filter(Boolean).map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`gallery-thumb ${activeImage === imgUrl ? "gallery-thumb--active" : ""}`}
                      onMouseEnter={() => setActiveImage(imgUrl)}
                      onClick={() => setActiveImage(imgUrl)}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                    </div>
                  ))}
                </div>
                <button className="gallery-arrow gallery-arrow--down" onClick={() => {
                  const el = document.getElementById("gallery-thumbs-scroll");
                  if (el) el.scrollTop += 70;
                }}>
                  ▼
                </button>
              </div>

              {/* Main Preview Image Container with Zoom effect */}
              <div 
                className="product-modal-img-wrap"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img 
                  src={activeImage || selectedProduct.image} 
                  alt={selectedProduct.name} 
                  style={{ 
                    transition: "transform 0.1s ease-out", 
                    ...zoomStyle 
                  }} 
                />
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
                      <option value="momo">Ví điện tử MoMo (Thanh toán trực tuyến)</option>
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
                    <span style={{ color: "#ebdcd0", fontSize: "18px" }}>|</span>
                    <span style={{ fontSize: "13.5px", fontWeight: "700", color: selectedProduct.stock === 0 ? "#dc2626" : selectedProduct.stock <= 5 ? "#d97706" : "#16a34a" }}>
                      {selectedProduct.stock === 0 ? "HẾT HÀNG" : selectedProduct.stock <= 5 ? `CHỈ CÒN ${selectedProduct.stock} SP` : "CÒN HÀNG"}
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
                  
                  {selectedProduct.stock > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0 16px 0" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#666" }}>Số lượng:</span>
                      <div className="qty-controls" style={{ border: "1px solid #ebdcd0", borderRadius: "10px", overflow: "hidden", background: "white", display: "flex", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                          style={{ border: "none", background: "#faf6f0", fontSize: "18px", cursor: "pointer", width: "36px", height: "36px", color: "#8c6239" }}
                        >
                          −
                        </button>
                        <span style={{ fontSize: "14px", fontWeight: "600", minWidth: "36px", textAlign: "center" }}>{modalQty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (modalQty + 1 > selectedProduct.stock) {
                              alert(`Chỉ còn ${selectedProduct.stock} sản phẩm trong kho!`);
                              return;
                            }
                            setModalQty(modalQty + 1);
                          }}
                          style={{ border: "none", background: "#faf6f0", fontSize: "18px", cursor: "pointer", width: "36px", height: "36px", color: "#8c6239" }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="product-modal-actions" style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "16px" }}>
                    <button
                      type="button"
                      className="checkout-btn checkout-btn--primary"
                      onClick={(e) => selectedProduct.stock > 0 && handleAddToCart(selectedProduct, modalQty, e)}
                      disabled={selectedProduct.stock === 0}
                      style={{ flex: 2, height: "46px", borderRadius: "99px", opacity: selectedProduct.stock === 0 ? 0.5 : 1, cursor: selectedProduct.stock === 0 ? "not-allowed" : "pointer" }}
                    >
                      {selectedProduct.stock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
                    </button>
                    <button
                      type="button"
                      className="checkout-btn checkout-btn--secondary"
                      onClick={() => selectedProduct.stock > 0 && handleOpenCheckout()}
                      disabled={selectedProduct.stock === 0}
                      style={{ flex: 1.5, height: "46px", borderRadius: "99px", background: "#8c6239", color: "white", opacity: selectedProduct.stock === 0 ? 0.5 : 1, cursor: selectedProduct.stock === 0 ? "not-allowed" : "pointer" }}
                    >
                      {selectedProduct.stock === 0 ? "Hết hàng" : "Mua ngay"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => toggleWishlist(selectedProduct.id)}
                      style={{
                        width: "46px",
                        height: "46px",
                        borderRadius: "50%",
                        border: "1px solid #ebdcd0",
                        background: wishlist[selectedProduct.id] ? "rgba(255, 77, 79, 0.08)" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: wishlist[selectedProduct.id] ? "#ff4d4f" : "#666",
                        transition: "all 0.2s"
                      }}
                      aria-label="Yêu thích"
                    >
                      <svg viewBox="0 0 24 24" fill={wishlist[selectedProduct.id] ? "#ff4d4f" : "none"} stroke={wishlist[selectedProduct.id] ? "#ff4d4f" : "currentColor"} strokeWidth="2" style={{ width: "20px", height: "20px" }}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  <div className="product-modal-detail-link" style={{ textAlign: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(0, 0, 0, 0.05)" }}>
                    <Link 
                      to={`/products/${selectedProduct.id}`}
                      onClick={handleCloseAll}
                      style={{
                        color: "#8c6239",
                        textDecoration: "underline",
                        fontWeight: "600",
                        fontSize: "14px",
                        display: "inline-block"
                      }}
                    >
                      Xem chi tiết sản phẩm
                    </Link>
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
