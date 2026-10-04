import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useApp } from "../context/AppContext";
import "./SkinDiary.css";

// 28-day cycle calendar cells (from Monday 28/09/2026 to Sunday 25/10/2026)
const CALENDAR_DAYS_CONFIG = [
  // Week 1: 28/9 - 4/10
  { date: 28, month: 9, year: 2026, dateKey: "2026-09-28", type: "pre-cycle" },
  { date: 29, month: 9, year: 2026, dateKey: "2026-09-29", type: "pre-cycle" },
  { date: 30, month: 9, year: 2026, dateKey: "2026-09-30", type: "pre-cycle" },
  { date: 1,  month: 10, year: 2026, dateKey: "2026-10-01", type: "pre-cycle" },
  { 
    date: 2, 
    month: 10, 
    year: 2026, 
    dateKey: "2026-10-02", 
    type: "cycle-day", 
    dayIndex: 1, 
    hasGift: true 
  },
  { date: 3,  month: 10, year: 2026, dateKey: "2026-10-03", type: "today", dayIndex: 2 },
  { date: 4,  month: 10, year: 2026, dateKey: "2026-10-04", type: "future", dayIndex: 3, hasGift: true },

  // Week 2: 5/10 - 11/10
  { date: 5,  month: 10, year: 2026, dateKey: "2026-10-05", type: "future", dayIndex: 4 },
  { date: 6,  month: 10, year: 2026, dateKey: "2026-10-06", type: "future", dayIndex: 5 },
  { date: 7,  month: 10, year: 2026, dateKey: "2026-10-07", type: "future", dayIndex: 6 },
  { date: 8,  month: 10, year: 2026, dateKey: "2026-10-08", type: "future", dayIndex: 7, hasGift: true },
  { date: 9,  month: 10, year: 2026, dateKey: "2026-10-09", type: "future", dayIndex: 8 },
  { date: 10, month: 10, year: 2026, dateKey: "2026-10-10", type: "future", dayIndex: 9 },
  { date: 11, month: 10, year: 2026, dateKey: "2026-10-11", type: "future", dayIndex: 10 },

  // Week 3: 12/10 - 18/10
  { date: 12, month: 10, year: 2026, dateKey: "2026-10-12", type: "future", dayIndex: 11 },
  { date: 13, month: 10, year: 2026, dateKey: "2026-10-13", type: "future", dayIndex: 12 },
  { date: 14, month: 10, year: 2026, dateKey: "2026-10-14", type: "future", dayIndex: 13 },
  { date: 15, month: 10, year: 2026, dateKey: "2026-10-15", type: "future", dayIndex: 14, hasGift: true },
  { date: 16, month: 10, year: 2026, dateKey: "2026-10-16", type: "future", dayIndex: 15 },
  { date: 17, month: 10, year: 2026, dateKey: "2026-10-17", type: "future", dayIndex: 16 },
  { date: 18, month: 10, year: 2026, dateKey: "2026-10-18", type: "future", dayIndex: 17 },

  // Week 4: 19/10 - 25/10
  { date: 19, month: 10, year: 2026, dateKey: "2026-10-19", type: "future", dayIndex: 18 },
  { date: 20, month: 10, year: 2026, dateKey: "2026-10-20", type: "future", dayIndex: 19 },
  { date: 21, month: 10, year: 2026, dateKey: "2026-10-21", type: "future", dayIndex: 20 },
  { date: 22, month: 10, year: 2026, dateKey: "2026-10-22", type: "future", dayIndex: 21, hasGift: true },
  { date: 23, month: 10, year: 2026, dateKey: "2026-10-23", type: "future", dayIndex: 22 },
  { date: 24, month: 10, year: 2026, dateKey: "2026-10-24", type: "future", dayIndex: 23 },
  { date: 25, month: 10, year: 2026, dateKey: "2026-10-25", type: "future", dayIndex: 24 },
];

const MOOD_TYPES = [
  { id: "tuyet_voi", label: "Tuyệt vời" },
  { id: "vui_ve", label: "Vui vẻ" },
  { id: "binh_thuong", label: "Bình thường" },
  { id: "khong_vui", label: "Không vui" },
  { id: "te_qua", label: "Tệ quá" }
];

function render3DMoodSphere(type, size = 52) {
  if (type === "tuyet_voi") {
    return (
      <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: "block" }}>
        <defs>
          <radialGradient id={`g-tv-${size}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="30%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
        </defs>
        <circle cx="30" cy="30" r="26" fill={`url(#g-tv-${size})`} />
        <ellipse cx="22" cy="18" rx="8" ry="4" fill="rgba(255,255,255,0.6)" transform="rotate(-30 22 18)" />
        <path d="M19 26 C21 23, 25 23, 27 26" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M33 26 C35 23, 39 23, 41 26" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 34 Q30 43 38 34" fill="#78350f" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "vui_ve") {
    return (
      <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: "block" }}>
        <defs>
          <radialGradient id={`g-vv-${size}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="30%" stopColor="#f472b6" />
            <stop offset="70%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#be185d" />
          </radialGradient>
        </defs>
        <circle cx="30" cy="30" r="26" fill={`url(#g-vv-${size})`} />
        <ellipse cx="22" cy="18" rx="8" ry="4" fill="rgba(255,255,255,0.6)" transform="rotate(-30 22 18)" />
        <path d="M19 27 C21 24, 25 24, 27 27" fill="none" stroke="#831843" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M33 27 C35 24, 39 24, 41 27" fill="none" stroke="#831843" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 35 Q30 40 36 35" fill="none" stroke="#831843" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="17" cy="32" r="3" fill="rgba(251,113,133,0.6)" />
        <circle cx="43" cy="32" r="3" fill="rgba(251,113,133,0.6)" />
      </svg>
    );
  }
  if (type === "binh_thuong") {
    return (
      <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: "block" }}>
        <defs>
          <radialGradient id={`g-bt-${size}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="30%" stopColor="#6ee7b7" />
            <stop offset="70%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
        </defs>
        <circle cx="30" cy="30" r="26" fill={`url(#g-bt-${size})`} />
        <ellipse cx="22" cy="18" rx="8" ry="4" fill="rgba(255,255,255,0.6)" transform="rotate(-30 22 18)" />
        <line x1="19" y1="27" x2="27" y2="27" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="33" y1="27" x2="41" y2="27" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="25" y1="36" x2="35" y2="36" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "khong_vui") {
    return (
      <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: "block" }}>
        <defs>
          <radialGradient id={`g-kv-${size}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="30%" stopColor="#93c5fd" />
            <stop offset="70%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
        </defs>
        <circle cx="30" cy="30" r="26" fill={`url(#g-kv-${size})`} />
        <ellipse cx="22" cy="18" rx="8" ry="4" fill="rgba(255,255,255,0.6)" transform="rotate(-30 22 18)" />
        <circle cx="23" cy="27" r="2.5" fill="#1e3a8a" />
        <circle cx="37" cy="27" r="2.5" fill="#1e3a8a" />
        <path d="M21 31 Q20 35 22 36 Q24 35 23 31 Z" fill="#67e8f9" />
        <path d="M24 38 Q30 33 36 38" fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`g-tq-${size}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#faf5ff" />
          <stop offset="30%" stopColor="#c084fc" />
          <stop offset="70%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#6b21a8" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="26" fill={`url(#g-tq-${size})`} />
      <ellipse cx="22" cy="18" rx="8" ry="4" fill="rgba(255,255,255,0.6)" transform="rotate(-30 22 18)" />
      <line x1="18" y1="21" x2="27" y2="25" stroke="#3b0764" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="21" x2="33" y2="25" stroke="#3b0764" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="23" cy="28" r="2.5" fill="#3b0764" />
      <circle cx="37" cy="28" r="2.5" fill="#3b0764" />
      <path d="M24 38 Q30 33 36 38" fill="none" stroke="#3b0764" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export default function SkinDiary() {
  const navigate = useNavigate();
  const {
    skinDiary = [],
    saveDiaryEntry,
    toggleDiaryRoutine,
    latestScan,
    currentUser,
    setIsNameModalOpen
  } = useApp();

  // Top view tab: "diary" (Nhật ký da) | "mood_jar" (Hũ tâm trạng)
  const [activeTab, setActiveTab] = useState("diary");

  // Routine AM/PM toggle: "morning" (Buổi sáng) | "evening" (Buổi tối)
  const [routineTime, setRoutineTime] = useState("morning");
  const [routineCompleted, setRoutineCompleted] = useState(true);

  // Selected Day Details Modal
  const [selectedDay, setSelectedDay] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [activeGiftContent, setActiveGiftContent] = useState("");

  // Toast message
  const [toastMsg, setToastMsg] = useState("");
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2600);
  };

  // Image Upload File Input ref
  const fileInputRef = useRef(null);

  // Mood Jar State
  const [droppedMoods, setDroppedMoods] = useState(() => {
    try {
      const saved = localStorage.getItem("glowskin_mood_jar_entries");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDropMood = (moodType, label) => {
    const newEntry = {
      id: Date.now() + Math.random(),
      type: moodType,
      timestamp: new Date().toISOString()
    };
    setDroppedMoods((prev) => {
      const updated = [...prev, newEntry];
      try {
        localStorage.setItem("glowskin_mood_jar_entries", JSON.stringify(updated));
      } catch (e) {
        console.warn("Lỗi lưu mood jar:", e);
      }
      return updated;
    });
    showToast(`Đã thả cảm xúc "${label}" vào hũ! ✨`);
  };

  const moodCounts = useMemo(() => {
    const counts = { tuyet_voi: 0, vui_ve: 0, binh_thuong: 0, khong_vui: 0, te_qua: 0 };
    for (const m of droppedMoods) {
      if (counts[m.type] !== undefined) counts[m.type]++;
    }
    return counts;
  }, [droppedMoods]);

  // Build merged calendar entries with user scan photos
  // Quy tắc: Chỉ ngày nào người dùng thực sự chụp thì mới hiển thị ảnh.
  // Nếu ngày hôm đó chụp nhiều lần, luôn ghi nhận và hiển thị ảnh lần chụp cuối cùng!
  const calendarItems = useMemo(() => {
    return CALENDAR_DAYS_CONFIG.map((day) => {
      // Tìm bản ghi nhật ký của ngày này
      const diaryRecord = skinDiary.find((d) => d.dateKey === day.dateKey);

      let photoUrl = diaryRecord?.photo || null;

      // Nếu là ngày hôm nay và người dùng vừa quét AI, luôn đồng bộ ảnh lần quét mới nhất (lần cuối cùng)
      if (day.type === "today" && latestScan?.image) {
        photoUrl = latestScan.image;
      }

      // Tuyệt đối không hiển thị ảnh mẫu mock/unsplash (chỉ ảnh thật người dùng chụp)
      if (photoUrl && (photoUrl.includes("images.unsplash.com") || photoUrl.includes("sample_acne_analysis_face"))) {
        photoUrl = null;
      }

      // Chuẩn hóa điểm số và ghi chú để tránh lỗi React Object-as-child crash
      let rawScore = diaryRecord?.score || (day.type === "today" && latestScan?.averageScore ? latestScan.averageScore : null);
      let cleanScore = null;
      if (rawScore !== null && rawScore !== undefined) {
        if (typeof rawScore === "object") {
          cleanScore = rawScore.averageScore || rawScore.score || 7.0;
        } else {
          const num = Number(rawScore);
          cleanScore = isNaN(num) ? 7.0 : (num > 10 ? +(num / 10).toFixed(1) : num);
        }
      }

      let rawNotes = diaryRecord?.notes || "";
      let cleanNotes = "";
      if (typeof rawNotes === "string") {
        cleanNotes = rawNotes;
      } else if (Array.isArray(rawNotes)) {
        cleanNotes = rawNotes.map((n) => (typeof n === "string" ? n : n?.title || "")).filter(Boolean).join(" • ");
      } else if (typeof rawNotes === "object" && rawNotes !== null) {
        cleanNotes = rawNotes.title || rawNotes.overview || "Ảnh chụp phân tích da AI Vision";
      }

      return {
        ...day,
        photo: photoUrl,
        score: cleanScore,
        routineDone: diaryRecord?.routineDone !== undefined ? diaryRecord.routineDone : false,
        notes: cleanNotes,
        lastCapturedAt: diaryRecord?.lastCapturedAt || null
      };
    });
  }, [skinDiary, latestScan]);

  const handleDayClick = (day) => {
    setSelectedDay(day);

    if (day.hasGift && !day.photo) {
      setActiveGiftContent(
        `🎁 Quà tặng Cột mốc Ngày ${day.date}/10: Voucher giảm 20% Serum B5 & Kem Chống Nắng Phục Hồi!`
      );
      setIsGiftModalOpen(true);
      return;
    }

    if (day.photo) {
      setIsPhotoModalOpen(true);
    } else {
      setIsUploadModalOpen(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl && selectedDay) {
        saveDiaryEntry({
          dateKey: selectedDay.dateKey,
          displayDate: `${selectedDay.date < 10 ? "0" + selectedDay.date : selectedDay.date}/10/2026`,
          dayIndex: selectedDay.dayIndex || (selectedDay.date > 1 ? selectedDay.date - 1 : 1),
          photo: dataUrl, // Cập nhật đè lên ảnh lần chụp cuối cùng của ngày
          facePhoto: dataUrl,
          score: 7.2,
          notes: "Ảnh chụp cập nhật từ thư viện",
          routineDone: true,
          hasGift: selectedDay.hasGift || false,
          lastCapturedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          updatedAt: new Date().toISOString()
        });
        showToast(`Đã lưu ảnh lần chụp mới nhất cho ngày ${selectedDay.date}/10! 📸`);
        setIsUploadModalOpen(false);
        setIsPhotoModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleStartScanForDay = () => {
    setIsUploadModalOpen(false);
    setIsPhotoModalOpen(false);
    if (typeof setIsNameModalOpen === "function") {
      setIsNameModalOpen(true);
    }
  };

  return (
    <div className="skin-diary-page">
      <Navbar />

      {/* Hidden File Input for uploading daily photo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      <main className="skin-diary-main">
        <div className="skin-diary-dashboard-wrapper">
          
          {/* ================= 1. TOP HEADER & SWITCHER BAR ================= */}
          <div className="diary-top-bar">
            <div className="diary-header-text-group">
              <h1>Nhật Ký Làn Da <span className="diary-gold-text">28 Ngày</span></h1>
              <p>Hệ thống theo dõi tiến trình tái tạo da, lưu trữ ảnh chụp thực tế và quản lý chu trình hàng ngày</p>
            </div>

            <div className="diary-top-switcher">
              <button
                type="button"
                className={`diary-switch-btn ${activeTab === "diary" ? "active" : ""}`}
                onClick={() => setActiveTab("diary")}
              >
                📅 Nhật ký da
              </button>
              <button
                type="button"
                className={`diary-switch-btn ${activeTab === "mood_jar" ? "active" : ""}`}
                onClick={() => setActiveTab("mood_jar")}
              >
                ✨ Hũ tâm trạng
              </button>
            </div>
          </div>

          {activeTab === "diary" ? (
            /* ================= 2. DESKTOP 2-COLUMN DASHBOARD GRID ================= */
            <div className="diary-desktop-grid">
              
              {/* ================= LEFT COLUMN: 28-DAY CALENDAR CARD ================= */}
              <div className="diary-calendar-card">
                {/* Date range header */}
                <div className="diary-range-header">
                  <div className="diary-range-selector">
                    <button type="button" className="diary-range-arrow" aria-label="Kỳ trước">
                      ‹
                    </button>
                    <div className="diary-range-title">
                      <span>28/9 - 25/10, 2026</span>
                      <span className="diary-range-chevron">⌄</span>
                    </div>
                    <button type="button" className="diary-range-arrow" aria-label="Kỳ kế tiếp">
                      ›
                    </button>
                  </div>

                  <div className="diary-streak-badge" title="Chuỗi ngày chăm sóc liên tiếp">
                    <span>🔥</span>
                    <span>1 Ngày liên tiếp</span>
                  </div>
                </div>

                {/* Weekday headers */}
                <div className="diary-weekdays-row">
                  <div className="diary-weekday-col">MON</div>
                  <div className="diary-weekday-col">TUE</div>
                  <div className="diary-weekday-col">WED</div>
                  <div className="diary-weekday-col">THU</div>
                  <div className="diary-weekday-col">FRI</div>
                  <div className="diary-weekday-col">SAT</div>
                  <div className="diary-weekday-col">SUN</div>
                </div>

                {/* 28-Day Grid */}
                <div className="diary-calendar-grid">
                  {calendarItems.map((item, idx) => {
                    const isToday = item.type === "today";
                    const hasPhoto = !!item.photo;
                    const isPreCycle = item.type === "pre-cycle";
                    const isFuture = item.type === "future";

                    return (
                      <div
                        key={idx}
                        className="diary-day-cell"
                        onClick={() => handleDayClick(item)}
                        title={`Ngày ${item.date}/${item.month} - Nhấp để xem chi tiết`}
                      >
                        {/* Day Box */}
                        <div
                          className={`diary-day-box ${
                            isPreCycle
                              ? "pre-cycle"
                              : hasPhoto
                              ? "has-photo"
                              : isToday
                              ? "is-today-empty"
                              : "future-day"
                          }`}
                        >
                          {/* Pre-cycle minus icon */}
                          {isPreCycle && (
                            <div className="pre-cycle-icon-circle">-</div>
                          )}

                          {/* Photo inside slot with isolated overflow container */}
                          {hasPhoto && (
                            <div className="diary-card-photo-wrap">
                              <img
                                src={item.photo}
                                alt={`Ảnh chụp ngày ${item.date}`}
                                className="diary-card-photo-img"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Camera Icon for Today if no photo yet */}
                          {!hasPhoto && isToday && (
                            <svg
                              viewBox="0 0 24 24"
                              className="today-camera-icon"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                          )}

                          {/* Gift Badge (unclipped with high z-index) */}
                          {item.hasGift && !isPreCycle && (
                            <div className="diary-gift-badge" title="Cột mốc nhận quà">🎁</div>
                          )}
                        </div>

                        {/* Day Number beneath box */}
                        {isToday ? (
                          <div className="diary-today-badge-circle">{item.date}</div>
                        ) : (
                          <span
                            className={`diary-day-number ${
                              isPreCycle ? "pre-cycle-num" : ""
                            }`}
                          >
                            {item.date}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="diary-calendar-legend">
                  <span className="legend-item">📸 Ngày đã lưu ảnh</span>
                  <span className="legend-item">🎁 Cột mốc nhận quà</span>
                  <span className="legend-item">⭐ Hôm nay (Ngày 3)</span>
                </div>
              </div>

              {/* ================= RIGHT COLUMN: ROUTINE & ACTION CARD ================= */}
              <div className="diary-routine-card">
                {/* Header */}
                <div className="diary-card-header">
                  <div className="diary-card-cal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>

                  <div className="diary-card-meta">
                    <h3 className="diary-card-title">Chăm sóc da hàng ngày</h3>
                    <div className="diary-card-tags-row">
                      <span className="diary-pill-tag gold">28 ngày</span>
                      <span className="diary-pill-tag green">Chu trình đang sử dụng</span>
                    </div>
                    <p className="diary-card-created-date">Đã tạo ngày 02/10/2026</p>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="diary-progress-info-row">
                  <div className="diary-current-day-label">
                    <svg
                      viewBox="0 0 24 24"
                      className="diary-heart-icon"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>Bạn đang ở ngày <strong>2</strong></span>
                  </div>
                  <span className="diary-percent-pill">7% hoàn thành</span>
                </div>

                {/* Progress Bar Track */}
                <div className="diary-progress-track">
                  <div className="diary-progress-fill" style={{ width: "7%" }} />
                </div>

                {/* Countdown & Dates */}
                <div className="diary-countdown-block">
                  <p className="diary-days-left-text">
                    Chỉ còn <strong>26</strong> ngày nữa là hoàn thành chu trình!
                  </p>
                  <p className="diary-date-span-text">
                    Bắt đầu từ 02/10/2026 đến 29/10/2026
                  </p>
                </div>

                {/* Steps breakdown for morning/evening */}
                <div className="diary-routine-steps-box">
                  <div className="diary-steps-header">
                    <span className="diary-steps-title">
                      {routineTime === "morning" ? "🌅 Chu trình Buổi sáng khuyên dùng:" : "🌙 Chu trình Buổi tối khuyên dùng:"}
                    </span>
                  </div>

                  {routineTime === "morning" ? (
                    <>
                      <div className="diary-step-item">
                        <span className="diary-step-num">1</span>
                        <span>Sữa rửa mặt dịu nhẹ pH 5.5 (SVR / CeraVe)</span>
                      </div>
                      <div className="diary-step-item">
                        <span className="diary-step-num">2</span>
                        <span>Toner cấp ẩm & cân bằng da (Klairs Unscented)</span>
                      </div>
                      <div className="diary-step-item">
                        <span className="diary-step-num">3</span>
                        <span>Serum Niacinamide 5% / Vitamin C phục hồi</span>
                      </div>
                      <div className="diary-step-item">
                        <span className="diary-step-num">4</span>
                        <span>Kem chống nắng phổ rộng SPF 50+ PA++++</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="diary-step-item">
                        <span className="diary-step-num">1</span>
                        <span>Tẩy trang dạng nước Micellar (Cocoon / Bioderma)</span>
                      </div>
                      <div className="diary-step-item">
                        <span className="diary-step-num">2</span>
                        <span>Sữa rửa mặt sạch sâu thông thoáng lỗ chân lông</span>
                      </div>
                      <div className="diary-step-item">
                        <span className="diary-step-num">3</span>
                        <span>BHA 2% Salicylic Acid (3 lần/tuần) ngừa mụn</span>
                      </div>
                      <div className="diary-step-item">
                        <span className="diary-step-num">4</span>
                        <span>Kem dưỡng phục hồi màng bảo vệ Ceramide</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Photo Upload Button */}
                <button
                  type="button"
                  className="diary-btn-primary"
                  onClick={() => {
                    const todayItem = calendarItems.find((c) => c.type === "today");
                    if (todayItem) handleDayClick(todayItem);
                  }}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  📸 Chụp hoặc tải ảnh làn da hôm nay
                </button>

                {/* Interactive Action Toolbar */}
                <div className="diary-action-toolbar">
                  {/* Complete checkmark button */}
                  <button
                    type="button"
                    className={`diary-action-btn-circle ${routineCompleted ? "checked" : ""}`}
                    onClick={() => {
                      setRoutineCompleted((prev) => !prev);
                      showToast(
                        !routineCompleted
                          ? "Tuyệt vời! Đã hoàn thành chu trình chăm sóc hôm nay! 🎉"
                          : "Đã hủy đánh dấu hoàn thành."
                      );
                    }}
                    title="Đánh dấu đã hoàn thành chu trình hôm nay"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>

                  {/* Timer / Schedule button */}
                  <button
                    type="button"
                    className="diary-action-btn-circle warning"
                    onClick={() => showToast("Nhắc nhở chu trình: 08:00 sáng & 21:30 tối hàng ngày ⏰")}
                    title="Hẹn giờ nhắc nhở"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                    </svg>
                  </button>

                  {/* Skin recovery chart button */}
                  <button
                    type="button"
                    className="diary-action-btn-circle trend"
                    onClick={() => navigate("/your-skin")}
                    title="Xem bản đồ chẩn đoán da Y Khoa"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </button>

                  {/* Morning / Evening selector */}
                  <button
                    type="button"
                    className="diary-time-pill-btn"
                    onClick={() => {
                      setRoutineTime((prev) => (prev === "morning" ? "evening" : "morning"));
                      showToast(
                        routineTime === "morning"
                          ? "Đã chuyển sang chu trình Buổi tối 🌙"
                          : "Đã chuyển sang chu trình Buổi sáng 🌅"
                      );
                    }}
                  >
                    <span>{routineTime === "morning" ? "🌅 Buổi sáng" : "🌙 Buổi tối"}</span>
                  </button>
                </div>

                {/* Doctor Stethoscope FAB 🩺 */}
                <button
                  type="button"
                  className="diary-fab-doctor"
                  onClick={() => navigate("/your-skin")}
                  title="Tư vấn Chuyên gia & Phân tích da AI"
                  aria-label="Tư vấn Bác sĩ Da Liễu"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                    <circle cx="20" cy="10" r="2" />
                  </svg>
                </button>
              </div>

            </div>
          ) : (
            /* ================= MOOD JAR TAB (HŨ TÂM TRẠNG) - MATCHING USER SCREENSHOTS ================= */
            <div className="mood-jar-full-container">
              {/* Question Title Header */}
              <div className="mood-question-group">
                <h2 className="mood-question-title">Hôm nay bạn thế nào?</h2>
                <p className="mood-question-sub">Chọn tâm trạng và thả vào hũ nhé</p>
              </div>

              {/* 5 Mood Spheres Selector Row */}
              <div className="mood-spheres-selector-row">
                {MOOD_TYPES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="mood-select-item"
                    onClick={() => handleDropMood(m.id, m.label)}
                    title={`Chọn tâm trạng ${m.label}`}
                  >
                    <div className="mood-sphere-graphic">
                      {render3DMoodSphere(m.id, 52)}
                    </div>
                    <span className="mood-select-label">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Subtab: Hũ của mình */}
              <div className="mood-subtab-header">
                <span className="mood-subtab-text">Hũ của mình</span>
                <div className="mood-subtab-indicator" />
              </div>

              {/* Friend / User Status Pill Bar */}
              <div className="mood-friend-bar">
                <div className="mood-friend-left">
                  <div className="mood-friend-avatar">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div className="mood-friend-text-wrap">
                    <strong className="mood-friend-name">{currentUser?.name || "A"}</strong>
                    <span className="mood-friend-subtitle">Theo dõi trạng thái bạn bè</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mood-invite-btn"
                  onClick={() => showToast("Đã tạo liên kết mời bạn bè cùng chia sẻ Hũ tâm trạng! 💌")}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  <span>Mời bạn bè</span>
                </button>
              </div>

              {/* The Big Glass Jar Stage */}
              <div className="mood-jar-stage-container">
                {/* Floating clouds & stars backdrop */}
                <div className="mood-clouds-backdrop">
                  <div className="mood-cloud c1" />
                  <div className="mood-cloud c2" />
                  <div className="mood-cloud c3" />
                  <span className="mood-star-sparkle s1">✦</span>
                  <span className="mood-star-sparkle s2">✧</span>
                  <span className="mood-star-sparkle s3">✦</span>
                </div>

                {/* The Real Glass Jar */}
                <div className="mood-real-glass-jar">
                  {/* Wooden Lid */}
                  <div className="mood-wood-lid">
                    <div className="wood-grain g1" />
                    <div className="wood-grain g2" />
                  </div>

                  {/* Jar Neck */}
                  <div className="mood-glass-neck" />

                  {/* Glass Body */}
                  <div className="mood-glass-body">
                    {/* Specular highlights */}
                    <div className="mood-glass-glare-left" />
                    <div className="mood-glass-glare-right" />

                    {/* Dropped spheres */}
                    <div className="glass-jar-contents-bottom">
                      {droppedMoods.length === 0 ? (
                        <div className="empty-jar-hint">
                          Hũ đang trống. Hãy chọn một cảm xúc ở trên để thả vào hũ nhé! ✨
                        </div>
                      ) : (
                        droppedMoods.map((item, idx) => (
                          <div key={item.id || idx} className="dropped-mood-ball">
                            {render3DMoodSphere(item.type, 38)}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card: Thống kê tâm trạng của mình */}
              <div className="mood-stats-card">
                <div className="mood-stats-header">
                  <h3 className="mood-stats-title">Thống kê tâm trạng của mình</h3>
                  <button
                    type="button"
                    className="mood-share-btn"
                    onClick={() => showToast("Đã sao chép liên kết chia sẻ thống kê tâm trạng! 🔗")}
                    title="Chia sẻ"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>

                <p className="mood-stats-subtitle">
                  Đã thả {droppedMoods.length}/31 ngày trong tháng này
                </p>

                <div className="mood-stats-columns-grid">
                  {MOOD_TYPES.map((m) => (
                    <div key={m.id} className="mood-stat-column">
                      <div className="mood-stat-icon-wrap">
                        {render3DMoodSphere(m.id, 28)}
                      </div>
                      <span className="mood-stat-count">{moodCounts[m.id] || 0}</span>
                      <span className="mood-stat-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Stethoscope FAB 🩺 */}
              <button
                type="button"
                className="diary-fab-doctor"
                onClick={() => navigate("/your-skin")}
                title="Tư vấn Chuyên gia & Phân tích da AI"
                aria-label="Tư vấn Bác sĩ Da Liễu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                  <circle cx="20" cy="10" r="2" />
                </svg>
              </button>
            </div>
          )}

        </div>
      </main>

      {/* ================= MODAL 1: VIEW DAY PHOTO DETAILS ================= */}
      {isPhotoModalOpen && selectedDay && (
        <div className="diary-modal-overlay" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="diary-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="diary-modal-close-btn"
              onClick={() => setIsPhotoModalOpen(false)}
            >
              ×
            </button>

            <div className="diary-modal-date-badge">
              📅 Ngày {selectedDay.date}/{selectedDay.month}/2026 {selectedDay.type === "today" ? "(Hôm nay)" : ""}
            </div>

            <h3 className="diary-modal-title">Ảnh Chụp Làn Da Trong Ngày</h3>

            {selectedDay.photo && (
              <img
                src={selectedDay.photo}
                alt="Ảnh chụp ngày"
                className="diary-modal-photo-preview"
              />
            )}


            <div className="diary-modal-actions-stack">
              <button
                type="button"
                className="diary-btn-primary"
                onClick={() => {
                  setIsPhotoModalOpen(false);
                  navigate("/your-skin");
                }}
              >
                🔬 Xem Báo Cáo Phân Tích Y Khoa Đa Vùng
              </button>
              <button
                type="button"
                className="diary-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                📸 Cập nhật / Tải lại ảnh khác (Lần chụp mới)
              </button>
              <button
                type="button"
                className="diary-btn-delete"
                onClick={() => {
                  saveDiaryEntry({
                    dateKey: selectedDay.dateKey,
                    displayDate: `${selectedDay.date < 10 ? "0" + selectedDay.date : selectedDay.date}/10/2026`,
                    dayIndex: selectedDay.dayIndex || 1,
                    photo: null,
                    facePhoto: null,
                    notes: ""
                  });
                  setSelectedDay((prev) => ({ ...prev, photo: null }));
                  setIsPhotoModalOpen(false);
                  showToast(`Đã gỡ ảnh ngày ${selectedDay.date}/10`);
                }}
              >
                🗑️ Xóa ảnh ngày này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: UPLOAD / CAPTURE PHOTO FOR DAY ================= */}
      {isUploadModalOpen && selectedDay && (
        <div className="diary-modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
          <div className="diary-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="diary-modal-close-btn"
              onClick={() => setIsUploadModalOpen(false)}
            >
              ×
            </button>

            <div className="diary-modal-date-badge">
              📅 Ngày {selectedDay.date}/{selectedDay.month}/2026 {selectedDay.type === "today" ? "(Hôm nay)" : ""}
            </div>

            <h3 className="diary-modal-title">Chụp Hoặc Tải Ảnh Làn Da</h3>
            <p style={{ fontSize: "13.5px", color: "#786f63", margin: 0 }}>
              Ghi lại ảnh chụp khuôn mặt hàng ngày để AI đối chiếu và theo dõi sự cải thiện của từng đốm mụn, lỗ chân lông và sắc tố da!
            </p>

            <div className="diary-modal-actions-stack" style={{ marginTop: "8px" }}>
              <button
                type="button"
                className="diary-btn-primary"
                onClick={handleStartScanForDay}
              >
                📷 Mở camera quét Face ID 3 góc
              </button>

              <button
                type="button"
                className="diary-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                🖼️ Chọn ảnh có sẵn từ máy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: MILESTONE GIFT POPUP ================= */}
      {isGiftModalOpen && (
        <div className="diary-modal-overlay" onClick={() => setIsGiftModalOpen(false)}>
          <div className="diary-modal-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <button
              type="button"
              className="diary-modal-close-btn"
              onClick={() => setIsGiftModalOpen(false)}
            >
              ×
            </button>

            <div style={{ fontSize: "48px", margin: "10px 0" }}>🎁</div>
            <h3 className="diary-modal-title" style={{ color: "#a0703e" }}>
              Chúc mừng bạn đạt cột mốc!
            </h3>
            <p style={{ fontSize: "14px", color: "#37332d", lineHeight: 1.5, margin: "10px 0" }}>
              {activeGiftContent || "Quà tặng chăm sóc da đặc quyền của GlowSkin dành riêng cho bạn!"}
            </p>

            <button
              type="button"
              className="diary-btn-primary"
              onClick={() => {
                setIsGiftModalOpen(false);
                showToast("Đã lưu mã ưu đãi vào tài khoản của bạn! 🏷️");
              }}
            >
              Nhận quà ngay
            </button>
          </div>
        </div>
      )}

      {/* Toast alert */}
      {toastMsg && (
        <div className="diary-toast">
          <span>✨</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
