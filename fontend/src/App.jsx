import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import { AppProvider, useApp } from "./context/AppContext";
import Home from "./pages/Home";
import SkinAnalysis from "./pages/SkinAnalysis";
import Products from "./pages/Products";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetail from "./pages/ProductDetail";
import CartDrawer from "./components/CartDrawer";
import LoginModal from "./components/LoginModal";

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
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<SkinAnalysis />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<CartRedirect />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        <CartDrawer />
        <LoginModal />
      </BrowserRouter>
    </CartProvider>
  );
}
