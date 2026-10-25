import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatPrice } from "../data/products";
import "./WishlistDrawer.css";

export default function WishlistDrawer() {
  const navigate = useNavigate();
  const {
    products,
    wishlist,
    toggleWishlist,
    clearWishlist,
    isWishlistOpen,
    setIsWishlistOpen,
  } = useApp();

  // Get wishlisted products list
  const wishlistedProducts = useMemo(() => {
    return products.filter((p) => wishlist[p.id]);
  }, [products, wishlist]);

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (isWishlistOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isWishlistOpen]);

  if (!isWishlistOpen) return null;

  return (
    <div className="wishlist-drawer-overlay" onClick={() => setIsWishlistOpen(false)}>
      <div
        className="wishlist-drawer-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="wishlist-drawer-header">
          <div className="wishlist-header-left">
            <button
              type="button"
              className="wishlist-drawer-close-btn"
              onClick={() => setIsWishlistOpen(false)}
              aria-label="Đóng"
            >
              ←
            </button>
            <h2>Ưa thích</h2>
          </div>
          {wishlistedProducts.length > 0 && (
            <button
              type="button"
              className="wishlist-clear-all-btn"
              onClick={clearWishlist}
            >
              Xóa tất cả
            </button>
          )}
        </header>

        {/* Content */}
        <div className="wishlist-drawer-content">
          {wishlistedProducts.length === 0 ? (
            <div className="wishlist-empty-state">
              <span className="wishlist-empty-icon">🤍</span>
              <p>Danh sách ưa thích trống</p>
              <button
                type="button"
                className="wishlist-shop-btn"
                onClick={() => {
                  setIsWishlistOpen(false);
                  window.location.href = "/products";
                }}
              >
                Khám phá sản phẩm
              </button>
            </div>
          ) : (
            <div className="wishlist-items-list">
              {wishlistedProducts.map((product) => (
                <div
                  key={product.id}
                  className="wishlist-item-card"
                  onClick={() => {
                    navigate(`/products/${product.id}`);
                    setIsWishlistOpen(false);
                  }}
                >
                  <div className="wishlist-item-img-wrapper">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="wishlist-item-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23fbf9f5'/%3E%3Cpath d='M135 75h30v25h-30z' fill='%23c5a082'/%3E%3Cpath d='M120 100h60a12 12 0 0 1 12 12v120a12 12 0 0 1-12 12h-60a12 12 0 0 1-12-12V112a12 12 0 0 1 12-12z' fill='%23ffffff' stroke='%23e0d4c8' stroke-width='3'/%3E%3Ctext x='150' y='175' text-anchor='middle' font-family='sans-serif' font-size='11' font-weight='600' fill='%238c6b53'%3EGLOWSKIN%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="wishlist-item-details">
                    <h4 className="wishlist-item-name">{product.name}</h4>
                    <div className="wishlist-item-footer">
                      <span className="wishlist-item-price">
                        {formatPrice(product.price)}
                      </span>
                      <button
                        type="button"
                        className="wishlist-item-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
