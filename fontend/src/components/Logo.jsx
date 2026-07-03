import { Link } from "react-router-dom";

export default function Logo({ className = "logo" }) {
  return (
    <Link to="/" className={className}>
      <img src="/logo.png" alt="GlowSkin" className="logo-img" />
    </Link>
  );
}
