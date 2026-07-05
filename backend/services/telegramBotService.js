import Message from "../models/Message.js";

// Helper to escape HTML characters for Telegram HTML parse mode
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sends a chat message from a website customer to Telegram admin
 */
export async function sendTelegramChatMessage(customerName, phone, text) {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (!tgToken || !tgChatId) {
    console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in .env. Skipping Telegram message forward.");
    return;
  }

  const tgMessage = `💬 <b>TIN NHẮN TỪ KHÁCH HÀNG</b>\nKhách hàng: <b>${escapeHTML(customerName)}</b>\nSĐT: <code>${phone}</code>\n----------------------------------\nNội dung: ${escapeHTML(text)}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${tgToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: tgMessage,
          parse_mode: "HTML",
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Lỗi gửi tin nhắn chat đến Telegram:", errorData);
    }
  } catch (err) {
    console.error("Lỗi kết nối gửi tin nhắn đến Telegram:", err);
  }
}

/**
 * Starts polling Telegram updates to listen for admin's replies
 */
export async function startTelegramBotPolling() {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (!tgToken || !tgChatId) {
    console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Telegram chat integration is disabled.");
    return;
  }

  console.log("Khởi động Telegram Bot Chat Polling...");

  let offset = 0;

  // Initialize offset to skip historical messages on startup
  try {
    const res = await fetch(`https://api.telegram.org/bot${tgToken}/getUpdates?offset=-1&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.result.length > 0) {
        offset = data.result[0].update_id + 1;
        console.log(`Telegram Bot bắt đầu lắng nghe từ update_id: ${offset}`);
      }
    }
  } catch (err) {
    console.error("Lỗi khởi tạo Telegram offset:", err);
  }

  async function handleTelegramUpdate(update) {
    const message = update.message;
    if (!message || !message.text || !message.reply_to_message) return;

    // Check if the reply is from the authorized Admin chat ID
    const chatId = String(message.chat.id);
    const adminChatId = String(tgChatId);
    if (chatId !== adminChatId) {
      console.log(`Bỏ qua tin nhắn từ Chat ID không hợp lệ: ${chatId}`);
      return;
    }

    const replyToText = message.reply_to_message.text || "";
    
    // Extract phone number from the original message template
    // SĐT: 0987654321
    const phoneMatch = replyToText.match(/SĐT:\s*([0-9+]+)/);
    if (!phoneMatch) return;
    const customerPhone = phoneMatch[1].trim();

    try {
      // Find the latest customer message to get customerName
      const lastMsg = await Message.findOne({ phone: customerPhone }).sort({ createdAt: -1 });
      const customerName = lastMsg ? lastMsg.customerName : "Khách hàng";

      // Save admin reply message to database
      const adminMessage = new Message({
        sender: "admin",
        customerName,
        phone: customerPhone,
        text: message.text,
        readByAdmin: true,
      });

      await adminMessage.save();
      console.log(`Đã lưu tin nhắn phản hồi từ Telegram cho khách hàng ${customerPhone}: "${message.text}"`);
    } catch (err) {
      console.error("Lỗi lưu tin nhắn từ Telegram vào Database:", err);
    }
  }

  async function poll() {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${tgToken}/getUpdates?offset=${offset}&limit=10&timeout=2`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            await handleTelegramUpdate(update);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi kết nối khi poll Telegram updates:", err.message);
    }
    // Schedule next poll in 2 seconds
    setTimeout(poll, 2000);
  }

  // Start the poll loop
  setTimeout(poll, 2000);
}
