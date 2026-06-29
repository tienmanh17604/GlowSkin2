import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./CartButton.css";

export default function CartButton({ className = "" }) {
  const { totalItems } = useCart();

  return (
    <Link to="/cart" className={`cart-btn ${className}`.trim()} aria-label="Giỏ hàng">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {totalItems > 0 && (
        <span className="cart-btn__badge">{totalItems > 99 ? "99+" : totalItems}</span>
      )}
    </Link>
  );
}
