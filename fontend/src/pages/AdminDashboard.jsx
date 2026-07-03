import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Logo from "../components/Logo";
import { formatPrice, CATEGORIES } from "../data/products";
import { SKIN_TYPES, CONCERNS } from "../services/recommendProducts";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    users,
    products,
    orders,
    reviews,
    currentUser,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    updateUserMembership,
    updateOrderStatus,
    deleteReview,
  } = useApp();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "products" | "members" | "orders" | "reviews"
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const handleEditProductClick = (product) => {
    setEditingProduct({
      ...product,
      ingredients: Array.isArray(product.ingredients) 
        ? product.ingredients.join(", ") 
        : product.ingredients || "",
    });
  };

  const handleEditCheckboxChange = (field, key) => {
    setEditingProduct((prev) => {
      const list = prev[field] || [];
      const newList = list.includes(key)
        ? list.filter((item) => item !== key)
        : [...list, key];
      return { ...prev, [field]: newList };
    });
  };

  const handleEditProductSubmit = (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.brand || !editingProduct.price || !editingProduct.stock) {
      alert("Vui lòng điền đầy đủ các trường thông tin bắt buộc!");
      return;
    }

    const processedIngredients = typeof editingProduct.ingredients === "string"
      ? editingProduct.ingredients.split(",").map(i => i.trim()).filter(Boolean)
      : editingProduct.ingredients || [];

    updateProduct({
      ...editingProduct,
      price: Number(editingProduct.price),
      stock: Number(editingProduct.stock),
      ingredients: processedIngredients,
    });

    setEditingProduct(null);
  };

  // Form states for new product
  const [newProductData, setNewProductData] = useState({
    name: "",
    brand: "",
    category: "cleanser",
    price: "",
    stock: "",
    description: "",
    image: "",
    ingredients: "",
    skinTypes: [],
    concerns: [],
  });

  // Access guard
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="access-denied">
        <div className="access-denied-icon">🔒</div>
        <h1>Truy cập bị từ chối</h1>
        <p>Bạn không có quyền truy cập vào trang quản trị này. Vui lòng đăng nhập bằng tài khoản Admin.</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link to="/login" className="btn-primary" style={{ textDecoration: "none" }}>
            Đăng nhập Admin
          </Link>
          <Link to="/" className="btn-secondary" style={{ textDecoration: "none" }}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Calculate Overview Stats
  const stats = useMemo(() => {
    const totalSales = orders
      .filter((o) => o.status === "Đã giao")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const pendingOrders = orders.filter((o) => o.status === "Chờ xử lý" || o.status === "Đang xử lý").length;
    const outOfStockProducts = products.filter((p) => p.stock === 0).length;
    const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const vipUsers = users.filter((u) => u.membership === "VIP").length;

    // Calculate review statistics
    const totalReviews = (reviews || []).length;
    const averageRating = totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

    return {
      totalSales,
      ordersCount: orders.length,
      pendingOrders,
      productsCount: products.length,
      outOfStockProducts,
      lowStockProducts,
      usersCount: users.length,
      vipUsers,
      totalReviews,
      averageRating,
    };
  }, [orders, products, users, reviews]);

  // Handle stock adjustments
  const handleStockChange = (product, change) => {
    const newStock = Math.max(0, product.stock + change);
    updateProduct({ ...product, stock: newStock });
  };

  const handleStockToggle = (product) => {
    // If out of stock, restock to 50, else set to 0
    const newStock = product.stock === 0 ? 50 : 0;
    updateProduct({ ...product, stock: newStock });
  };

  // Add Product form submissions
  const handleCheckboxChange = (field, key) => {
    setNewProductData((prev) => {
      const list = prev[field];
      const newList = list.includes(key)
        ? list.filter((item) => item !== key)
        : [...list, key];
      return { ...prev, [field]: newList };
    });
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProductData.name || !newProductData.brand || !newProductData.price || !newProductData.stock) {
      alert("Vui lòng điền đầy đủ các trường thông tin bắt buộc!");
      return;
    }

    // Assign default image if none provided
    const imageToUse = newProductData.image || "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80";

    addProduct({
      ...newProductData,
      image: imageToUse,
    });

    // Reset Form & Close Modal
    setNewProductData({
      name: "",
      brand: "",
      category: "cleanser",
      price: "",
      stock: "",
      description: "",
      image: "",
      ingredients: "",
      skinTypes: [],
      concerns: [],
    });
    setShowAddModal(false);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-left">
          <Logo />
          <h1>GlowSkin Administration</h1>
          <span className="admin-badge">Admin Panel</span>
        </div>
        <div className="admin-header-actions">
          <span className="admin-user-info">Xin chào, <strong>{currentUser.name}</strong></span>
          <Link to="/" className="admin-home-btn">← Về Client</Link>
          <button type="button" className="admin-logout-btn" onClick={() => { logout(); navigate("/login"); }}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="admin-container">
        <div className="admin-layout">
          {/* Sidebar Menu */}
          <aside className="admin-sidebar">
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === "overview" ? "admin-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              📊 Tổng quan hệ thống
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === "products" ? "admin-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              📦 Sản phẩm & Kho hàng
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === "members" ? "admin-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("members")}
            >
              👥 Khách hàng & Hội viên
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === "orders" ? "admin-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              🛒 Quản lý đơn hàng {stats.pendingOrders > 0 && <span style={{ background: "#dc2626", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "11px", fontWeight: "700" }}>{stats.pendingOrders}</span>}
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === "reviews" ? "admin-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              ⭐ Quản lý đánh giá
            </button>
          </aside>

          {/* Main Workspace */}
          <main className="admin-content">
            {/* TAB OVERVIEW */}
            {activeTab === "overview" && (
              <div>
                <div className="admin-content-header">
                  <h2>Tổng quan hoạt động</h2>
                </div>

                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">💰</div>
                    <div className="admin-stat-info">
                      <span className="admin-stat-label">Doanh thu (Đã giao)</span>
                      <span className="admin-stat-value">{formatPrice(stats.totalSales)}</span>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">📦</div>
                    <div className="admin-stat-info">
                      <span className="admin-stat-label">Tổng số sản phẩm</span>
                      <span className="admin-stat-value">{stats.productsCount}</span>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">👥</div>
                    <div className="admin-stat-info">
                      <span className="admin-stat-label">Thành viên đăng ký</span>
                      <span className="admin-stat-value">{stats.usersCount} ({stats.vipUsers} VIP)</span>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">🚨</div>
                    <div className="admin-stat-info">
                      <span className="admin-stat-label">Kho hàng cảnh báo</span>
                      <span className="admin-stat-value" style={{ color: stats.outOfStockProducts > 0 ? "#dc2626" : "#8c6239" }}>
                        {stats.outOfStockProducts} hết / {stats.lowStockProducts} sắp hết
                      </span>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <div className="admin-stat-icon">⭐</div>
                    <div className="admin-stat-info">
                      <span className="admin-stat-label">Đánh giá trung bình</span>
                      <span className="admin-stat-value">{stats.averageRating}★ ({stats.totalReviews} lượt)</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "30px" }}>
                  <h3 style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "22px", color: "#8c6239", marginBottom: "16px" }}>
                    Hoạt động gần đây
                  </h3>
                  <p style={{ color: "#666", fontSize: "14.5px", lineHeight: "1.6" }}>
                    Hệ thống đang vận hành bình thường. Có <strong>{stats.pendingOrders} đơn hàng</strong> cần được xử lý và giao hàng. Hãy kiểm tra các tab tương ứng để thực hiện thao tác quản lý chi tiết.
                  </p>
                </div>
              </div>
            )}

            {/* TAB PRODUCTS & INVENTORY */}
            {activeTab === "products" && (
              <div>
                <div className="admin-content-header">
                  <h2>Quản lý sản phẩm & Kho hàng</h2>
                  <button type="button" className="btn-primary" onClick={() => setShowAddModal(true)}>
                    + Thêm sản phẩm
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Ảnh</th>
                        <th>Sản phẩm / Thương hiệu</th>
                        <th>Danh mục</th>
                        <th>Đơn giá</th>
                        <th>Tồn kho</th>
                        <th>Trạng thái</th>
                        <th>Thao tác nhanh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => {
                        let stockBadge = <span className="badge-stock badge-stock--in">Còn hàng</span>;
                        if (p.stock === 0) {
                          stockBadge = <span className="badge-stock badge-stock--out">Hết hàng</span>;
                        } else if (p.stock <= 5) {
                          stockBadge = <span className="badge-stock badge-stock--low">Sắp hết ({p.stock})</span>;
                        }

                        return (
                          <tr key={p.id}>
                            <td style={{ cursor: "pointer" }} onClick={() => handleEditProductClick(p)} title="Click để sửa chi tiết">
                              <img src={p.image} alt={p.name} className="admin-prod-thumb" />
                            </td>
                            <td style={{ cursor: "pointer" }} onClick={() => handleEditProductClick(p)} title="Click để sửa chi tiết">
                              <div style={{ fontWeight: "700", color: "#8c6239", textDecoration: "underline" }}>{p.name}</div>
                              <div style={{ fontSize: "12px", color: "#777" }}>{p.brand}</div>
                            </td>
                            <td>{CATEGORIES[p.category] || p.category}</td>
                            <td>
                              {editingPriceId === p.id ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <input
                                    type="number"
                                    value={tempPrice}
                                    onChange={(e) => setTempPrice(e.target.value)}
                                    style={{ width: "90px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #8c6239", fontSize: "13px" }}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (tempPrice && !isNaN(tempPrice) && Number(tempPrice) >= 0) {
                                        updateProduct({ ...p, price: Number(tempPrice) });
                                        setEditingPriceId(null);
                                      } else {
                                        alert("Giá sản phẩm phải là số hợp lệ lớn hơn hoặc bằng 0!");
                                      }
                                    }}
                                    style={{ border: "none", background: "#16a34a", color: "white", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPriceId(null)}
                                    style={{ border: "none", background: "#6b7280", color: "white", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontWeight: "600" }}>{formatPrice(p.price)}</span>
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    title="Chỉnh sửa giá"
                                    onClick={() => {
                                      setEditingPriceId(p.id);
                                      setTempPrice(p.price);
                                    }}
                                    style={{ padding: "2px 6px", fontSize: "12px", opacity: 0.7 }}
                                  >
                                    ✏️
                                  </button>
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="stock-adjuster">
                                <button type="button" className="stock-btn" onClick={() => handleStockChange(p, -1)}>−</button>
                                <span className="stock-val">{p.stock}</span>
                                <button type="button" className="stock-btn" onClick={() => handleStockChange(p, 1)}>+</button>
                              </div>
                            </td>
                            <td>{stockBadge}</td>
                            <td className="actions-cell">
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: "6px 12px", fontSize: "12.5px" }}
                                onClick={() => handleEditProductClick(p)}
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: "6px 12px", fontSize: "12.5px" }}
                                onClick={() => handleStockToggle(p)}
                              >
                                {p.stock === 0 ? "⚡ Nhập kho" : "🚫 Hết hàng"}
                              </button>
                              <button
                                type="button"
                                className="btn-icon btn-icon--delete"
                                title="Xóa sản phẩm"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm ${p.name}?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB MEMBERSHIPS */}
            {activeTab === "members" && (
              <div>
                <div className="admin-content-header">
                  <h2>Quản lý tài khoản & Cấp độ hội viên</h2>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tên khách hàng</th>
                        <th>Email đăng ký</th>
                        <th>Vai trò</th>
                        <th>Cấp độ membership</th>
                        <th>Nâng cấp / Thay đổi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        let badgeClass = "user-badge--free";
                        if (u.membership === "Premium") badgeClass = "user-badge--premium";
                        if (u.membership === "VIP") badgeClass = "user-badge--vip";

                        return (
                          <tr key={u.id}>
                            <td style={{ fontWeight: "700" }}>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                              <span style={{
                                textTransform: "capitalize",
                                color: u.role === "admin" ? "#dc2626" : "#555",
                                fontWeight: u.role === "admin" ? "700" : "normal"
                              }}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span className={`user-badge ${badgeClass}`}>
                                {u.membership}
                              </span>
                            </td>
                            <td>
                              <select
                                className="membership-select"
                                value={u.membership}
                                onChange={(e) => updateUserMembership(u.id, e.target.value)}
                              >
                                <option value="Free">Free Member</option>
                                <option value="Premium">Premium Member</option>
                                <option value="VIP">VIP Member</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB ORDERS */}
            {activeTab === "orders" && (
              <div>
                <div className="admin-content-header">
                  <h2>Quản lý đơn hàng</h2>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày đặt</th>
                        <th>Tổng tiền</th>
                        <th>Hình thức</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                            Chưa có đơn hàng nào được tạo trên hệ thống.
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => {
                          let statusClass = "status--pending";
                          if (o.status === "Đang xử lý") statusClass = "status--processing";
                          if (o.status === "Đã giao") statusClass = "status--shipped";
                          if (o.status === "Đã hủy") statusClass = "status--cancelled";

                          return (
                            <tr key={o.id}>
                              <td style={{ fontWeight: "700", color: "#8c6239" }}>#{o.id}</td>
                              <td>
                                <div style={{ fontWeight: "600" }}>{o.customerName}</div>
                              </td>
                              <td>{o.date}</td>
                              <td style={{ fontWeight: "700" }}>{formatPrice(o.totalPrice)}</td>
                              <td style={{ fontSize: "12.5px" }}>{o.paymentMethod}</td>
                              <td>
                                <span className={`order-status-badge ${statusClass}`}>{o.status}</span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                                    onClick={() => setSelectedOrder(o)}
                                  >
                                    Chi tiết
                                  </button>
                                  <select
                                    className="membership-select"
                                    style={{ padding: "4px 8px", fontSize: "12px" }}
                                    value={o.status}
                                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                  >
                                    <option value="Chờ xử lý">Chờ xử lý</option>
                                    <option value="Đang xử lý">Đang xử lý</option>
                                    <option value="Đã giao">Đã giao</option>
                                    <option value="Đã hủy">Đã hủy</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB REVIEWS */}
            {activeTab === "reviews" && (
              <div>
                <div className="admin-content-header">
                  <h2>Quản lý đánh giá của khách hàng</h2>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Số sao</th>
                        <th>Nội dung nhận xét</th>
                        <th>Thời gian</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reviews || []).length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                            Chưa có đánh giá nào trên hệ thống.
                          </td>
                        </tr>
                      ) : (
                        reviews.map((r) => {
                          const product = products.find((p) => p.id === r.productId);
                          const productName = product ? product.name : r.productId;
                          return (
                            <tr key={r._id}>
                              <td style={{ fontWeight: "600" }}>{r.userName}</td>
                              <td>
                                <div style={{ fontSize: "13px", fontWeight: "500", color: "#666" }}>{productName}</div>
                                <div style={{ fontSize: "11px", color: "#999" }}>ID: {r.productId}</div>
                              </td>
                              <td style={{ color: "#d97706", fontSize: "16px", fontWeight: "700" }}>
                                {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                              </td>
                              <td style={{ maxWidth: "300px", wordBreak: "break-word", fontSize: "13px" }}>
                                “{r.comment}”
                              </td>
                              <td style={{ fontSize: "12.5px" }}>
                                {new Date(r.createdAt).toLocaleString("vi-VN")}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-logout-btn"
                                  style={{ padding: "6px 12px", fontSize: "12.5px" }}
                                  onClick={async () => {
                                    if (window.confirm(`Bạn có chắc chắn muốn xóa đánh giá của khách hàng "${r.userName}"?`)) {
                                      const res = await deleteReview(r._id);
                                      if (res.success) {
                                        alert("Xóa đánh giá thành công!");
                                      } else {
                                        alert(res.message || "Không thể xóa đánh giá.");
                                      }
                                    }
                                  }}
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="admin-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            <div className="admin-modal-body">
              <h3>Thêm sản phẩm mới</h3>
              <form className="admin-form" onSubmit={handleAddProductSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên sản phẩm *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Ultra Hydrating Gel"
                      value={newProductData.name}
                      onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thương hiệu *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: CeraVe"
                      value={newProductData.brand}
                      onChange={(e) => setNewProductData({ ...newProductData, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Danh mục *</label>
                    <select
                      value={newProductData.category}
                      onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })}
                    >
                      {Object.entries(CATEGORIES).map(([key, val]) => (
                        <option key={key} value={key}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Đơn giá (đ) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Ví dụ: 350000"
                      value={newProductData.price}
                      onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số lượng tồn kho ban đầu *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Ví dụ: 50"
                      value={newProductData.stock}
                      onChange={(e) => setNewProductData({ ...newProductData, stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>URL hình ảnh sản phẩm</label>
                    <input
                      type="text"
                      placeholder="Bỏ trống sẽ dùng ảnh mặc định"
                      value={newProductData.image}
                      onChange={(e) => setNewProductData({ ...newProductData, image: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả ngắn</label>
                  <textarea
                    rows="3"
                    placeholder="Mô tả công dụng sản phẩm..."
                    value={newProductData.description}
                    onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Thành phần chính (phân tách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Niacinamide, Vitamin C, Ceramide"
                    value={newProductData.ingredients}
                    onChange={(e) => setNewProductData({ ...newProductData, ingredients: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phù hợp với loại da</label>
                  <div className="checkbox-grid">
                    {Object.entries(SKIN_TYPES).map(([key, val]) => (
                      <label key={key} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProductData.skinTypes.includes(key)}
                          onChange={() => handleCheckboxChange("skinTypes", key)}
                        />
                        {val.emoji} {val.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Hỗ trợ giải quyết vấn đề da</label>
                  <div className="checkbox-grid">
                    {Object.entries(CONCERNS).map(([key, val]) => (
                      <label key={key} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProductData.concerns.includes(key)}
                          onChange={() => handleCheckboxChange("concerns", key)}
                        />
                        {val.emoji} {val.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn-primary">
                    Thêm sản phẩm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="admin-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            <div className="admin-modal-body">
              <h3>Chi tiết đơn hàng #{selectedOrder.id}</h3>
              
              <div style={{ background: "#faf6f0", padding: "16px", borderRadius: "12px", fontSize: "13.5px", marginBottom: "20px" }}>
                <div style={{ marginBottom: "8px" }}><strong>Tên người nhận:</strong> {selectedOrder.customerName}</div>
                <div style={{ marginBottom: "8px" }}><strong>Số điện thoại:</strong> {selectedOrder.phone}</div>
                <div style={{ marginBottom: "8px" }}><strong>Địa chỉ giao nhận:</strong> {selectedOrder.address}</div>
                <div style={{ marginBottom: "8px" }}><strong>Thời gian đặt:</strong> {selectedOrder.date}</div>
                <div><strong>Phương thức thanh toán:</strong> {selectedOrder.paymentMethod}</div>
              </div>

              <div className="order-detail-items">
                <h4 style={{ fontSize: "15px", color: "#8c6239", borderBottom: "1px solid rgba(195, 156, 115, 0.2)", paddingBottom: "8px" }}>
                  Danh sách sản phẩm mua
                </h4>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="order-detail-item">
                    <img src={item.image} alt={item.name} className="order-detail-thumb" />
                    <div className="order-detail-info">
                      <div className="order-detail-name">{item.name}</div>
                      <div className="order-detail-qty">Thương hiệu: {item.brand} | Số lượng: {item.quantity}</div>
                    </div>
                    <div className="order-detail-price">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(195, 156, 115, 0.2)", paddingTop: "16px", marginTop: "16px" }}>
                <span style={{ fontWeight: "700", color: "#555" }}>Tổng tiền thanh toán:</span>
                <span style={{ fontSize: "20px", fontWeight: "800", color: "#8c6239" }}>{formatPrice(selectedOrder.totalPrice)}</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="admin-modal-close" onClick={() => setEditingProduct(null)}>×</button>
            <div className="admin-modal-body">
              <h3>Chỉnh sửa chi tiết sản phẩm</h3>
              <form className="admin-form" onSubmit={handleEditProductSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên sản phẩm *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Ultra Hydrating Gel"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thương hiệu *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: CeraVe"
                      value={editingProduct.brand}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Danh mục *</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    >
                      {Object.entries(CATEGORIES).map(([key, val]) => (
                        <option key={key} value={key}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Đơn giá (đ) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Ví dụ: 350000"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số lượng tồn kho *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Ví dụ: 50"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>URL hình ảnh sản phẩm</label>
                    <input
                      type="text"
                      placeholder="Nhập URL hình ảnh..."
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả ngắn</label>
                  <textarea
                    rows="3"
                    placeholder="Mô tả công dụng sản phẩm..."
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Thành phần chính (phân tách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Niacinamide, Vitamin C, Ceramide"
                    value={editingProduct.ingredients}
                    onChange={(e) => setEditingProduct({ ...editingProduct, ingredients: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phù hợp với loại da</label>
                  <div className="checkbox-grid">
                    {Object.entries(SKIN_TYPES).map(([key, val]) => (
                      <label key={key} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editingProduct.skinTypes.includes(key)}
                          onChange={() => handleEditCheckboxChange("skinTypes", key)}
                        />
                        {val.emoji} {val.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Hỗ trợ giải quyết vấn đề da</label>
                  <div className="checkbox-grid">
                    {Object.entries(CONCERNS).map(([key, val]) => (
                      <label key={key} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editingProduct.concerns.includes(key)}
                          onChange={() => handleEditCheckboxChange("concerns", key)}
                        />
                        {val.emoji} {val.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditingProduct(null)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn-primary">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
