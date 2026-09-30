import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import "./WelcomeNameModal.css";

const VIETNAM_CITIES = [
  "An Giang", "Bà Rịa-Vũng Tàu", "Bình Dương", "Bình Phước", "Bình Thuận", "Bình Định",
  "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Cà Mau",
  "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên",
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội",
  "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn",
  "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận",
  "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh",
  "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP Hồ Chí Minh", "Trà Vinh",
  "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const BUDGET_OPTIONS = [
  "Dưới 200k/sản phẩm.",
  "Từ 200-300k/sản phẩm.",
  "Từ 300-500k/sản phẩm.",
  "Từ 500k-1 triệu/sản phẩm.",
  "Trên 1 triệu/sản phẩm."
];

const YES_NO_OPTIONS = [
  "Câu hỏi không phù hợp với tôi",
  "Có"
];

export default function WelcomeNameModal() {
  const { currentUser, isNameModalOpen, setIsNameModalOpen, updatePreferredName, updateProfile } = useApp();

  // Wizard Step:
  // 0: Preferred Name input
  // 1: Gender (Nam / Nữ)
  // 2: Date of birth (Wheel picker)
  // 3: City (Search & Select)
  // 4: Budget & Medical questions
  const [step, setStep] = useState(0);

  // Form States
  const [nameInput, setNameInput] = useState("");
  const [gender, setGender] = useState("");
  
  // Date Picker States
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(2000);

  // City search & select
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Survey Questions (Step 4)
  const [budget, setBudget] = useState("");
  const [hasMedical, setHasMedical] = useState("");
  const [hasPrescription, setHasPrescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Reset or pre-fill on modal open
  useEffect(() => {
    if (isNameModalOpen) {
      const initialName =
        currentUser?.preferredName ||
        currentUser?.name ||
        "";
      setNameInput(initialName);
      setGender(currentUser?.gender || "");
      setSelectedCity(currentUser?.city || "");

      // If user already has preferred name, could start at step 1 or step 0
      setStep(0);

      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 150);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isNameModalOpen, currentUser]);

  // Auto-prompt modal on initial login if preferredName is not set
  useEffect(() => {
    if (currentUser && !currentUser.preferredName && !currentUser.onboardingCompleted) {
      const hasDismissed = sessionStorage.getItem(`glowskin_name_prompt_dismissed_${currentUser.id || currentUser._id}`);
      if (!hasDismissed) {
        setIsNameModalOpen(true);
      }
    }
  }, [currentUser, setIsNameModalOpen]);

  if (!isNameModalOpen || !currentUser) return null;

  const currentPreferredName = nameInput.trim() || currentUser.preferredName || "bạn";

  const handleClose = () => {
    if (currentUser) {
      const userKey = currentUser.id || currentUser._id || currentUser.email || "user";
      sessionStorage.setItem(`glowskin_name_prompt_dismissed_${userKey}`, "true");
    }
    setIsNameModalOpen(false);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    } else {
      handleClose();
    }
  };

  // Step 0: Save preferred name and advance to Step 1
  const handleStep0Next = async (e) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await updatePreferredName(trimmed);
      setStep(1);
    } catch (err) {
      console.error("Lỗi cập nhật tên gọi thân mật:", err);
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Gender submit
  const handleStep1Next = () => {
    if (!gender) return;
    setStep(2);
  };

  // Step 2: Birthday submit
  const handleStep2Next = () => {
    setStep(3);
  };

  // Step 3: City submit
  const handleStep3Next = () => {
    if (!selectedCity) return;
    setStep(4);
  };

  // Step 4: Finish complete onboarding survey
  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    const birthDateStr = `${day}/${month}/${year}`;
    const surveyPayload = {
      gender,
      birthDate: birthDateStr,
      city: selectedCity,
      skinSurvey: {
        budget,
        hasMedicalCondition: hasMedical,
        hasPrescriptionMedication: hasPrescription
      },
      onboardingCompleted: true
    };

    try {
      const id = currentUser.id || currentUser._id || currentUser.email;
      await updateProfile(
        id,
        currentUser.name,
        currentUser.email,
        currentUser.phone,
        currentUser.addresses,
        nameInput.trim() || currentUser.preferredName
      );

      // Save additional survey fields
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await fetch(`${API_URL}/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyPayload),
      }).catch((e) => console.warn("Lưu khảo sát backend:", e));

      const userKey = currentUser.id || currentUser._id || currentUser.email || "user";
      sessionStorage.setItem(`glowskin_name_prompt_dismissed_${userKey}`, "true");
      setIsNameModalOpen(false);
    } catch (err) {
      console.error("Lỗi hoàn thành khảo sát:", err);
      setIsNameModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter cities for Step 3
  const filteredCities = VIETNAM_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.trim().toLowerCase())
  );

  // Wheel Picker Arrays
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 65 }, (_, i) => 2018 - i); // 2018 down to 1954

  // Calculate Progress Percentage for the top progress line
  const progressMap = { 0: 15, 1: 35, 2: 55, 3: 75, 4: 100 };
  const currentProgress = progressMap[step] || 20;

  return (
    <div className="onboarding-modal-overlay" onClick={handleClose}>
      <div className="onboarding-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Top Header: Back Arrow & Sleek Progress Bar */}
        <div className="onboarding-top-nav">
          <button
            type="button"
            className="onboarding-back-btn"
            onClick={handleBack}
            aria-label="Quay lại"
          >
            {step > 0 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            ) : (
              <span className="onboarding-close-icon">✕</span>
            )}
          </button>

          <div className="onboarding-progress-track">
            <div
              className="onboarding-progress-fill"
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>

          <button
            type="button"
            className="onboarding-skip-btn"
            onClick={handleClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Ambient Subtle Glow */}
        <div className="onboarding-ambient-glow"></div>

        {/* ================= STEP 0: TÊN GỌI THÂN MẬT ================= */}
        {step === 0 && (
          <div className="onboarding-step-view animate-fade">
            <div className="onboarding-brand">
              <span className="onboarding-brand-name">GLOWSKIN</span>
              <span className="onboarding-brand-ai">Ai</span>
            </div>

            <div className="onboarding-header">
              <p className="onboarding-subtitle">Hãy bắt đầu hành trình mới</p>
              <h2 className="onboarding-title serif-title">
                Bạn muốn GlowSkin gọi bạn là gì nào?
              </h2>
            </div>

            <form onSubmit={handleStep0Next} className="onboarding-form">
              <div className="onboarding-name-input-box">
                <input
                  ref={inputRef}
                  type="text"
                  className="onboarding-name-input"
                  placeholder="Ví dụ: Bu, Nhi, Hoàng..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={35}
                  required
                />
                {nameInput && (
                  <button
                    type="button"
                    className="onboarding-clear-icon"
                    onClick={() => setNameInput("")}
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="onboarding-helper-text">
                Tên này sẽ xuất hiện trong các câu chào hỏi và cách AI đồng hành cùng bạn.
              </p>

              <div className="onboarding-bottom-action">
                <button
                  type="submit"
                  className="onboarding-primary-btn"
                  disabled={!nameInput.trim() || isSubmitting}
                >
                  {isSubmitting ? "Đang lưu..." : "Tiếp tục"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 1: GIỚI TÍNH ================= */}
        {step === 1 && (
          <div className="onboarding-step-view animate-fade">
            <div className="onboarding-header">
              <h2 className="onboarding-title serif-title">
                Hello {currentPreferredName},giới tính của bạn là gì?
              </h2>
              <p className="onboarding-subtitle">
                Thông tin này giúp chúng tôi điều chỉnh thói quen để phù hợp với giới tính của bạn.
              </p>
            </div>

            <div className="onboarding-options-list">
              <div
                className={`onboarding-choice-card ${gender === "Nam" ? "selected" : ""}`}
                onClick={() => setGender("Nam")}
              >
                <span className="onboarding-choice-label">Nam</span>
                <span className="onboarding-radio-circle"></span>
              </div>

              <div
                className={`onboarding-choice-card ${gender === "Nữ" ? "selected" : ""}`}
                onClick={() => setGender("Nữ")}
              >
                <span className="onboarding-choice-label">Nữ</span>
                <span className="onboarding-radio-circle"></span>
              </div>
            </div>

            <div className="onboarding-bottom-action">
              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={!gender}
                onClick={handleStep1Next}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: NGÀY SINH (WHEEL DATE PICKER) ================= */}
        {step === 2 && (
          <div className="onboarding-step-view animate-fade">
            <div className="onboarding-header">
              <h2 className="onboarding-title serif-title">
                {currentPreferredName},ngày sinh của bạn là ngày nào thế?
              </h2>
              <p className="onboarding-subtitle">
                Thông tin này giúp chúng tôi hiểu rõ hơn về làn da của bạn.
              </p>
            </div>

            {/* Apple iOS-grade 3-Column Wheel Date Picker */}
            <div className="onboarding-date-wheel-container">
              <div className="onboarding-date-wheel-highlight"></div>

              {/* Day Column */}
              <div className="onboarding-wheel-col">
                <div className="onboarding-wheel-list">
                  {days.map((d) => (
                    <div
                      key={d}
                      className={`onboarding-wheel-item ${d === day ? "active" : ""}`}
                      onClick={() => setDay(d)}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {/* Month Column */}
              <div className="onboarding-wheel-col">
                <div className="onboarding-wheel-list">
                  {months.map((m) => (
                    <div
                      key={m}
                      className={`onboarding-wheel-item ${m === month ? "active" : ""}`}
                      onClick={() => setMonth(m)}
                    >
                      tháng {m}
                    </div>
                  ))}
                </div>
              </div>

              {/* Year Column */}
              <div className="onboarding-wheel-col">
                <div className="onboarding-wheel-list">
                  {years.map((y) => (
                    <div
                      key={y}
                      className={`onboarding-wheel-item ${y === year ? "active" : ""}`}
                      onClick={() => setYear(y)}
                    >
                      {y}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="onboarding-bottom-action">
              <button
                type="button"
                className="onboarding-primary-btn with-arrow"
                onClick={handleStep2Next}
              >
                <span>Tiếp tục</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: THÀNH PHỐ SỐNG ================= */}
        {step === 3 && (
          <div className="onboarding-step-view animate-fade">
            <div className="onboarding-header">
              <h2 className="onboarding-title serif-title">
                Bạn đang ở thành phố nào vậy {currentPreferredName}?
              </h2>
              <p className="onboarding-subtitle">
                Thông tin này giúp chúng tôi đề xuất chu trình phù hợp với khí hậu nơi bạn đang sinh sống.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="onboarding-search-box">
              <svg className="onboarding-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Tìm thành phố bạn đang sống"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
              />
              {citySearch && (
                <button
                  type="button"
                  className="onboarding-clear-icon"
                  onClick={() => setCitySearch("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* City Pills List */}
            <div className="onboarding-cities-scroll">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`onboarding-city-pill ${selectedCity === city ? "selected" : ""}`}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </button>
              ))}
              {filteredCities.length === 0 && (
                <p className="onboarding-empty-cities">Không tìm thấy thành phố phù hợp</p>
              )}
            </div>

            <div className="onboarding-bottom-action">
              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={!selectedCity}
                onClick={handleStep3Next}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: CHI PHÍ & BỆNH LÝ ================= */}
        {step === 4 && (
          <div className="onboarding-step-view animate-fade">
            <div className="onboarding-scrollable-survey">
              
              {/* Question 1: Budget */}
              <div className="onboarding-survey-section">
                <h3 className="onboarding-survey-question">
                  Mức chi phí trung bình cho 1 sản phẩm chăm sóc da của bạn là bao nhiêu?
                </h3>
                <div className="onboarding-options-list">
                  {BUDGET_OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      className={`onboarding-choice-card ${budget === opt ? "selected" : ""}`}
                      onClick={() => setBudget(opt)}
                    >
                      <span className="onboarding-choice-label">{opt}</span>
                      <span className="onboarding-radio-circle"></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 2: Medical Condition */}
              <div className="onboarding-survey-section">
                <h3 className="onboarding-survey-question">
                  Bạn có đang mắc bệnh lý hoặc đang điều trị bệnh không?
                </h3>
                <div className="onboarding-options-list">
                  {YES_NO_OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      className={`onboarding-choice-card ${hasMedical === opt ? "selected" : ""}`}
                      onClick={() => setHasMedical(opt)}
                    >
                      <span className="onboarding-choice-label">{opt}</span>
                      <span className="onboarding-radio-circle"></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 3: Prescription Drugs */}
              <div className="onboarding-survey-section">
                <h3 className="onboarding-survey-question">
                  Bạn có đang dùng thuốc kê đơn nào không?
                </h3>
                <div className="onboarding-options-list">
                  {YES_NO_OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      className={`onboarding-choice-card ${hasPrescription === opt ? "selected" : ""}`}
                      onClick={() => setHasPrescription(opt)}
                    >
                      <span className="onboarding-choice-label">{opt}</span>
                      <span className="onboarding-radio-circle"></span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="onboarding-bottom-action">
              <button
                type="button"
                className="onboarding-primary-btn"
                disabled={!budget || isSubmitting}
                onClick={handleFinishOnboarding}
              >
                {isSubmitting ? "Đang hoàn tất..." : "Tiếp tục"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
