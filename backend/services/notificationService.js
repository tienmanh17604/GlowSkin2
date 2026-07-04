import dotenv from "dotenv";

dotenv.config();

/**
 * Returns the appropriate emoji for each order status.
 * @param {string} status The order status string.
 * @returns {string} The colored emoji.
 */
const getStatusEmoji = (status) => {
  if (!status) return "🟡";
  const st = status.toLowerCase().trim();
  if (st.includes("đang xử lý") || st.includes("chờ xử lý") || st.includes("thanh toán")) {
    return "🟡"; // Màu vàng
  }
  if (st.includes("đã giao") || st.includes("hoàn thành") || st.includes("thành công")) {
    return "🟢"; // Màu xanh lá
  }
  if (st.includes("hủy") || st.includes("đã hủy")) {
    return "🔴"; // Màu đỏ
  }
  return "🟡"; // Mặc định màu vàng
};

/**
 * Sends notifications about a new order to Telegram.
 * @param {Object} order The placed order object.
 */
export async function sendOrderNotifications(order) {
  const {
    id,
    customerName,
    phone,
    address,
    paymentMethod,
    items,
    totalPrice,
    status,
    date,
  } = order;

  // Format product list for telegram text with a link to see the image
  const itemsTextTelegram = items
    .map(
      (item) =>
        `- <b>${item.name}</b> (${item.brand})\n  SL: ${item.quantity} x ${item.price.toLocaleString("vi-VN")} đ = ${(
          item.price * item.quantity
        ).toLocaleString("vi-VN")} đ${item.image ? ` (<a href="${item.image}">Xem ảnh</a>)` : ""}`
    )
    .join("\n");

  // Send Telegram Notification
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId) {
    const tgMessage = `📦 <b>ĐƠN HÀNG MỚI ĐÃ ĐƯỢC ĐẶT!</b>
----------------------------------
Mã đơn hàng: <code>#${id}</code>
Ngày đặt: ${date}
Khách hàng: <b>${customerName}</b>
Số điện thoại: <code>${phone}</code>
Địa chỉ: ${address}
Thanh toán: <b>${paymentMethod}</b>
Trạng thái: ${getStatusEmoji(status)} <b>${status}</b>
----------------------------------
<b>Danh sách sản phẩm:</b>
${itemsTextTelegram}
----------------------------------
💰 <b>Tổng tiền: ${totalPrice.toLocaleString("vi-VN")} đ</b>`;

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
            disable_web_page_preview: true,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Lỗi gửi tin nhắn Telegram:", errorData);
      } else {
        console.log("Đã gửi thông báo Telegram thành công!");
      }
    } catch (err) {
      console.error("Lỗi kết nối API Telegram:", err);
    }
  } else {
    console.warn("Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Bỏ qua gửi thông báo Telegram.");
  }
}

/**
 * Sends a notification when an order status is updated.
 * @param {Object} order The updated order object.
 */
export async function sendOrderStatusUpdateNotification(order) {
  const { id, customerName, phone, status, totalPrice } = order;

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId) {
    const tgMessage = `🔔 <b>CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG!</b>
----------------------------------
Mã đơn hàng: <code>#${id}</code>
Khách hàng: <b>${customerName}</b>
Số điện thoại: <code>${phone}</code>
----------------------------------
Trạng thái mới: ${getStatusEmoji(status)} <b>${status}</b>
----------------------------------
💰 Tổng tiền: ${totalPrice.toLocaleString("vi-VN")} đ`;

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
            disable_web_page_preview: true,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Lỗi gửi cập nhật trạng thái Telegram:", errorData);
      } else {
        console.log(`Đã gửi cập nhật trạng thái đơn #${id} lên Telegram!`);
      }
    } catch (err) {
      console.error("Lỗi kết nối API Telegram:", err);
    }
  }
}
