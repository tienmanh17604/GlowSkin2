import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";

// Force Google DNS to resolve MongoDB Atlas SRV records properly
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Review from "./models/Review.js";
import Message from "./models/Message.js";
import { sendOrderNotifications, sendOrderStatusUpdateNotification } from "./services/notificationService.js";
import { sendTelegramChatMessage, startTelegramBotPolling, processTelegramMessageUpdate, registerTelegramWebhook } from "./services/telegramBotService.js";
import { uploadImage, uploadVideo, deleteFromCloudinary } from "./config/cloudinary.js";
import { PayOS } from "@payos/node";

dotenv.config();

// Khởi tạo PayOS client
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/glowskin";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// --- API Endpoints ---

// 1. PRODUCTS ENDPOINTS
// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách sản phẩm", error: error.message });
  }
});

// POST a new product
app.post("/api/products", async (req, res) => {
  try {
    const productData = req.body;
    const newProduct = new Product({
      ...productData,
      rating: 5.0,
      reviews: 0,
      price: Number(productData.price),
      stock: Number(productData.stock),
      skinTypes: productData.skinTypes || [],
      concerns: productData.concerns || [],
      ingredients: productData.ingredients || [],
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: "Không thể tạo sản phẩm mới", error: error.message });
  }
});

// PUT (update) an existing product
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    
    // Find by custom 'id' string field
    const updatedProduct = await Product.findOneAndUpdate(
      { id: id },
      { $set: updatedData },
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: "Không thể cập nhật sản phẩm", error: error.message });
  }
});

// DELETE a product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findOneAndDelete({ id: id });
    
    if (!deletedProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    
    res.json({ message: "Xóa sản phẩm thành công", id });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa sản phẩm", error: error.message });
  }
});


// 2. USERS & AUTH ENDPOINTS
// GET all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password from list
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách người dùng", error: error.message });
  }
});

// POST login
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user && user.password === password) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi đăng nhập", error: error.message });
  }
});

// POST register
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email này đã được đăng ký!" });
    }
    
    const newUser = new User({
      id: "u_" + Date.now(),
      name,
      email,
      password,
      role: "user",
      membership: "Free",
    });
    
    const savedUser = await newUser.save();
    res.status(201).json({ success: true, user: savedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi đăng ký tài khoản", error: error.message });
  }
});

// PUT update user membership
app.put("/api/users/:id/membership", async (req, res) => {
  try {
    const { id } = req.params;
    const { membership } = req.body;
    
    const updatedUser = await User.findOneAndUpdate(
      { id: id },
      { $set: { membership } },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: "Không thể cập nhật thành viên", error: error.message });
  }
});


// 3. ORDERS ENDPOINTS
// GET all orders
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách đơn hàng", error: error.message });
  }
});

// POST place order
app.post("/api/orders", async (req, res) => {
  try {
    const { formData, cartItems, totalPrice, overrideStatus } = req.body;
    
    // Generate order code
    const code = "GS" + Math.floor(100000 + Math.random() * 900000);
    
    const getPaymentMethodLabel = (method) => {
      if (method === "cod") return "COD";
      if (method === "payos") return "PayOS";
      if (method === "vnpay") return "Ví VNPay";
      return "Chuyển khoản QR";
    };

    const newOrder = new Order({
      id: code,
      customerName: formData.name,
      phone: formData.phone,
      address: formData.address,
      paymentMethod: getPaymentMethodLabel(formData.payment),
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      totalPrice,
      status: overrideStatus || "Chờ xử lý",
      date: new Date().toLocaleString("vi-VN"),
    });
    
    const savedOrder = await newOrder.save();
    
    // Update inventory stock for each product in the order
    for (const item of cartItems) {
      const product = await Product.findOne({ id: item.id });
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
      }
    }

    // Gửi thông báo đơn hàng qua Email và Telegram (không chặn phản hồi API)
    sendOrderNotifications(savedOrder).catch((err) => {
      console.error("Lỗi khi gửi thông báo đơn hàng:", err);
    });
    
    res.status(201).json({ success: true, orderId: code, order: savedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: "Không thể đặt hàng", error: error.message });
  }
});

// PUT update order status
app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedOrder = await Order.findOneAndUpdate(
      { id: id },
      { $set: { status } },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Gửi thông báo cập nhật trạng thái đơn hàng qua Telegram (không chặn phản hồi API)
    sendOrderStatusUpdateNotification(updatedOrder).catch((err) => {
      console.error("Lỗi khi gửi thông báo cập nhật trạng thái đơn hàng:", err);
    });
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: "Không thể cập nhật trạng thái đơn hàng", error: error.message });
  }
});


// 4. REVIEWS ENDPOINTS
// GET all reviews (Admin)
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách đánh giá", error: error.message });
  }
});

// GET reviews for a product
app.get("/api/reviews/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy đánh giá của sản phẩm", error: error.message });
  }
});

// Helper function to update product rating stats
async function updateProductRatingStats(productId) {
  const reviews = await Review.find({ productId });
  const reviewsCount = reviews.length;
  let averageRating = 5.0; // default to 5 if no reviews

  if (reviewsCount > 0) {
    const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    averageRating = Number((sum / reviewsCount).toFixed(1));
  }

  await Product.findOneAndUpdate(
    { id: productId },
    { $set: { rating: averageRating, reviews: reviewsCount } }
  );
}

// POST a new review
app.post("/api/reviews", async (req, res) => {
  try {
    const { productId, userName, rating, comment } = req.body;
    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin đánh giá" });
    }

    const newReview = new Review({
      productId,
      userName,
      rating: Number(rating),
      comment,
    });

    const savedReview = await newReview.save();

    // Update product rating and count in database
    await updateProductRatingStats(productId);

    res.status(201).json(savedReview);
  } catch (error) {
    res.status(400).json({ message: "Không thể gửi đánh giá", error: error.message });
  }
});

// DELETE a review (Admin)
app.delete("/api/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Update product rating and count in database
    await updateProductRatingStats(deletedReview.productId);

    res.json({ message: "Xóa đánh giá thành công", id });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa đánh giá", error: error.message });
  }
});


// 5. PAYMENT GATEWAY API INTEGRATIONS
// POST Create VNPAY URL
app.post("/api/payments/create-vnpay-url", (req, res) => {
  try {
    const { amount, orderId } = req.body;
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const tmnCode = "2QX1X151";
    const secretKey = "GET8Y18C2ZJ72251E9S2E4N4N7D1H1L1";
    const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = `http://localhost:5173/products?paymentStatus=vnpay_success&orderCode=${orderId}`;

    const date = new Date();
    const createDate = date.getFullYear() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2) +
      ('0' + date.getHours()).slice(-2) +
      ('0' + date.getMinutes()).slice(-2) +
      ('0' + date.getSeconds()).slice(-2);

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang tai GlowSkin AI';
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sort parameters alphabetically
    const sortedParams = {};
    const keys = Object.keys(vnp_Params).sort();
    for (let i = 0; i < keys.length; i++) {
      sortedParams[keys[i]] = vnp_Params[keys[i]];
    }

    // Build query string using exact VNPAY standards (key=value, value encoded with %20 replaced by +)
    const signData = Object.keys(sortedParams)
      .map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(sortedParams[key]).replace(/%20/g, '+');
      })
      .join('&');

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
    res.json({ paymentUrl });
  } catch (error) {
    console.error("Lỗi khi tạo VNPay URL:", error);
    res.status(500).json({ message: "Không thể tạo liên kết thanh toán VNPay" });
  }
});

// POST Create PayOS payment link
app.post("/api/payments/create-payos-url", async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    // PayOS yêu cầu orderCode là số nguyên
    const orderCode = parseInt(orderId.replace(/\D/g, "").slice(-9)) || Date.now() % 1000000000;

    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

    const paymentLinkData = {
      orderCode,
      amount,
      description: `GlowSkin ${orderId}`,
      returnUrl: `${baseUrl}/products?paymentStatus=payos_success&orderCode=${orderId}`,
      cancelUrl: `${baseUrl}/products?paymentStatus=payos_cancel&orderCode=${orderId}`,
    };

    const paymentLink = await payos.paymentRequests.create(paymentLinkData);
    res.json({ paymentUrl: paymentLink.checkoutUrl });
  } catch (error) {
    console.error("Lỗi khi tạo PayOS URL:", error);
    res.status(500).json({ message: "Không thể tạo liên kết thanh toán PayOS", error: error.message });
  }
});

// POST PayOS webhook (xác nhận thanh toán thành công)
app.post("/api/payments/payos-webhook", async (req, res) => {
  try {
    const webhookData = payos.webhooks.verify(req.body);
    console.log("PayOS Webhook:", webhookData);
    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi PayOS webhook:", error);
    res.status(400).json({ success: false });
  }
});


// 6. CHAT SUPPORT ENDPOINTS
// GET all chat sessions (Admin)
app.get("/api/chats", async (req, res) => {
  try {
    const sessions = await Message.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$phone",
          customerName: { $last: "$customerName" },
          lastMessage: { $last: "$text" },
          lastMessageAt: { $last: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$sender", "user"] }, { $ne: ["$readByAdmin", true] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách cuộc trò chuyện", error: error.message });
  }
});

// GET all messages in a specific chat session
app.get("/api/chats/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const { markRead } = req.query;

    const messages = await Message.find({ phone }).sort({ createdAt: 1 });

    if (markRead === "true") {
      await Message.updateMany({ phone, sender: "user", readByAdmin: false }, { $set: { readByAdmin: true } });
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy lịch sử tin nhắn", error: error.message });
  }
});

// POST a new message
app.post("/api/chats", async (req, res) => {
  try {
    const { sender, customerName, phone, text } = req.body;
    if (!sender || !customerName || !phone || !text) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin tin nhắn" });
    }

    const newMessage = new Message({
      sender,
      customerName,
      phone,
      text,
      readByAdmin: sender === "admin"
    });

    const savedMessage = await newMessage.save();

    // Forward to Telegram if sent by a user (customer)
    if (sender === "user") {
      sendTelegramChatMessage(customerName, phone, text).catch((err) =>
        console.error("Lỗi khi chuyển tiếp tin nhắn đến Telegram:", err)
      );
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(400).json({ message: "Không thể gửi tin nhắn", error: error.message });
  }
});


// POST webhook from Telegram
app.post("/api/telegram-webhook", async (req, res) => {
  try {
    const update = req.body;
    if (update) {
      await processTelegramMessageUpdate(update);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Lỗi xử lý webhook Telegram:", error);
    res.sendStatus(500);
  }
});

// GET endpoint to set up Telegram webhook automatically
app.get("/api/telegram-webhook-setup", async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const hostUrl = `${protocol}://${host}`;

    const result = await registerTelegramWebhook(hostUrl);
    res.json({
      success: true,
      message: "Đăng ký Webhook Telegram thành công!",
      webhookUrl: `${hostUrl}/api/telegram-webhook`,
      telegramResponse: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể đăng ký Webhook Telegram",
      error: error.message,
    });
  }
});


// 7. CLOUDINARY UPLOAD ENDPOINTS
// POST upload ảnh sản phẩm
app.post("/api/upload/image", uploadImage.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh để upload" });
    }
    res.json({
      success: true,
      url: req.file.path,         // URL công khai trên Cloudinary
      publicId: req.file.filename, // Public ID để xóa sau này
    });
  } catch (error) {
    res.status(500).json({ message: "Không thể upload ảnh", error: error.message });
  }
});

// POST upload nhiều ảnh sản phẩm (tối đa 5 ảnh)
app.post("/api/upload/images", uploadImage.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 ảnh" });
    }
    const uploadedFiles = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    res.status(500).json({ message: "Không thể upload ảnh", error: error.message });
  }
});

// POST upload video sản phẩm
app.post("/api/upload/video", uploadVideo.single("video"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn video để upload" });
    }
    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ message: "Không thể upload video", error: error.message });
  }
});

// DELETE xóa file trên Cloudinary
app.delete("/api/upload/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query; // "image" hoặc "video"
    const result = await deleteFromCloudinary(publicId, resourceType || "image");
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa file", error: error.message });
  }
});


// Default root route
app.get("/", (req, res) => {
  res.send("GlowSkin API is running...");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (!process.env.VERCEL) {
    startTelegramBotPolling();
  } else {
    console.log("Môi trường Vercel (Serverless) được phát hiện. Vòng lặp Polling bị vô hiệu hóa.");
  }
});
