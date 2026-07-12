import { useEffect, useState, useRef } from "react";
import "./SplashScreen.css";

const PANEL_COUNT = 4; // 2 tấm trái, 2 tấm phải để cột to ra (mỗi bên rộng 25% màn hình)

export default function SplashScreen({ onFinish, onVideoStart }) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState("counting"); // counting | done | revealing

  const animRef = useRef(null);
  const startTimeRef = useRef(null);

  function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  // Stagger delay 150ms giữa các tấm để tạo nhịp điệu trượt so le chậm rãi và sang trọng
  function getPanelDelay(i) {
    const half = PANEL_COUNT / 2;
    if (i < half) {
      // Trái: i=1 (gần tâm) → 0ms, i=0 (ngoài cùng) → 150ms
      return (half - 1 - i) * 150;
    } else {
      // Phải: i=2 (gần tâm) → 0ms, i=3 (ngoài cùng) → 150ms
      return (i - half) * 150;
    }
  }

  useEffect(() => {
    const DURATION = 2600;

    function animate(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      setCount(Math.floor(easeInOutQuart(progress) * 100));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setCount(100);
        setTimeout(() => setPhase("done"), 100);     // 100% pop
        setTimeout(() => {
          setPhase("revealing");
          if (onVideoStart) onVideoStart(); // Video starts as panels begin to slide open
        }, 300);
        setTimeout(() => onFinish(), 2300); // 300ms delay + 150ms max stagger + 1800ms slide transition = 2250ms (rounded to 2300ms)
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [onFinish]);

  return (
    <>
      {/* NỀN ĐẶC che homepage lúc đầu, mờ dần khi đạt 100% để lộ màn mờ (các cột kính mờ) */}
      <div className={`splash-cover ${phase !== "counting" ? "splash-cover--fade" : ""}`} />

      {/* Các tấm cửa xếp (màn mờ) — chia thành 8 cột kính mờ, trượt dần ra 2 bên */}
      <div className={`splash-panels ${phase === "revealing" ? "splash-panels--open" : ""}`}>
        {Array.from({ length: PANEL_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`splash-panel ${i < PANEL_COUNT / 2 ? "splash-panel--left" : "splash-panel--right"}`}
            style={{ transitionDelay: phase === "revealing" ? `${getPanelDelay(i)}ms` : "0ms" }}
          />
        ))}
      </div>

      {/* Counter — luôn nổi trên cùng */}
      <div className={`splash-counter-wrap ${phase !== "counting" ? "splash-counter-wrap--fade" : ""}`}>
        <button
          type="button"
          className="splash-skip"
          onClick={() => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            setPhase("revealing");
            if (onVideoStart) onVideoStart(); // Video starts immediately on skip
            setTimeout(() => onFinish(), 2100); // 150ms max stagger + 1800ms transition = 1950ms (rounded to 2100ms)
          }}
        >
          Skip
        </button>

        <div className="splash-brand">GlowSkin</div>

        <div className="splash-center">
          <span className={`splash-counter ${phase === "done" ? "splash-counter--pop" : ""}`}>
            {count}<span className="splash-percent">%</span>
          </span>
          <div className="splash-bar">
            <div className="splash-bar-fill" style={{ width: `${count}%` }} />
          </div>
          <span className="splash-loading-text">Loading experience</span>
        </div>

        <div className="splash-bottom">AI · Skincare · Beauty</div>
      </div>
    </>
  );
}
