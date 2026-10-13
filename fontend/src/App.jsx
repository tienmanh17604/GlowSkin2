import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import { AppProvider, useApp } from "./context/AppContext";
import Home from "./pages/Home";
import SkinAnalysis from "./pages/SkinAnalysis";
import Products from "./pages/Products";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetail from "./pages/ProductDetail";
import CartDrawer from "./components/CartDrawer";
import WishlistDrawer from "./components/WishlistDrawer";
import LoginModal from "./components/LoginModal";
import WelcomeNameModal from "./components/WelcomeNameModal";
import UpgradeModal from "./components/UpgradeModal";
import ChatWidget from "./components/ChatWidget";
import SplashScreen from "./components/SplashScreen";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import YourSkin from "./pages/YourSkin";
import SkinDiary from "./pages/SkinDiary";

function CartRedirect() {
  const { setIsCartOpen } = useCart();
  useEffect(() => {
    setIsCartOpen(true);
  }, [setIsCartOpen]);
  return <Navigate to="/" replace />;
}

function LoginRedirect() {
  const { setIsLoginOpen } = useApp();
  useEffect(() => {
    setIsLoginOpen(true);
  }, [setIsLoginOpen]);
  return <Navigate to="/" replace />;
}

function AnalyzeRedirect() {
  const location = useLocation();
  return <Navigate to={`/your-skin${location.search}`} replace />;
}

function GlobalPaymentReturnHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUserMembership, currentUser } = useApp();

  useEffect(() => {
    const paymentStatus = searchParams.get("paymentStatus");
    const status = searchParams.get("status");
    const code = searchParams.get("code");
    const orderCode = searchParams.get("orderCode");
    const membership = searchParams.get("membership") || "Premium";
    const userId = searchParams.get("userId") || currentUser?.id || currentUser?._id;

    // PayOS trả về paymentStatus=success HOẶC status=PAID HOẶC code=00
    const isSuccess = paymentStatus === "success" || status === "PAID" || code === "00";

    if (isSuccess && orderCode) {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      fetch(`${API_URL}/payments/verify-membership-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode,
          userId,
          membership,
          userName: currentUser?.name || currentUser?.preferredName || "",
          userEmail: currentUser?.email || ""
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.membership) {
            updateUserMembership(userId, data.membership);
          }
        })
        .catch(console.error);

      if (userId && membership) {
        updateUserMembership(userId, membership);
      }

      alert(`🎉 Chúc mừng bạn đã thanh toán nâng cấp thành công gói ${membership}! Hệ thống đã kích hoạt toàn bộ tính năng cao cấp.`);

      searchParams.delete("paymentStatus");
      searchParams.delete("status");
      searchParams.delete("code");
      searchParams.delete("orderCode");
      searchParams.delete("membership");
      searchParams.delete("userId");
      searchParams.delete("cancel");
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, updateUserMembership, currentUser]);

  return null;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("hasSeenSplash");
  });
  const [videoReady, setVideoReady] = useState(() => {
    return !!sessionStorage.getItem("hasSeenSplash");
  });

  const handleSplashFinish = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  }, []);

  const handleVideoStart = useCallback(() => {
    setVideoReady(true);
  }, []);

  return (
    <CartProvider>
      {showSplash && (
        <SplashScreen
          onFinish={handleSplashFinish}
          onVideoStart={handleVideoStart}
        />
      )}
      <BrowserRouter>
        <GlobalPaymentReturnHandler />
        <Routes>
          <Route path="/" element={<Home videoReady={videoReady} />} />
          <Route path="/your-skin" element={<YourSkin />} />
          <Route path="/analyze" element={<AnalyzeRedirect />} />
          <Route path="/products" element={<Navigate to="/" replace />} />
          <Route path="/products/:productId" element={<Navigate to="/" replace />} />
          <Route path="/cart" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/diary" element={<SkinDiary />} />
          <Route path="/nhat-ky" element={<Navigate to="/diary" replace />} />
        </Routes>
        <WishlistDrawer />
        <LoginModal />
        <WelcomeNameModal />
        <UpgradeModal />
        {!showSplash && <ChatWidget />}
      </BrowserRouter>
    </CartProvider>
  );
}
