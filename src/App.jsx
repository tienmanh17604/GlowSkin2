import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SkinAnalysis from "./pages/SkinAnalysis";
import Products from "./pages/Products";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<SkinAnalysis />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </BrowserRouter>
  );
}
