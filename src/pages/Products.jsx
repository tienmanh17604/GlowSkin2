import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductRecommendations from "../components/ProductRecommendations";
import {
  filterProducts,
  SKIN_TYPES,
  CONCERNS,
  CATEGORIES,
} from "../services/recommendProducts";
import "./Products.css";

export default function Products() {
  const [skinType, setSkinType] = useState("");
  const [category, setCategory] = useState("");
  const [concern, setConcern] = useState("");

  const filtered = useMemo(
    () => filterProducts({ skinType, category, concern }),
    [skinType, category, concern]
  );

  const clearFilters = () => {
    setSkinType("");
    setCategory("");
    setConcern("");
  };

  return (
    <div className="products-page">
      <header className="products-header">
        <Link to="/" className="logo">
          <span className="logo-icon">✦</span>
          GlowSkin
        </Link>
        <div className="products-header-actions">
          <Link to="/analyze" className="products-analyze-link">
            Phân tích da AI →
          </Link>
          <Link to="/" className="analyze-back">
            ← Về trang chủ
          </Link>
        </div>
      </header>

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

      <div className="products-filters">
        <div className="filter-group">
          <label htmlFor="skin-type">Loại da</label>
          <select
            id="skin-type"
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
          >
            <option value="">Tất cả</option>
            {Object.entries(SKIN_TYPES).map(([key, { label, emoji }]) => (
              <option key={key} value={key}>
                {emoji} {label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="category">Loại sản phẩm</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tất cả</option>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="concern">Mối quan tâm</label>
          <select
            id="concern"
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
          >
            <option value="">Tất cả</option>
            {Object.entries(CONCERNS).map(([key, { label, emoji }]) => (
              <option key={key} value={key}>
                {emoji} {label}
              </option>
            ))}
          </select>
        </div>

        {(skinType || category || concern) && (
          <button type="button" className="filter-clear" onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      <ProductRecommendations
        products={filtered.map((p) => ({ ...p, matchReasons: [] }))}
        title={`${filtered.length} sản phẩm`}
        subtitle={
          skinType || category || concern
            ? "Kết quả theo bộ lọc bạn chọn"
            : "Toàn bộ sản phẩm được GlowSkin đề xuất"
        }
      />
    </div>
  );
}
