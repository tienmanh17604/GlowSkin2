import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useApp } from "../context/AppContext";
import { sendFollowUp } from "../services/analyzeSkin";
import "./YourSkin.css";

export const DEFAULT_DEMO_SCAN = {
  id: "demo-scan-01",
  date: "Chẩn đoán vừa thực hiện",
  score: 72,
  scoreLabel: "Phân tích Y Khoa & AI Vision",
  medicalReference: "Quyết định 4416/QĐ-BYT Bộ Y Tế",
  image: "https://res.cloudinary.com/buevamso/image/upload/v1784045582/glowskin/showcase/sample_acne_analysis_face.jpg",
  zones: [
    {
      id: "forehead",
      title: "Vùng Trán",
      condition: "Mụn viêm & Thâm dai dẳng",
      detail: "Phát hiện mụn viêm sưng và bít tắc lỗ chân lông. Căn cứ bài Trứng cá QĐ 4416/QĐ-BYT.",
      thumb: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&q=80&auto=format&fit=crop",
      angle: -90, // 12 o'clock (Top)
    },
    {
      id: "eyebrow",
      title: "Vùng Lông Mày",
      condition: "Da bình thường, ít tổn thương",
      detail: "Cấu trúc da khỏe, ít nếp nhăn và không có ổ viêm.",
      thumb: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80&auto=format&fit=crop",
      angle: -30, // 2 o'clock (Top-Right)
    },
    {
      id: "upper_cheek",
      title: "Vùng Má",
      condition: "Mụn đầu đen & Thâm mụn",
      detail: "Dấu hiệu thâm sau viêm (PIH). Khuyến nghị Niacinamide + Vitamin C.",
      thumb: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&q=80&auto=format&fit=crop",
      angle: 30, // 4 o'clock (Right)
    },
    {
      id: "chin",
      title: "Vùng Cằm",
      condition: "Mụn mủ & Thâm dày",
      detail: "Tập trung mụn ẩn và sợi bã nhờn. Cần làm sạch sâu với Salicylic Acid.",
      thumb: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80&auto=format&fit=crop",
      angle: 90, // 6 o'clock (Bottom)
    },
    {
      id: "mouth",
      title: "Vùng Môi",
      condition: "Mụn nhỏ xung quanh",
      detail: "Da quanh môi thiếu ẩm, cần bổ sung kem dưỡng phục hồi.",
      thumb: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&q=80&auto=format&fit=crop",
      angle: 150, // 8 o'clock (Bottom-Left)
    },
    {
      id: "jaw",
      title: "Vùng Hàm",
      condition: "Cần điều trị nhẹ",
      detail: "Vùng quai hàm có vi mụn rải rác.",
      thumb: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300&q=80&auto=format&fit=crop",
      angle: 210, // 10 o'clock (Top-Left)
    },
  ],
};

function formatChatMessage(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (/^[-*_ ]{3,}$/.test(line.trim())) {
      return <hr key={i} style={{ border: "none", borderTop: "1px solid rgba(212, 175, 55, 0.2)", margin: "10px 0" }} />;
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const content = parts.map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j} style={{ color: "#856404" }}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );
    return (
      <span key={i} style={{ display: "block", margin: "3px 0", lineHeight: "1.5" }}>
        {content}
      </span>
    );
  });
}

export default function YourSkin() {
  const { latestScan } = useApp();
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  // AI Doctor Interactive Chat Modal States
  const [isAiDoctorOpen, setIsAiDoctorOpen] = useState(false);
  const [aiDoctorZone, setAiDoctorZone] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef(null);

  const scan = latestScan || DEFAULT_DEMO_SCAN;
  const displayImage = scan.image || DEFAULT_DEMO_SCAN.image;

  const rawZones = scan.zones && scan.zones.length ? scan.zones : DEFAULT_DEMO_SCAN.zones;
  const zones = rawZones.filter((z) => z.id !== "lower_cheek");

  // Orbital placement radius matching circular layout around face image
  const orbitRadiusX = 45; // % from center X
  const orbitRadiusY = 44; // % from center Y

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatMessages, chatLoading]);

  const handleOpenAiDoctor = (zone) => {
    const targetZone = zone || selectedZone || zones[0];
    setAiDoctorZone(targetZone);
    setSelectedZone(null);
    setIsAiDoctorOpen(true);

    const initialGreeting = {
      id: Date.now(),
      role: "assistant",
      content: `🩺 **Bác sĩ AI GlowSkin (Tích hợp QĐ 4416 & DATA AI):**\n\nChào bạn! Tôi đã tiếp nhận chẩn đoán vùng **${targetZone?.title || "Khuôn mặt"}** (*${targetZone?.condition || "Cần chăm sóc"}*).\n\nDựa trên dữ liệu Y khoa Bộ Y Tế và bộ tài liệu chuyên sâu (**Mụn, Sắc Tố, Lão Hóa**), bạn cần tư vấn về **hoạt chất điều trị**, **thứ tự Routine** hay **lưu ý tác dụng phụ** cho vùng da này?`
    };
    setChatMessages([initialGreeting]);
  };

  const handleSendAiChat = async (userText) => {
    const textToSend = typeof userText === "string" ? userText : inputMsg;
    if (!textToSend.trim() || chatLoading) return;

    const userMsgObj = {
      id: Date.now(),
      role: "user",
      content: textToSend.trim()
    };

    const updatedHistory = [...chatMessages, userMsgObj];
    setChatMessages(updatedHistory);
    setInputMsg("");
    setChatLoading(true);

    try {
      const aiRes = await sendFollowUp(updatedHistory);
      const botMsgObj = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiRes.content || "Đã xảy ra sự cố khi kết nối Bác sĩ AI. Vui lòng thử lại!"
      };
      setChatMessages((prev) => [...prev, botMsgObj]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "⚠️ Không thể kết nối với hệ thống AI. Vui lòng thử lại sau!"
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="your-skin-gold-page">
      <Navbar />

      <main className="gold-skin-viewport">
        {/* HEADER TITLE BANNER */}
        <div className="gold-header-banner">
          <div className="gold-badge">✨ AI VISION &amp; PHÁC ĐỒ BỘ Y TẾ (QĐ 4416/QĐ-BYT &amp; DATA AI)</div>
          <h1 className="gold-page-title">
            Báo Cáo Phân Tích Làn Da <span className="gold-text-gradient">Chuyên Sâu</span>
          </h1>
          <p className="gold-page-subtitle">
            Hệ thống định vị đa vùng chuẩn Y Khoa &amp; Công nghệ AI Gemini Vision | {scan.date || "Vừa cập nhật"}
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            <button className="gold-action-btn primary" onClick={() => handleOpenAiDoctor(zones[0])}>
              💬 Chat Trực Tiếp Với Bác Sĩ AI (360 Bài Y Khoa)
            </button>
            <Link to="/analyze" className="gold-action-btn secondary">
              📸 Chụp / Phân Tích Ảnh Mới
            </Link>
          </div>
        </div>

        <div className="gold-boxes-stage">
          {/* METALLIC GOLD CIRCULAR RINGS */}
          <div className="gold-dashed-circle-ring" />
          <div className="gold-inner-glow-ring" />

          {/* CENTERED CLEAN CUSTOMER FACE PHOTO WITH FLOATING ANIMATION */}
          <div className="gold-center-face-card gold-floating-bob">
            <img
              src={displayImage}
              alt="Ảnh mặt khách hàng"
              className="gold-face-img"
            />
          </div>

          {/* DESCRIPTION RECTANGULAR CARDS ARRANGED AROUND CIRCLE */}
          {zones.map((zone, idx) => {
            const angle = zone.angle !== undefined ? zone.angle : -90 + (idx * 360) / zones.length;
            const rad = (angle * Math.PI) / 180;
            const cardLeft = 50 + orbitRadiusX * Math.cos(rad);
            const cardTop = 50 + orbitRadiusY * Math.sin(rad);
            const isActive = activeZoneId === zone.id || selectedZone?.id === zone.id;

            return (
              <div
                key={zone.id}
                className={`gold-desc-card-box ${isActive ? "gold-card-highlight" : ""}`}
                style={{ left: `${cardLeft}%`, top: `${cardTop}%` }}
                onMouseEnter={() => setActiveZoneId(zone.id)}
                onMouseLeave={() => setActiveZoneId(null)}
                onClick={() => setSelectedZone(zone)}
              >
                <div className="gold-card-top-row">
                  {zone.thumb && (
                    <img src={zone.thumb} alt={zone.title} className="gold-card-mini-thumb" />
                  )}
                  <div className="gold-card-title-text">{zone.title}</div>
                </div>
                <div className="gold-card-cond-text">{zone.condition}</div>
              </div>
            );
          })}
        </div>

        {/* MODAL 1: ZONE DIAGNOSIS DETAIL OVERLAY */}
        {selectedZone && (
          <div className="gold-zone-modal-overlay" onClick={() => setSelectedZone(null)}>
            <div className="gold-zone-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="gold-modal-close" onClick={() => setSelectedZone(null)}>×</button>
              <div className="gold-badge" style={{ marginBottom: "8px" }}>🩺 CHẨN ĐOÁN CHI TIẾT CHUẨN BỘ Y TẾ</div>
              <h3 className="gold-modal-title">{selectedZone.title}</h3>
              <p className="gold-modal-cond"><strong>Tình trạng:</strong> {selectedZone.condition}</p>
              {selectedZone.detail && (
                <p className="gold-modal-desc">
                  <strong>Phân tích AI &amp; Chuẩn Y khoa:</strong> {selectedZone.detail}
                </p>
              )}
              <div className="gold-modal-footer">
                <button
                  className="gold-action-btn primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => handleOpenAiDoctor(selectedZone)}
                >
                  💬 Chat với Chuyên Gia AI để tư vấn hoạt chất điều trị
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: INTERACTIVE AI DOCTOR CHATBOX (INTEGRATED WITH 360 MEDICAL PDFS) */}
        {isAiDoctorOpen && (
          <div className="gold-zone-modal-overlay" onClick={() => setIsAiDoctorOpen(false)}>
            <div className="gold-ai-chat-modal-content" onClick={(e) => e.stopPropagation()}>
              
              {/* CHAT HEADER */}
              <div className="gold-ai-chat-header">
                <div className="gold-ai-doctor-avatar">🩺</div>
                <div>
                  <h3 className="gold-ai-chat-title">Bác Sĩ AI Skincare GlowSkin</h3>
                  <div className="gold-ai-chat-subtitle">
                    ✨ Tích hợp 360 Bài Y Khoa &amp; DATA AI ({aiDoctorZone?.title || "Chẩn đoán da"})
                  </div>
                </div>
                <button className="gold-modal-close" onClick={() => setIsAiDoctorOpen(false)}>×</button>
              </div>

              {/* MESSAGES VIEWPORT */}
              <div className="gold-ai-chat-messages" ref={chatScrollRef}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`gold-chat-msg-row ${msg.role}`}>
                    {msg.role === "assistant" && <div className="gold-msg-icon">🩺</div>}
                    <div className={`gold-msg-bubble ${msg.role}`}>
                      {formatChatMessage(msg.content)}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="gold-chat-msg-row assistant">
                    <div className="gold-msg-icon">🩺</div>
                    <div className="gold-msg-bubble assistant gold-typing-bubble">
                      <span>Đang tra cứu dữ liệu Y Khoa &amp; Phân tích...</span>
                      <div className="gold-typing-dots">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK PROMPT CHIPS */}
              <div className="gold-quick-prompts-row">
                <button
                  className="gold-prompt-chip"
                  onClick={() => handleSendAiChat(`Tư vấn hoạt chất trị mụn và thâm tốt nhất cho ${aiDoctorZone?.title || "vùng da này"}`)}
                >
                  💡 Hoạt chất trị mụn &amp; thâm
                </button>
                <button
                  className="gold-prompt-chip"
                  onClick={() => handleSendAiChat(`Gợi ý Routine chăm sóc sáng và tối chuẩn Bộ Y Tế`)}
                >
                  💡 Routine Sáng &amp; Tối
                </button>
                <button
                  className="gold-prompt-chip"
                  onClick={() => handleSendAiChat(`Thành phần nào dễ gây kích ứng cần tránh?`)}
                >
                  💡 Thành phần nên tránh
                </button>
              </div>

              {/* CHAT INPUT FORM */}
              <form
                className="gold-ai-chat-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiChat();
                }}
              >
                <input
                  type="text"
                  className="gold-ai-chat-input"
                  placeholder="Nhập câu hỏi cho Bác sĩ AI (vd: Tôi nên dùng BHA hay Azelaic Acid?)..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  className="gold-ai-chat-send-btn"
                  disabled={!inputMsg.trim() || chatLoading}
                >
                  Gửi ➔
                </button>
              </form>

            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}


