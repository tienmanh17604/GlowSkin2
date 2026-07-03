import { createContext, useContext, useEffect, useState, useMemo } from "react";

const AppContext = createContext(null);

const USERS_KEY = "glowskin-users";
const PRODUCTS_KEY = "glowskin-products";
const ORDERS_KEY = "glowskin-orders";
const REVIEWS_KEY = "glowskin-reviews";
const USER_SESSION_KEY = "glowskin-currentuser";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AppProvider({ children }) {
  // Users state
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Products state (with stock)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders state
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reviews state
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current session user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Global Wishlist/Favorites State
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("glowskin-wishlist");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const updated = { ...prev, [productId]: !prev[productId] };
      localStorage.setItem("glowskin-wishlist", JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch initial data from MongoDB API on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const prodRes = await fetch(`${API_URL}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData) {
            setProducts(prodData);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách sản phẩm từ backend:", err);
      }

      try {
        const userRes = await fetch(`${API_URL}/users`);
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData) {
            setUsers(userData);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách người dùng từ backend:", err);
      }

      try {
        const orderRes = await fetch(`${API_URL}/orders`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrders(orderData);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách đơn hàng từ backend:", err);
      }

      try {
        const revRes = await fetch(`${API_URL}/reviews`);
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách đánh giá từ backend:", err);
      }
    };

    fetchInitialData();
  }, []);

  // Sync state to localStorage (as backup/fallback)
  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
    }
  }, [currentUser]);

  // Auth actions
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || "Email hoặc mật khẩu không chính xác!" };
    } catch (err) {
      console.error("Lỗi đăng nhập backend, đang kiểm tra local:", err);
      // Fallback to local state if backend is down
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (user) {
        setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, message: "Email hoặc mật khẩu không chính xác!" };
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => [...prev, data.user]);
        setCurrentUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || "Email này đã được đăng ký!" };
    } catch (err) {
      console.error("Lỗi đăng ký backend, đang lưu local:", err);
      // Fallback to local state
      const exists = users.some(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        return { success: false, message: "Email này đã được đăng ký!" };
      }
      const newUser = {
        id: "u_" + Date.now(),
        name,
        email,
        password,
        role: "user",
        membership: "Free",
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      return { success: true, user: newUser };
    }
  };

  // Product management actions
  const addProduct = async (productData) => {
    const tempId = "p_" + Date.now();
    const newProduct = {
      id: tempId,
      name: productData.name,
      brand: productData.brand,
      category: productData.category,
      price: Number(productData.price),
      stock: Number(productData.stock),
      skinTypes: productData.skinTypes || [],
      concerns: productData.concerns || [],
      ingredients: typeof productData.ingredients === "string" 
        ? productData.ingredients.split(",").map(i => i.trim()).filter(Boolean)
        : productData.ingredients || [],
      image: productData.image,
      hoverImage: productData.hoverImage,
      description: productData.description,
    };
    
    // Optimistic UI update
    setProducts((prev) => [newProduct, ...prev]);

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      if (res.ok) {
        const savedProduct = await res.json();
        // Replace temp product with saved one
        setProducts((prev) => prev.map((p) => (p.id === tempId ? savedProduct : p)));
      }
    } catch (err) {
      console.error("Lỗi khi thêm sản phẩm vào backend:", err);
    }
  };

  const updateProduct = async (updatedProduct) => {
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );

    try {
      await fetch(`${API_URL}/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật sản phẩm ở backend:", err);
    }
  };

  const deleteProduct = async (id) => {
    // Optimistic UI update
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Lỗi khi xóa sản phẩm ở backend:", err);
    }
  };

  // User & Membership management
  const updateUserMembership = async (userId, newMembership) => {
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, membership: newMembership };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    try {
      await fetch(`${API_URL}/users/${userId}/membership`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membership: newMembership }),
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật hạng thành viên ở backend:", err);
    }
  };

  // Order & Inventory actions
  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng ở backend:", err);
    }
  };

  const placeOrder = (formData, cartItems, totalPrice, overrideStatus = "Chờ xử lý") => {
    const code = "GS" + Math.floor(100000 + Math.random() * 900000);
    const getPaymentMethodLabel = (method) => {
      if (method === "cod") return "COD";
      if (method === "momo") return "Ví MoMo";
      if (method === "vnpay") return "Ví VNPay";
      return "Chuyển khoản QR";
    };

    const newOrder = {
      id: code,
      customerName: formData.name,
      phone: formData.phone,
      address: formData.address,
      paymentMethod: getPaymentMethodLabel(formData.payment),
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      totalPrice,
      status: overrideStatus,
      date: new Date().toLocaleString("vi-VN"),
    };

    // Add to orders list
    setOrders((prev) => [newOrder, ...prev]);

    // Decrement inventory stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cartItems.find((item) => item.id === p.id);
        if (cartItem) {
          const newStock = Math.max(0, p.stock - cartItem.quantity);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    // Call API in background
    fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData, cartItems, totalPrice, overrideStatus }),
    }).catch((err) => {
      console.error("Lỗi khi gửi đơn hàng tới backend:", err);
    });

    return code;
  };

  const addReview = async (productId, userName, rating, comment) => {
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, userName, rating: Number(rating), comment }),
      });
      if (res.ok) {
        const savedReview = await res.json();
        setReviews((prev) => [savedReview, ...prev]);

        // Refetch products to get updated rating and review count from backend
        const prodRes = await fetch(`${API_URL}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }
        return { success: true, review: savedReview };
      }
      const errorData = await res.json().catch(() => ({}));
      return { success: false, message: errorData.message || "Không thể gửi đánh giá" };
    } catch (err) {
      console.error("Lỗi khi thêm đánh giá:", err);
      return { success: false, message: "Lỗi kết nối server" };
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));

        // Refetch products to get updated rating and review count from backend
        const prodRes = await fetch(`${API_URL}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }
        return { success: true };
      }
      const errorData = await res.json().catch(() => ({}));
      return { success: false, message: errorData.message || "Không thể xóa đánh giá" };
    } catch (err) {
      console.error("Lỗi khi xóa đánh giá:", err);
      return { success: false, message: "Lỗi kết nối server" };
    }
  };

  const value = useMemo(
    () => ({
      users,
      products,
      orders,
      reviews,
      currentUser,
      isLoginOpen,
      setIsLoginOpen,
      login,
      logout,
      register,
      addProduct,
      updateProduct,
      deleteProduct,
      updateUserMembership,
      updateOrderStatus,
      placeOrder,
      addReview,
      deleteReview,
      wishlist,
      toggleWishlist,
    }),
    [users, products, orders, reviews, currentUser, isLoginOpen, wishlist]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
