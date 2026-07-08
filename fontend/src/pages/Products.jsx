import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CartButton from "../components/CartButton";
import Logo from "../components/Logo";
import ProductRecommendations from "../components/ProductRecommendations";
import { useApp } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import {
  filterProducts,
  SKIN_TYPES,
  CONCERNS,
  CATEGORIES,
} from "../services/recommendProducts";
import "./Products.css";

export default function Products() {
  const { products, currentUser, logout, setIsLoginOpen, wishlist, placeOrder } = useApp();
  const { clearCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [skinType, setSkinType] = useState("");
  const [category, setCategory] = useState("");
  const [concern, setConcern] = useState("");
  const [brand, setBrand] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [sortBy, setSortBy] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [paymentSuccessCode, setPaymentSuccessCode] = useState("");

  // Sync brand from query param
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    if (brandParam) {
      setBrand(brandParam);
    } else {
      setBrand("");
    }
  }, [searchParams]);

  // Payment redirect detection
  useEffect(() => {
    const paymentStatus = searchParams.get("paymentStatus");
    const orderCode = searchParams.get("orderCode");

    if (paymentStatus && orderCode) {
      const pendingCheckoutStr = localStorage.getItem("glowskin_pending_checkout");
      if (pendingCheckoutStr) {
        try {
          const { formData, selectedItems, selectedTotal } = JSON.parse(pendingCheckoutStr);
          
          if (paymentStatus === "vnpay_success" || paymentStatus === "payos_success") {
            // Place order with "Đã thanh toán" status
            placeOrder(formData, selectedItems, selectedTotal, "Đã thanh toán");
            // Clear cart
            clearCart();
            // Show custom payment success modal
            setPaymentSuccessCode(orderCode);
          }
        } catch (err) {
          console.error("Lỗi phục hồi thanh toán:", err);
        } finally {
          localStorage.removeItem("glowskin_pending_checkout");
          setSearchParams({});
        }
      }
    }
  }, [searchParams]);

  const filteredAndSorted = useMemo(() => {
    // 1. Filter using existing filters
    let list = filterProducts(products, { skinType, category, concern });

    // 2. Brand filter
    if (brand) {
      list = list.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // 4. Price range filter
    if (priceRange) {
      list = list.filter((p) => {
        const price = p.price;
        if (priceRange === "under500") return price < 500000;
        if (priceRange === "500to1000") return price >= 500000 && price <= 1000000;
        if (priceRange === "1000to1500") return price >= 1000000 && price <= 1500000;
        if (priceRange === "1500to2000") return price >= 1500000 && price <= 2000000;
        if (priceRange === "over2000") return price > 2000000;
        return true;
      });
    }

    // 5. Filter by favorites
    if (showFavoritesOnly) {
      list = list.filter((p) => wishlist[p.id]);
    }

    // 6. Sort list
    if (sortBy === "priceAsc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceDesc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "ratingDesc") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [products, skinType, category, concern, brand, searchQuery, priceRange, sortBy, showFavoritesOnly, wishlist]);

  // Calculate dynamic category counts based on full products list
  const categoryCounts = useMemo(() => {
    const counts = {};
    Object.keys(CATEGORIES).forEach((cat) => {
      counts[cat] = 0;
    });
    products.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  }, [products]);

  const clearFilters = () => {
    setSkinType("");
    setCategory("");
    setConcern("");
    setBrand("");
    setSearchQuery("");
    setPriceRange("");
    setSortBy("all");
    setShowFavoritesOnly(false);
    setSearchParams({});
  };

  const removeBrandFilter = () => {
    setBrand("");
    setSearchParams((prev) => {
      prev.delete("brand");
      return prev;
    });
  };

  return (
    <div className="products-page">
      <header className="products-header">
        <Logo />
        <div className="products-header-actions">
          <Link to="/analyze" className="products-analyze-link">
            Phân tích da AI →
          </Link>
          <Link to="/" className="analyze-back">
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
                <Link to="/admin" className="nav-admin-link">
                  ⚙️ Quản lý
                </Link>
              )}
              <button type="button" className="nav-logout-btn" onClick={logout}>
                Đăng xuất
              </button>
            </div>
          )}

          <button
            type="button"
            className={`nav-wishlist-btn ${showFavoritesOnly ? "nav-wishlist-btn--active" : ""}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            aria-label="Yêu thích"
          >
            <svg viewBox="0 0 24 24" fill={showFavoritesOnly ? "#ff4d4f" : "none"} stroke={showFavoritesOnly ? "#ff4d4f" : "currentColor"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {Object.values(wishlist || {}).filter(Boolean).length > 0 && (
              <span className="wishlist-badge">
                {Object.values(wishlist || {}).filter(Boolean).length}
              </span>
            )}
          </button>

          <CartButton />
        </div>
      </header>

      {/* Hero section */}
      <div className="products-hero">
        <h1>Gợi ý sản phẩm skincare</h1>
        <p>
          Khám phá mỹ phẩm phù hợp theo loại da và tình trạng da.
          Phân tích da bằng AI để nhận gợi ý cá nhân hóa chính xác hơn.
        </p>
        <Link to="/analyze" className="products-cta">
          ✨ Phân tích da để gợi ý riêng cho bạn
        </Link>
      </div>

      {/* 2-Column Beauty Box Shopping Layout */}
      <div className="products-layout-container">
        {/* Sidebar Filters */}
        <aside className="products-sidebar">
          {/* Search container */}
          <div className="sidebar-search-box">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm trong bộ sưu tập"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Giá sản phẩm</h3>
            <div className="filter-options-list">
              <label className="checkbox-filter-item">
                <input
                  type="checkbox"
                  checked={priceRange === "under500"}
                  onChange={() => setPriceRange(priceRange === "under500" ? "" : "under500")}
                />
                <span className="checkbox-custom"></span>
                <span className="filter-label-text">Dưới 500.000đ</span>
              </label>
              <label className="checkbox-filter-item">
                <input
                  type="checkbox"
                  checked={priceRange === "500to1000"}
                  onChange={() => setPriceRange(priceRange === "500to1000" ? "" : "500to1000")}
                />
                <span className="checkbox-custom"></span>
                <span className="filter-label-text">500.000đ - 1.000.000đ</span>
              </label>
              <label className="checkbox-filter-item">
                <input
                  type="checkbox"
                  checked={priceRange === "1000to1500"}
                  onChange={() => setPriceRange(priceRange === "1000to1500" ? "" : "1000to1500")}
                />
                <span className="checkbox-custom"></span>
                <span className="filter-label-text">1.000.000đ - 1.500.000đ</span>
              </label>
              <label className="checkbox-filter-item">
                <input
                  type="checkbox"
                  checked={priceRange === "1500to2000"}
                  onChange={() => setPriceRange(priceRange === "1500to2000" ? "" : "1500to2000")}
                />
                <span className="checkbox-custom"></span>
                <span className="filter-label-text">1.500.000đ - 2.000.000đ</span>
              </label>
              <label className="checkbox-filter-item">
                <input
                  type="checkbox"
                  checked={priceRange === "over2000"}
                  onChange={() => setPriceRange(priceRange === "over2000" ? "" : "over2000")}
                />
                <span className="checkbox-custom"></span>
                <span className="filter-label-text">Trên 2.000.000đ</span>
              </label>
            </div>
          </div>

          {/* Category Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Loại sản phẩm</h3>
            <div className="category-filter-list">
              <button
                type="button"
                className={`category-item-btn ${category === "" ? "category-item-btn--active" : ""}`}
                onClick={() => setCategory("")}
              >
                <span>Tất cả</span>
                <span className="cat-count">{products.length}</span>
              </button>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`category-item-btn ${category === key ? "category-item-btn--active" : ""}`}
                  onClick={() => setCategory(category === key ? "" : key)}
                >
                  <span>{label}</span>
                  <span className="cat-count">{categoryCounts[key] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dropdown Filters (Skin Type, Concern) for Advanced Selection */}
          <div className="filter-section">
            <h3 className="filter-section-title">Lọc nâng cao</h3>
            <div className="dropdown-filter-group">
              <div className="filter-dropdown">
                <label>Loại da</label>
                <select
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                >
                  <option value="">Tất cả loại da</option>
                  {Object.entries(SKIN_TYPES).map(([key, { label, emoji }]) => (
                    <option key={key} value={key}>
                      {emoji} {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-dropdown">
                <label>Mối quan tâm</label>
                <select
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                >
                  <option value="">Tất cả mối quan tâm</option>
                  {Object.entries(CONCERNS).map(([key, { label, emoji }]) => (
                    <option key={key} value={key}>
                      {emoji} {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(skinType || category || concern || brand || searchQuery || priceRange || sortBy !== "all" || showFavoritesOnly) && (
            <button type="button" className="filter-clear-all-btn" onClick={clearFilters}>
              Xóa tất cả bộ lọc
            </button>
          )}
        </aside>

        {/* Products Grid Column */}
        <main className="products-main-content">
          <div className="products-content-topbar">
            <div className="topbar-left">
              <span className="total-results">
                <strong>{filteredAndSorted.length}</strong> Kết quả
              </span>
              {brand && (
                <span className="active-brand-tag">
                  Lọc theo: <strong>{brand}</strong>
                  <button type="button" className="remove-tag-btn" onClick={removeBrandFilter}>×</button>
                </span>
              )}
              {showFavoritesOnly && (
                <span className="active-brand-tag favorite-filter-tag">
                  Yêu thích ❤️
                  <button type="button" className="remove-tag-btn" onClick={() => setShowFavoritesOnly(false)}>×</button>
                </span>
              )}
            </div>

            <div className="topbar-right">
              <div className="sort-by-wrapper">
                <label htmlFor="sort-select">Lọc theo</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="priceAsc">Giá tăng dần</option>
                  <option value="priceDesc">Giá giảm dần</option>
                  <option value="ratingDesc">Đánh giá cao nhất</option>
                </select>
              </div>
            </div>
          </div>

          <div className="products-grid-wrapper">
            <ProductRecommendations
              products={filteredAndSorted.map((p) => ({ ...p, matchReasons: [] }))}
              title=""
              subtitle=""
              compact={true}
            />
          </div>
        </main>
      </div>

      {/* Real Payment Success Modal */}
      {paymentSuccessCode && (
        <div className="payment-success-modal-overlay">
          <div className="payment-success-modal-card">
            <div className="success-checkmark">✓</div>
            <h2>Thanh toán thành công!</h2>
            <p>Đơn hàng <strong>#{paymentSuccessCode}</strong> của bạn đã được thanh toán qua cổng và đang được xử lý.</p>
            <button type="button" className="close-success-modal-btn" onClick={() => setPaymentSuccessCode("")}>
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
