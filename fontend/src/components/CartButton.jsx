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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10h20" />
        <path d="M4 10l2 9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l2-9" />
        <path d="M6 10a6 6 0 0 1 12 0" />
      </svg>
      {totalItems > 0 && (
        <span className="cart-btn__badge">{totalItems > 99 ? "99+" : totalItems}</span>
      )}
    </button>
  );
}
