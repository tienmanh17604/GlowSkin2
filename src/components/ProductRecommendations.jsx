import { formatPrice, CATEGORIES } from "../data/products";
import { SKIN_TYPES, CONCERNS } from "../services/recommendProducts";
import "./ProductRecommendations.css";

function StarRating({ rating }) {
  return (
    <span className="product-stars">
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span className="product-rating-num">{rating}</span>
    </span>
  );
}

export default function ProductRecommendations({
  products,
  profile,
  title = "Sản phẩm gợi ý cho bạn",
  subtitle,
  compact = false,
}) {
  if (!products?.length) return null;

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
            className="product-card"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="product-card-image">
              <img src={product.image} alt={product.name} loading="lazy" />
              <span className="product-category">
                {CATEGORIES[product.category]}
              </span>
              {product.matchScore && (
                <span className="product-match">
                  {Math.min(99, Math.round(product.matchScore * 8 + 60))}% phù hợp
                </span>
              )}
            </div>

            <div className="product-card-body">
              <p className="product-brand">{product.brand}</p>
              <h3>{product.name}</h3>
              <p className="product-desc">{product.description}</p>

              <div className="product-ingredients">
                {product.ingredients.slice(0, 3).map((ing) => (
                  <span key={ing}>{ing}</span>
                ))}
              </div>

              {product.matchReasons?.length > 0 && (
                <ul className="product-reasons">
                  {product.matchReasons.map((reason) => (
                    <li key={reason}>✓ {reason}</li>
                  ))}
                </ul>
              )}

              <div className="product-footer">
                <StarRating rating={product.rating} />
                <span className="product-price">{formatPrice(product.price)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
