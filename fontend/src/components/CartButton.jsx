import { useCart } from "../context/CartContext";
import "./CartButton.css";

export default function CartButton({ className = "" }) {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <button
      type="button"
      className={`cart-btn ${className}`.trim()}
      onClick={() => setIsCartOpen(true)}
      aria-label="Giỏ hàng"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="15" rx="2" />
        <path d="M16 10a4 4 0 0 1-8 0V6a4 4 0 0 1 8 0v4z" />
      </svg>
      {totalItems > 0 && (
        <span className="cart-btn__badge">{totalItems > 99 ? "99+" : totalItems}</span>
      )}
    </button>
  );
}
