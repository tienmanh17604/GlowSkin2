import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import "./ChatWidget.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const CHAT_USER_KEY = "glowskin-chat-user";

export default function ChatWidget() {
  const { isCartOpen } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [chatUser, setChatUser] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch messages from API
  const fetchMessages = async (userPhone) => {
    try {
      const res = await fetch(`${API_URL}/chats/${userPhone}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải tin nhắn chat:", err);
    }
  };

  // Poll for new messages when open and user is logged in
  useEffect(() => {
    if (isOpen && chatUser) {
      // Fetch immediately
      fetchMessages(chatUser.phone);

      // Start polling every 3 seconds
      pollingRef.current = setInterval(() => {
        fetchMessages(chatUser.phone);
      }, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, chatUser]);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    if (isOpen && chatUser) {
      scrollToBottom();
    }
  }, [messages, isOpen, chatUser]);

  // Handle start chat form submit
  const handleStartChat = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Vui lòng điền đầy đủ họ tên và số điện thoại.");
      return;
    }

    // Vietnamese mobile phone validation (starts with 0, total 10 digits)
    const phoneRegex = /^(0[35789])[0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập đúng số điện thoại (10 số, bắt đầu bằng 03, 05, 07, 08, 09).");
      return;
    }

    const userData = { name: name.trim(), phone: phone.trim() };
    localStorage.setItem(CHAT_USER_KEY, JSON.stringify(userData));
    setChatUser(userData);
    fetchMessages(userData.phone);
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatUser) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input early for responsive UI

    // Optimistic UI update
    const tempMsg = {
      _id: "temp_" + Date.now(),
      sender: "user",
      customerName: chatUser.name,
      phone: chatUser.phone,
      text: messageText,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`${API_URL}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "user",
          customerName: chatUser.name,
          phone: chatUser.phone,
          text: messageText
        })
      });

      if (res.ok) {
        // Refetch to get official timestamp and ID
        fetchMessages(chatUser.phone);
      }
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn:", err);
    }
  };

  // Reset chat session (Log out from chat)
  const handleExitChat = () => {
    localStorage.removeItem(CHAT_USER_KEY);
    setChatUser(null);
    setMessages([]);
    setName("");
    setPhone("");
  };

  // Close chat when cart is opened
  useEffect(() => {
    if (isCartOpen) {
      setIsOpen(false);
    }
  }, [isCartOpen]);

  // Don't show client chat widget on Admin panel or when cart is open
  if (window.location.pathname.startsWith("/admin") || isCartOpen) {
    return null;
  }

  return (
    <div className="glowskin-chat-container">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button className="glowskin-chat-badge-btn" onClick={() => setIsOpen(true)} aria-label="Mở chat hỗ trợ">
          <div className="glowskin-chat-bubble">Cần tớ giúp gì không? ✨</div>
          <img src="/skincare_mascot.png" alt="Chat Mascot" className="glowskin-chat-mascot-icon" />
          <span className="glowskin-online-dot"></span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="glowskin-chat-card">
          {/* Header */}
          <div className="glowskin-chat-header">
            <div className="glowskin-chat-header-title">
              <span className="glowskin-header-dot"></span>
              <strong>GlowSkin Hỗ Trợ 24/7</strong>
            </div>
            <button className="glowskin-chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Đóng chat">
              &times;
            </button>
          </div>

          {/* Quick contact buttons */}
          <div className="glowskin-chat-quick-links">
            <a href="tel:0899821764" className="glowskin-quick-btn glowskin-quick-btn--call">
              <svg viewBox="0 0 24 24" className="quick-icon" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              Gọi Ngay
            </a>
            <a href="https://zalo.me/0962758923" target="_blank" rel="noopener noreferrer" className="glowskin-quick-btn glowskin-quick-btn--zalo">
              <svg viewBox="0 0 24 24" className="quick-icon" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
              Chat Zalo
            </a>
          </div>

          {/* Content Area */}
          <div className="glowskin-chat-body">
            {!chatUser ? (
              /* Start Chat Registration Form */
              <form onSubmit={handleStartChat} className="glowskin-chat-register-form">
                <h3>Liên Hệ Trực Tuyến</h3>
                <p className="glowskin-chat-subtitle">
                  Vui lòng cung cấp thông tin để chúng tôi hỗ trợ bạn tốt nhất
                </p>

                {error && <div className="glowskin-chat-error-msg">{error}</div>}

                <div className="glowskin-chat-form-group">
                  <label htmlFor="chat-name">HỌ VÀ TÊN *</label>
                  <input
                    id="chat-name"
                    type="text"
                    placeholder="Nhập họ và tên của bạn..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="glowskin-chat-form-group">
                  <label htmlFor="chat-phone">SỐ ĐIỆN THOẠI *</label>
                  <input
                    id="chat-phone"
                    type="tel"
                    placeholder="Nhập số điện thoại liên hệ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="glowskin-chat-submit-btn">
                  Bắt đầu trò chuyện
                </button>
              </form>
            ) : (
              /* Active Chat Interface */
              <div className="glowskin-chat-messages-wrapper">
                <div className="glowskin-chat-messages-list">
                  {messages.length === 0 ? (
                    <div className="glowskin-chat-empty-state">
                      <p>Chào <strong>{chatUser.name}</strong>!</p>
                      <p>Hãy gửi tin nhắn đầu tiên, đội ngũ GlowSkin sẽ phản hồi bạn ngay lập tức.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`glowskin-chat-message-bubble ${
                          msg.sender === "user" ? "glowskin-message--user" : "glowskin-message--admin"
                        }`}
                      >
                        <div className="glowskin-chat-message-text">{msg.text}</div>
                        <div className="glowskin-chat-message-time">
                          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Send Message Form */}
                <form onSubmit={handleSendMessage} className="glowskin-chat-send-form">
                  <button
                    type="button"
                    className="glowskin-chat-exit-session"
                    onClick={handleExitChat}
                    title="Thoát cuộc hội thoại"
                  >
                    Thoát
                  </button>
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                  />
                  <button type="submit" className="glowskin-chat-send-btn" aria-label="Gửi">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
