import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import Logo from "../components/Logo";
import CartButton from "../components/CartButton";
import { formatPrice } from "../data/products";
import { CATEGORIES } from "../services/recommendProducts";
import "./ProductDetail.css";

function StarRating({ rating }) {
  const rounded = Math.round(rating);
  return (
    <span className="product-stars" style={{ color: "#d97706", fontSize: "16px" }}>
      {"★".repeat(rounded) + "☆".repeat(5 - rounded)}
    </span>
  );
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const { 
    products, 
    currentUser, 
    logout, 
    setIsLoginOpen, 
    wishlist, 
    toggleWishlist,
    reviews,
    addReview
  } = useApp();
  
  const { addToCart, setIsCartOpen } = useCart();
  
  const [activeImage, setActiveImage] = useState("");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("desc"); // "desc" | "ingredients" | "reviews"
  
  // Review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewUser, setReviewUser] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  
  // Find product
  const product = useMemo(() => {
    return products.find((p) => p.id === productId);
  }, [products, productId]);

  useEffect(() => {
    if (product) {
      setActiveImage(product.image);
      window.scrollTo(0, 0);
    }
  }, [product]);

  // Image Zoom logic
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: "center center", transform: "scale(1)" });
  
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

  // Get reviews
  const productReviews = useMemo(() => {
    if (!product) return [];
    return (reviews || []).filter((r) => r.productId === product.id);
  }, [reviews, product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewUser.trim() || !reviewComment.trim()) {
      alert("Vui lòng điền tên và nội dung đánh giá!");
      return;
    }
    const result = await addReview(product.id, reviewUser.trim(), reviewRating, reviewComment.trim());
    if (result.success) {
      setReviewUser("");
      setReviewComment("");
      setReviewRating(5);
      alert("Cảm ơn bạn đã gửi đánh giá!");
    } else {
      alert(result.message || "Không thể gửi đánh giá.");
    }
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    setIsCartOpen(true);
  };

  if (!product) {
    return (
      <div className="product-detail-page not-found-page">
        <header className="detail-header">
          <Logo />
          <Link to="/products" className="detail-back-link">← Quay lại danh sách</Link>
        </header>
        <div className="not-found-container">
          <h2>Sản phẩm không tồn tại</h2>
          <p>Xin lỗi, chúng tôi không tìm thấy sản phẩm bạn yêu cầu hoặc sản phẩm đã bị xóa.</p>
          <Link to="/products" className="btn-primary">Khám phá sản phẩm khác</Link>
        </div>
      </div>
    );
  }

  const stockStatusText = product.stock === 0 
    ? "HẾT HÀNG" 
    : product.stock <= 5 
      ? `CHỈ CÒN ${product.stock} SẢN PHẨM` 
      : "CÒN HÀNG";

  const stockColor = product.stock === 0 
    ? "#dc2626" 
    : product.stock <= 5 
      ? "#d97706" 
      : "#16a34a";

  const isWishlisted = wishlist[product.id];

  return (
    <div className="product-detail-page">
      {/* Header */}
      <header className="detail-header">
        <Logo />
        <div className="detail-header-actions">
          <Link to="/products" className="detail-nav-link">Sản phẩm</Link>
          <Link to="/analyze" className="detail-nav-link detail-nav-link--accent">Phân tích da AI →</Link>
          <Link to="/" className="detail-nav-link detail-nav-link--muted">← Về trang chủ</Link>
          
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

          <CartButton />
        </div>
      </header>

      {/* Main product details container */}
      <main className="detail-container">
        {/* Breadcrumbs */}
        <nav className="detail-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/products">Sản phẩm</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`}>{CATEGORIES[product.category]}</Link>
          <span>/</span>
          <span className="active">{product.name}</span>
        </nav>

        <div className="detail-layout">
          {/* Left Column: Images */}
          <div className="detail-images-col">
            {/* Gallery thumbnails on the left side of the main picture */}
            <div className="detail-gallery-thumbs">
              {Array.from(new Set([
                product.image,
                product.hoverImage,
                ...(product.images || [])
              ])).filter(Boolean).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`detail-thumb ${activeImage === imgUrl ? "detail-thumb--active" : ""}`}
                  onMouseEnter={() => setActiveImage(imgUrl)}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`Thumb ${idx + 1}`} />
                </div>
              ))}
            </div>

            {/* Large Preview Box with Zoom */}
            <div 
              className="detail-main-img-wrap"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img 
                src={activeImage || product.image} 
                alt={product.name}
                style={{ 
                  transition: "transform 0.1s ease-out", 
                  ...zoomStyle 
                }} 
              />
            </div>
          </div>

          {/* Right Column: Title, Actions */}
          <div className="detail-info-col">
            <span className="detail-brand">{product.brand}</span>
            <h1 className="detail-title">{product.name}</h1>

            <div className="detail-ratings-row">
              <StarRating rating={product.rating} />
              <span className="detail-reviews-count">({productReviews.length} đánh giá)</span>
              <span className="divider">|</span>
              <span className="detail-stock-status" style={{ color: stockColor, fontWeight: "700" }}>
                {stockStatusText}
              </span>
            </div>

            <div className="detail-price-box">
              <span className="detail-price">{formatPrice(product.price)}</span>
            </div>

            {/* Buying Block */}
            {product.stock > 0 ? (
              <div className="detail-purchase-block">
                <div className="detail-actions">
                  <div className="qty-controls">
                    <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                    <span>{qty}</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (qty + 1 > product.stock) {
                          alert(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
                          return;
                        }
                        setQty(qty + 1);
                      }}
                    >+</button>
                  </div>

                  <button 
                    type="button" 
                    className="detail-btn detail-btn--primary"
                    onClick={() => addToCart(product, qty)}
                  >
                    Thêm vào giỏ hàng
                  </button>
                  <button 
                    type="button" 
                    className="detail-btn detail-btn--secondary"
                    onClick={handleBuyNow}
                  >
                    Mua ngay
                  </button>
                  <button
                    type="button"
                    className={`detail-wishlist-btn ${isWishlisted ? "active" : ""}`}
                    onClick={() => toggleWishlist(product.id)}
                    aria-label="Yêu thích"
                  >
                    <svg viewBox="0 0 24 24" fill={isWishlisted ? "#ff4d4f" : "none"} stroke={isWishlisted ? "#ff4d4f" : "currentColor"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="detail-out-of-stock-alert">
                <p>Sản phẩm này hiện đang hết hàng. Vui lòng quay lại sau!</p>
              </div>
            )}

            {/* Tabs content: Description, Ingredients, Reviews */}
            <div className="detail-tabs">
              <div className="tabs-header">
                <button 
                  type="button" 
                  className={`tab-btn ${activeTab === "desc" ? "active" : ""}`}
                  onClick={() => setActiveTab("desc")}
                >
                  Mô tả sản phẩm
                </button>
                <button 
                  type="button" 
                  className={`tab-btn ${activeTab === "ingredients" ? "active" : ""}`}
                  onClick={() => setActiveTab("ingredients")}
                >
                  Thành phần chính
                </button>
                <button 
                  type="button" 
                  className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                  onClick={() => setActiveTab("reviews")}
                >
                  Đánh giá ({productReviews.length})
                </button>
              </div>

              <div className="tab-panel">
                {activeTab === "desc" && (
                  <p className="tab-desc-content">{product.description}</p>
                )}

                {activeTab === "ingredients" && (
                  <div className="tab-ingredients-list">
                    {product.ingredients && product.ingredients.map((ing) => (
                      <span key={ing} className="ingredient-badge">{ing}</span>
                    ))}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="tab-reviews-panel">
                    {productReviews.length === 0 ? (
                      <p className="no-reviews-text">Chưa có đánh giá nào cho sản phẩm này. Hãy viết đánh giá đầu tiên!</p>
                    ) : (
                      <div className="reviews-list">
                        {productReviews.map((review, i) => (
                          <div key={review._id || i} className="review-card">
                            <div className="review-card-header">
                              <strong>{review.userName}</strong>
                              <span className="stars-fill">
                                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                              </span>
                              <span className="date-str">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <p className="review-text">“{review.comment}”</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write review form */}
                    <form className="detail-review-form" onSubmit={handleReviewSubmit}>
                      <h3>Viết đánh giá của bạn</h3>
                      
                      <div className="form-group-star">
                        <label>Chọn số sao:</label>
                        <div className="star-buttons">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              style={{ color: star <= reviewRating ? "#d97706" : "#ddd" }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-row-inputs">
                        <div className="input-group">
                          <label htmlFor="review-author">Họ và tên của bạn</label>
                          <input 
                            id="review-author"
                            type="text" 
                            required 
                            placeholder="Ví dụ: Nguyễn Văn A"
                            value={reviewUser}
                            onChange={(e) => setReviewUser(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="review-desc">Nhận xét về sản phẩm</label>
                        <textarea 
                          id="review-desc"
                          required 
                          rows={4} 
                          placeholder="Chia sẻ trải nghiệm sử dụng thực tế của bạn..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                        />
                      </div>

                      <button type="submit" className="detail-btn detail-btn--primary send-review-btn">
                        Gửi đánh giá
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
