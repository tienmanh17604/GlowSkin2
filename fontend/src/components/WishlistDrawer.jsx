import { useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { formatPrice } from "../data/products";
import "./WishlistDrawer.css";

export default function WishlistDrawer() {
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
                <div key={product.id} className="wishlist-item-card">
                  <div className="wishlist-item-img-wrapper">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="wishlist-item-img"
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
                        onClick={() => toggleWishlist(product.id)}
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
