import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Custom page scrollbar — hiển thị thanh cuộn dọc bên phải màn hình
 * giống thanh trong ảnh mẫu: mũi tên ▲ trên cùng, track mờ, thumb tối.
 */
export default function PageScrollbar() {
  const [thumbTop, setThumbTop] = useState(0);       // % vị trí thumb
  const [thumbHeight, setThumbHeight] = useState(20); // % chiều cao thumb
  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef(null);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);

  // ── Tính toán vị trí thumb theo scroll ─────────────────────────────────
  const calcThumb = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const trackH = trackRef.current?.clientHeight || window.innerHeight;

    if (docHeight <= 0) return;

    const ratio = window.innerHeight / document.documentElement.scrollHeight;
    const h = Math.max(ratio * 100, 8); // min 8%
    const top = (scrollTop / docHeight) * (100 - h);

    setThumbHeight(h);
    setThumbTop(top);
    setVisible(scrollTop > 20 || docHeight > 0);
  }, []);

  useEffect(() => {
    calcThumb();
    window.addEventListener("scroll", calcThumb, { passive: true });
    window.addEventListener("resize", calcThumb, { passive: true });
    return () => {
      window.removeEventListener("scroll", calcThumb);
      window.removeEventListener("resize", calcThumb);
    };
  }, [calcThumb]);

  // ── Kéo thumb ──────────────────────────────────────────────────────────
  const handleThumbMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStartY.current = e.clientY;
    dragStartScroll.current = window.scrollY;

    const onMove = (ev) => {
      const trackH = trackRef.current?.clientHeight || window.innerHeight;
      const delta = ev.clientY - dragStartY.current;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDelta = (delta / trackH) * document.documentElement.scrollHeight;
      window.scrollTo({ top: Math.max(0, Math.min(docHeight, dragStartScroll.current + scrollDelta)) });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Click vào track (ngoài thumb) ──────────────────────────────────────
  const handleTrackClick = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains("psb-track-inner")) {
      const trackH = trackRef.current?.clientHeight || window.innerHeight;
      const rect = trackRef.current.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const ratio = clickY / trackH;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: ratio * docHeight, behavior: "smooth" });
    }
  };

  // ── Scroll to top ───────────────────────────────────────────────────────
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const TRACK_RIGHT = "14px";
  const TRACK_TOP = "80px";
  const TRACK_BOTTOM = "20px";

  return (
    <div
      style={{
        position: "fixed",
        right: TRACK_RIGHT,
        top: TRACK_TOP,
        bottom: TRACK_BOTTOM,
        width: "14px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0",
        pointerEvents: "auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* ▲ Mũi tên lên */}
      <button
        onClick={scrollToTop}
        title="Lên đầu trang"
        style={{
          width: "14px",
          height: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: "6px",
          color: "#a0a0a0",
          flexShrink: 0,
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#555")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#a0a0a0")}
      >
        <svg width="10" height="7" viewBox="0 0 10 7" fill="currentColor">
          <path d="M5 0L10 7H0L5 0Z" />
        </svg>
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        className="psb-track-inner"
        onClick={handleTrackClick}
        style={{
          flex: 1,
          width: "3px",
          position: "relative",
          background: "rgba(180,180,180,0.25)",
          borderRadius: "3px",
          cursor: "pointer",
          overflow: "visible",
        }}
      >
        {/* Thumb */}
        <div
          onMouseDown={handleThumbMouseDown}
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: `${thumbTop}%`,
            height: `${thumbHeight}%`,
            width: "5px",
            background: dragging ? "#888" : "#b0b0b0",
            borderRadius: "3px",
            cursor: dragging ? "grabbing" : "grab",
            transition: dragging ? "none" : "top 0.08s linear, background 0.2s ease",
            willChange: "top",
          }}
        />
      </div>
    </div>
  );
}
