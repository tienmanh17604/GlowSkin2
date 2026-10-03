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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
      return [];
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
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Global Wishlist/Favorites State — scoped per user
  // Xóa toàn bộ dữ liệu sản phẩm yêu thích cũ theo yêu cầu
  const [wishlist, setWishlist] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("glowskin-wishlist")) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch (e) {
      console.warn("Lỗi dọn dẹp danh sách yêu thích:", e);
    }
    return {};
  });

  const toggleWishlist = (productId) => {
    if (!currentUser) return; // Phải đăng nhập mới lưu được
    const key = `glowskin-wishlist-${currentUser._id || currentUser.id}`;
    setWishlist((prev) => {
      const updated = { ...prev, [productId]: !prev[productId] };
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  };

  // Latest Skin Analysis Scan state — scoped per user account
  const [latestScan, setLatestScan] = useState(() => {
    try {
      const session = localStorage.getItem(USER_SESSION_KEY);
      const user = session ? JSON.parse(session) : null;
      if (!user) return null;
      const userId = user._id || user.id;
      const key = `glowskin-latest-scan-${userId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Skin Diary (Nhật ký chăm sóc da 28 ngày) - Chỉ lưu ảnh chụp thực tế của người dùng
  const DEFAULT_DIARY_ENTRIES = [];

  const [skinDiary, setSkinDiary] = useState(() => {
    try {
      const session = localStorage.getItem(USER_SESSION_KEY);
      const user = session ? JSON.parse(session) : null;
      const userId = user ? (user._id || user.id) : "guest";
      const key = `glowskin-skin-diary-${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned = parsed
          .map((item) => {
            let photo = item.photo;
            if (photo && (photo.includes("images.unsplash.com") || photo.includes("sample_acne_analysis_face"))) {
              photo = null;
            }
            let notes = item.notes;
            if (Array.isArray(notes)) {
              notes = notes.map((s) => (typeof s === "string" ? s : s?.title || "")).filter(Boolean).join(" • ");
            } else if (typeof notes === "object" && notes !== null) {
              notes = notes.title || notes.overview || "Ảnh chụp phân tích da AI Vision";
            }
            let score = item.score;
            if (typeof score === "object" && score !== null) {
              score = score.averageScore || score.score || 7.0;
            } else if (typeof score === "number" && score > 10) {
              score = +(score / 10).toFixed(1);
            }
            return { ...item, photo, notes, score };
          })
          .filter((item) => item.dateKey !== "2026-10-02" || item.photo);
        return cleaned;
      }
      return DEFAULT_DIARY_ENTRIES;
    } catch {
      return DEFAULT_DIARY_ENTRIES;
    }
  });

  const saveDiaryEntry = (entry) => {
    setSkinDiary((prev) => {
      // Đảm bảo chỉ có 1 bản ghi duy nhất cho mỗi ngày:
      // Nếu ngày đó chụp/tải ảnh nhiều lần, lần chụp cuối cùng sẽ ghi đè lên ảnh ngày hôm đó
      const filtered = prev.filter((item) => item.dateKey !== entry.dateKey);
      let next;
      if (entry.photo === null && !entry.notes && !entry.routineDone) {
        next = filtered;
      } else {
        const updatedEntry = {
          ...entry,
          updatedAt: new Date().toISOString()
        };
        next = [updatedEntry, ...filtered];
      }
      try {
        const session = localStorage.getItem(USER_SESSION_KEY);
        const user = session ? JSON.parse(session) : currentUser;
        const userId = user ? (user._id || user.id) : "guest";
        localStorage.setItem(`glowskin-skin-diary-${userId}`, JSON.stringify(next));
      } catch (e) {
        console.warn("Lỗi lưu skin diary local:", e);
      }
      return next;
    });
  };

  const toggleDiaryRoutine = (dateKey) => {
    setSkinDiary((prev) => {
      const next = prev.map((item) => {
        if (item.dateKey === dateKey) {
          return { ...item, routineDone: !item.routineDone };
        }
        return item;
      });
      try {
        const userId = currentUser ? (currentUser._id || currentUser.id) : "guest";
        localStorage.setItem(`glowskin-skin-diary-${userId}`, JSON.stringify(next));
      } catch (e) {
        console.warn("Lỗi cập nhật routine skin diary:", e);
      }
      return next;
    });
  };

  const saveLatestScan = async (scanData) => {
    setLatestScan(scanData);

    // Tự động đồng bộ ảnh vừa chụp vào Nhật ký ngày hôm nay
    // Nếu trong ngày chụp nhiều lần, luôn ghi nhận và lưu lại lần chụp cuối cùng
    if (scanData?.image) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      const displayDate = `${day}/${month}/${year}`;

      const cycleStart = new Date(2026, 9, 2);
      const todayDate = new Date(year, now.getMonth(), now.getDate());
      const diffDays = Math.floor((todayDate - cycleStart) / (1000 * 60 * 60 * 24)) + 1;
      const dayIndex = diffDays > 0 ? diffDays : 1;

      let notesText = "Ảnh chụp phân tích da AI Vision";
      if (typeof scanData.summary === "string" && scanData.summary) {
        notesText = scanData.summary;
      } else if (Array.isArray(scanData.summary)) {
        notesText = scanData.summary.map((s) => (typeof s === "string" ? s : s?.title || "")).filter(Boolean).join(" • ");
      } else if (scanData.overview && typeof scanData.overview === "string") {
        notesText = scanData.overview.slice(0, 100) + "...";
      }

      let scoreVal = 7.0;
      if (typeof scanData.averageScore === "number") {
        scoreVal = scanData.averageScore;
      } else if (typeof scanData.score === "number") {
        scoreVal = scanData.score > 10 ? +(scanData.score / 10).toFixed(1) : scanData.score;
      }

      saveDiaryEntry({
        dateKey,
        displayDate,
        dayIndex,
        photo: scanData.image, // Ghi đè bằng ảnh lần quét cuối cùng trong ngày
        facePhoto: scanData.image,
        score: scoreVal,
        notes: notesText,
        routineDone: true,
        hasGift: false,
        lastCapturedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        updatedAt: new Date().toISOString()
      });
    }

    const session = localStorage.getItem(USER_SESSION_KEY);
    const user = session ? JSON.parse(session) : currentUser;
    const userId = user ? (user._id || user.id) : "guest";
    const key = `glowskin-latest-scan-${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(scanData));
    } catch (e) {
      console.error("Lỗi lưu scan local:", e);
    }

    if (user && user._id) {
      // Sync scan data with backend MongoDB API
      try {
        await fetch(`${API_URL}/users/${user._id}/latest-scan`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latestScan: scanData }),
        });
      } catch (e) {
        console.warn("Lỗi lưu scan lên backend server:", e);
      }
    }
  };

  const clearWishlist = () => {
    setWishlist({});
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("glowskin-wishlist")) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch (e) {
      console.warn("Lỗi dọn dẹp wishlist:", e);
    }
  };

  // Fetch initial data from MongoDB API on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      let success = false;
      let retries = 0;
      const maxRetries = 10; // Try up to 10 times (30 seconds total) for server to wake up

      while (!success && retries < maxRetries) {
        try {
          const prodRes = await fetch(`${API_URL}/products`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            if (prodData && prodData.length > 0) {
              setProducts(prodData);
              success = true;
            }
          }
        } catch (err) {
          console.error(`Lỗi tải sản phẩm (Lần thử ${retries + 1}):`, err);
        }

        if (!success) {
          retries++;
          // Wait 3 seconds before next retry
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
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

  // Sync scan & wishlist state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
      const userId = currentUser._id || currentUser.id;

      // Fetch user-specific scan from MongoDB server, fallback to local storage
      const fetchUserScan = async () => {
        try {
          const res = await fetch(`${API_URL}/users/${userId}/latest-scan`);
          if (res.ok) {
            const data = await res.json();
            if (data.latestScan) {
              setLatestScan(data.latestScan);
              return;
            }
          }
        } catch (e) {
          console.warn("Lỗi fetch scan từ server:", e);
        }

        try {
          const scanKey = `glowskin-latest-scan-${userId}`;
          const savedScan = localStorage.getItem(scanKey);
          setLatestScan(savedScan ? JSON.parse(savedScan) : null);
        } catch {
          setLatestScan(null);
        }
      };

      fetchUserScan();

      // Load user-specific wishlist
      try {
        const wishKey = `glowskin-wishlist-${userId}`;
        const savedWish = localStorage.getItem(wishKey);
        setWishlist(savedWish ? JSON.parse(savedWish) : {});
      } catch {
        setWishlist({});
      }
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
      setLatestScan(null);
      setWishlist({});
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
        const userId = data.user._id || data.user.id;
        
        // Load user scan & wishlist
        try {
          const scanKey = `glowskin-latest-scan-${userId}`;
          const savedScan = localStorage.getItem(scanKey);
          setLatestScan(savedScan ? JSON.parse(savedScan) : null);
        } catch {
          setLatestScan(null);
        }

        try {
          const wishKey = `glowskin-wishlist-${userId}`;
          const savedWish = localStorage.getItem(wishKey);
          setWishlist(savedWish ? JSON.parse(savedWish) : {});
        } catch {
          setWishlist({});
        }

        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || "Email hoặc mật khẩu không chính xác!" };
    } catch (err) {
      console.error("Lỗi đăng nhập backend:", err);
      return { success: false, message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng của bạn!" };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setLatestScan(null);
    setWishlist({});
    setIsNameModalOpen(false);
    localStorage.removeItem(USER_SESSION_KEY);
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("glowskin_name_prompt_dismissed_")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {}
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
      console.error("Lỗi đăng ký backend:", err);
      return { success: false, message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng của bạn!" };
    }
  };

  const updateProfile = async (id, name, email, phone, addresses, preferredName, extraFields = {}) => {
    try {
      const cleanPreferred = preferredName !== undefined ? preferredName.trim() : (currentUser?.preferredName || "");
      const payload = {
        name,
        email,
        phone,
        addresses,
        preferredName: cleanPreferred,
        ...extraFields,
      };
      const res = await fetch(`${API_URL}/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const mergedUser = { ...currentUser, ...data.user, preferredName: cleanPreferred, ...extraFields };
        setCurrentUser(mergedUser);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(mergedUser));
        setUsers((prev) => prev.map((u) => (u.id === id || u._id === id ? mergedUser : u)));
        return { success: true, user: mergedUser };
      }
      return { success: false, message: data.message || "Lỗi khi cập nhật thông tin!" };
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      const cleanPreferred = preferredName !== undefined ? preferredName.trim() : (currentUser?.preferredName || "");
      const updated = { ...currentUser, name, email, phone, addresses, preferredName: cleanPreferred, ...extraFields };
      setCurrentUser(updated);
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updated));
      setUsers((prev) => prev.map((u) => (u.id === id || u._id === id ? updated : u)));
      return { success: true, user: updated };
    }
  };

  const updatePreferredName = async (preferredName) => {
    if (!currentUser) return { success: false, message: "Chưa đăng nhập!" };
    const cleanName = preferredName?.trim() || "";
    if (!cleanName) return { success: false, message: "Tên không được để trống!" };

    const id = currentUser.id || currentUser._id || currentUser.email;

    // 1. Immediately update local state & localStorage (instant synchronous guarantee!)
    const updated = {
      ...currentUser,
      preferredName: cleanName,
    };
    setCurrentUser(updated);

    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Lỗi lưu session:", e);
    }

    // Also update in users array
    setUsers((prev) =>
      prev.map((u) => {
        if ((id && (u.id === id || u._id === id)) || (currentUser.email && u.email === currentUser.email)) {
          return { ...u, preferredName: cleanName };
        }
        return u;
      })
    );

    try {
      const savedUsers = localStorage.getItem(USERS_KEY);
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        const updatedUsers = parsed.map((u) => {
          if ((id && (u.id === id || u._id === id)) || (currentUser.email && u.email === currentUser.email)) {
            return { ...u, preferredName: cleanName };
          }
          return u;
        });
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      }
    } catch (e) {
      console.error("Lỗi cập nhật danh sách users:", e);
    }

    // 2. Synchronize to backend API
    try {
      const targetId = encodeURIComponent(id || currentUser.email);
      const res = await fetch(`${API_URL}/users/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredName: cleanName,
          email: currentUser.email,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.user) {
          const finalMerged = { ...currentUser, ...data.user, preferredName: cleanName };
          setCurrentUser(finalMerged);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(finalMerged));
          return { success: true, user: finalMerged };
        }
      }
    } catch (err) {
      console.warn("Backend sync note:", err.message);
    }

    return { success: true, user: updated };
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
        ? productData.ingredients.split("\n").map(i => i.trim()).filter(Boolean)
        : productData.ingredients || [],
      image: productData.image,
      hoverImage: productData.hoverImage || "",
      images: productData.images || [],
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
      prev.map((u) => (u.id === userId ? { ...u, membership: newMembership } : u))
    );

    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, membership: newMembership } : null));
    }

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
      if (method === "payos") return "PayOS";
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

  const deleteUser = async (userId) => {
    if (!userId) {
      return { success: false, message: "ID người dùng không hợp lệ" };
    }

    const adminId = currentUser ? (currentUser._id || currentUser.id) : null;
    if (adminId && String(adminId) === String(userId)) {
      return { success: false, message: "Không thể tự xóa tài khoản Admin đang đăng nhập!" };
    }

    // Optimistic UI update for state and localStorage fallback
    setUsers((prev) => {
      const updated = prev.filter((u) => String(u._id || u.id) !== String(userId) && String(u.id) !== String(userId));
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Lỗi cập nhật localStorage:", e);
      }
      return updated;
    });

    try {
      const res = await fetch(`${API_URL}/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return { success: true, message: data.message || "Đã xóa người dùng khỏi cơ sở dữ liệu MongoDB" };
      }
      return { success: false, message: data.message || "Không thể xóa tài khoản khỏi cơ sở dữ liệu MongoDB" };
    } catch (err) {
      console.error("Lỗi khi xóa người dùng ở backend:", err);
      return { success: true, message: "Đã xóa khỏi danh sách địa phương" };
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
      isNameModalOpen,
      setIsNameModalOpen,
      isWishlistOpen,
      setIsWishlistOpen,
      login,
      logout,
      register,
      addProduct,
      updateProduct,
      deleteProduct,
      updateUserMembership,
      deleteUser,
      updateOrderStatus,
      placeOrder,
      addReview,
      deleteReview,
      wishlist,
      toggleWishlist,
      clearWishlist,
      updateProfile,
      updatePreferredName,
      latestScan,
      saveLatestScan,
      skinDiary,
      saveDiaryEntry,
      toggleDiaryRoutine,
    }),
    [users, products, orders, reviews, currentUser, isLoginOpen, isNameModalOpen, isWishlistOpen, wishlist, latestScan, skinDiary]
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
