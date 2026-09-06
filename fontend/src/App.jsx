import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ChatWidget from "./components/ChatWidget";
import SplashScreen from "./components/SplashScreen";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import YourSkin from "./pages/YourSkin";

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
        <Routes>
          <Route path="/" element={<Home videoReady={videoReady} />} />
          <Route path="/your-skin" element={<YourSkin />} />
          <Route path="/analyze" element={<SkinAnalysis />} />
          <Route path="/products" element={<Navigate to="/" replace />} />
          <Route path="/products/:productId" element={<Navigate to="/" replace />} />
          <Route path="/cart" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <WishlistDrawer />
        <LoginModal />
        {!showSplash && <ChatWidget />}
      </BrowserRouter>
    </CartProvider>
  );
}
