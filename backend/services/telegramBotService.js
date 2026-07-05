import Message from "../models/Message.js";

// Cache to prevent duplicate processing of the same Telegram update ID (useful for race conditions and retries)
const processedUpdateIds = new Set();

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
 * Processes a single Telegram message update (used by both Polling and Webhook)
 */
export async function processTelegramMessageUpdate(update) {
  const updateId = update.update_id;
  if (updateId) {
    if (processedUpdateIds.has(updateId)) {
      console.log(`Bỏ qua update trùng lặp từ bộ nhớ cache: ${updateId}`);
      return false;
    }
    processedUpdateIds.add(updateId);
    // Remove from set after 30 seconds to manage memory
    setTimeout(() => {
      processedUpdateIds.delete(updateId);
    }, 30000);
  }

  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  const message = update.message;
  if (!message || !message.text || !message.reply_to_message) return false;

  // Check if the reply is from the authorized Admin chat ID
  const chatId = String(message.chat.id);
  const adminChatId = String(tgChatId);
  if (chatId !== adminChatId) {
    console.log(`Bỏ qua tin nhắn từ Chat ID không hợp lệ: ${chatId}`);
    return false;
  }

  const replyToText = message.reply_to_message.text || "";
  
  // Extract phone number from the original message template
  const phoneMatch = replyToText.match(/SĐT:\s*([0-9+]+)/);
  if (!phoneMatch) return false;
  const customerPhone = phoneMatch[1].trim();

  try {
    // Deduplication check to prevent duplicate saves from polling and webhook
    const timeLimit = new Date(Date.now() - 4000);
    const duplicate = await Message.findOne({
      phone: customerPhone,
      sender: "admin",
      text: message.text,
      createdAt: { $gte: timeLimit }
    });

    if (duplicate) {
      console.log(`Bỏ qua tin nhắn trùng lặp trong vòng 4 giây cho khách hàng ${customerPhone}`);
      return false;
    }

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
    return true;
  } catch (err) {
    console.error("Lỗi lưu tin nhắn từ Telegram vào Database:", err);
    return false;
  }
}

/**
 * Registers Webhook URL with Telegram Bot API
 */
export async function registerTelegramWebhook(hostUrl) {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!tgToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const webhookUrl = `${hostUrl}/api/telegram-webhook`;
  const response = await fetch(
    `https://api.telegram.org/bot${tgToken}/setWebhook?url=${webhookUrl}`
  );
  const data = await response.json();
  if (!response.ok || !data.ok) {
    console.error("Lỗi đăng ký Webhook Telegram:", data);
    throw new Error(data.description || "Failed to set Telegram webhook");
  }

  console.log(`Đăng ký Webhook Telegram thành công: ${webhookUrl}`);
  return data;
}

/**
 * Starts polling Telegram updates to listen for admin's replies (used for local testing)
 */
export async function startTelegramBotPolling() {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (!tgToken || !tgChatId) {
    console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Telegram chat polling is disabled.");
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
            await processTelegramMessageUpdate(update);
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
