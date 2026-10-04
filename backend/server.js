import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Review from "./models/Review.js";
import Message from "./models/Message.js";
import SkinTrainingKnowledge from "./models/SkinTrainingKnowledge.js";
import { sendOrderNotifications, sendOrderStatusUpdateNotification } from "./services/notificationService.js";
import { sendTelegramChatMessage, startTelegramBotPolling, processTelegramMessageUpdate, registerTelegramWebhook } from "./services/telegramBotService.js";
import { uploadImage, uploadVideo, deleteFromCloudinary } from "./config/cloudinary.js";
import { PayOS } from "@payos/node";
import { localDb } from "./services/localDbService.js";

dotenv.config(); // Reloads .env configuration with latest API keys

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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/glowskin";
let isMongoConnected = false;

// Do not buffer commands indefinitely when MongoDB is disconnected
mongoose.set("bufferCommands", false);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
  })
  .then(() => {
    isMongoConnected = true;
    console.log("--> Đã kết nối MongoDB Atlas thành công! ✅");
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn("--> ⚠️ Chưa kết nối được MongoDB Atlas (Vui lòng whitelist IP trên Atlas Network Access nếu cần):", err.message);
    console.log("--> 💡 Đang kích hoạt chế độ CSDL Cục Bộ (Local JSON Storage) để Đăng Nhập, Đăng Ký, Sản Phẩm hoạt động bình thường tức thì!");
  });

mongoose.connection.on("connected", () => {
  isMongoConnected = true;
  console.log("--> MongoDB connection established.");
});
mongoose.connection.on("disconnected", () => {
  isMongoConnected = false;
  console.warn("--> MongoDB disconnected. Using Local JSON fallback.");
});

// --- API Endpoints ---

// 1. PRODUCTS ENDPOINTS
// GET all products
app.get("/api/products", async (req, res) => {
  try {
    if (isMongoConnected) {
      const products = await Product.find().sort({ createdAt: -1 });
      if (products && products.length > 0) {
        return res.json(products);
      }
    }
  } catch (error) {
    console.warn("MongoDB products query failed, using localDb:", error.message);
  }
  const localProducts = localDb.getProducts();
  res.json(localProducts);
});

// POST a new product
app.post("/api/products", async (req, res) => {
  try {
    const productData = req.body;
    const newProduct = {
      ...productData,
      rating: 5.0,
      reviews: 0,
      price: Number(productData.price),
      stock: Number(productData.stock),
      skinTypes: productData.skinTypes || [],
      concerns: productData.concerns || [],
      ingredients: productData.ingredients || [],
    };

    // Save to localDb
    const savedLocal = localDb.saveProduct(newProduct);

    // Also save to MongoDB if connected
    if (isMongoConnected) {
      try {
        const mongoProduct = new Product(newProduct);
        await mongoProduct.save();
      } catch (err) {
        console.warn("Lưu sản phẩm lên MongoDB thất bại:", err.message);
      }
    }

    res.status(201).json(savedLocal);
  } catch (error) {
    res.status(400).json({ message: "Không thể tạo sản phẩm mới", error: error.message });
  }
});

// PUT (update) an existing product
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedLocal = localDb.updateProduct(id, updatedData);

    if (isMongoConnected) {
      try {
        await Product.findOneAndUpdate({ id: id }, { $set: updatedData }, { new: true });
      } catch (err) {
        console.warn("Cập nhật sản phẩm MongoDB thất bại:", err.message);
      }
    }

    if (!updatedLocal) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(updatedLocal);
  } catch (error) {
    res.status(400).json({ message: "Không thể cập nhật sản phẩm", error: error.message });
  }
});

// DELETE a product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLocal = localDb.deleteProduct(id);

    if (isMongoConnected) {
      try {
        await Product.findOneAndDelete({ id: id });
      } catch (err) {
        console.warn("Xóa sản phẩm MongoDB thất bại:", err.message);
      }
    }

    if (!deletedLocal) {
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
    if (isMongoConnected) {
      const users = await User.find().select("-password");
      if (users && users.length > 0) {
        return res.json(users);
      }
    }
  } catch (error) {
    console.warn("MongoDB users query failed, using localDb:", error.message);
  }
  const users = localDb.getUsers().map(({ password, ...u }) => u);
  res.json(users);
});

// POST login
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu!" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check MongoDB first if connected
    if (isMongoConnected) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          if (user.password === password) {
            const userObj = user.toObject ? user.toObject() : user;
            delete userObj.password;
            return res.json({ success: true, user: userObj });
          } else {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
          }
        }
      } catch (err) {
        console.warn("MongoDB login check failed, falling back to localDb:", err.message);
      }
    }

    // 2. Check local database
    const localUser = localDb.findUserByEmail(cleanEmail);
    if (localUser) {
      if (localUser.password === password) {
        const { password: _, ...userSafe } = localUser;
        return res.json({ success: true, user: userSafe });
      } else {
        return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
      }
    }

    return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ success: false, message: "Lỗi đăng nhập", error: error.message });
  }
});

// POST register
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email exists in localDb
    const existingLocal = localDb.findUserByEmail(cleanEmail);
    if (existingLocal) {
      return res.status(400).json({ success: false, message: "Email này đã được đăng ký!" });
    }

    // Check if email exists in MongoDB if connected
    if (isMongoConnected) {
      try {
        const existsMongo = await User.findOne({ email: cleanEmail });
        if (existsMongo) {
          return res.status(400).json({ success: false, message: "Email này đã được đăng ký!" });
        }
      } catch (err) {
        console.warn("MongoDB email check failed:", err.message);
      }
    }

    const newUserData = {
      id: "u_" + Date.now(),
      name: name.trim(),
      preferredName: "",
      email: cleanEmail,
      password: password,
      role: "user",
      membership: "Free",
      addresses: [],
    };

    // Save to localDb
    const savedLocal = localDb.createUser(newUserData);

    // Save to MongoDB if connected
    if (isMongoConnected) {
      try {
        const newUser = new User(newUserData);
        await newUser.save();
      } catch (err) {
        console.warn("MongoDB save user failed:", err.message);
      }
    }

    const { password: _, ...userSafe } = savedLocal;
    res.status(201).json({ success: true, user: userSafe });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ success: false, message: "Lỗi đăng ký tài khoản", error: error.message });
  }
});

// PUT update user profile info
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = decodeURIComponent(id || "").trim();
    const { name, email, phone, addresses, preferredName, gender, birthDate, city, skinSurvey, onboardingCompleted } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (addresses !== undefined) updateFields.addresses = addresses;
    if (preferredName !== undefined) updateFields.preferredName = preferredName;
    if (gender !== undefined) updateFields.gender = gender;
    if (birthDate !== undefined) updateFields.birthDate = birthDate;
    if (city !== undefined) updateFields.city = city;
    if (skinSurvey !== undefined) updateFields.skinSurvey = skinSurvey;
    if (onboardingCompleted !== undefined) updateFields.onboardingCompleted = onboardingCompleted;

    // Update in localDb
    const updatedLocal = localDb.updateUser(cleanId, updateFields);

    // Update in MongoDB if connected
    if (isMongoConnected) {
      try {
        const conditions = [{ id: cleanId }];
        if (mongoose.Types.ObjectId.isValid(cleanId)) {
          conditions.push({ _id: cleanId });
        }
        if (email) {
          conditions.push({ email: email.toLowerCase() });
        }
        await User.findOneAndUpdate({ $or: conditions }, { $set: updateFields }, { new: true });
      } catch (err) {
        console.warn("MongoDB update profile failed:", err.message);
      }
    }

    const { password: _, ...safeUser } = updatedLocal;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Lỗi cập nhật hồ sơ người dùng:", error);
    res.json({
      success: true,
      user: { id: req.params.id, ...req.body }
    });
  }
});

// PUT update user membership
app.put("/api/users/:id/membership", async (req, res) => {
  try {
    const { id } = req.params;
    const { membership } = req.body;

    const updatedLocal = localDb.updateUser(id, { membership });

    if (isMongoConnected) {
      try {
        await User.findOneAndUpdate({ id: id }, { $set: { membership } }, { new: true });
      } catch (err) {
        console.warn("MongoDB update membership failed:", err.message);
      }
    }

    if (!updatedLocal) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const { password: _, ...safeUser } = updatedLocal;
    res.json(safeUser);
  } catch (error) {
    res.status(400).json({ message: "Không thể cập nhật thành viên", error: error.message });
  }
});

// DELETE user permanently from Database
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = decodeURIComponent(id).trim();
    console.log("--> BACKEND DELETE API: Yêu cầu xóa người dùng ID/Email =", cleanId);

    const deletedLocal = localDb.deleteUser(cleanId);

    if (isMongoConnected) {
      try {
        let query = { $or: [{ id: cleanId }, { email: cleanId.toLowerCase() }] };
        if (mongoose.Types.ObjectId.isValid(cleanId)) {
          query = { $or: [{ id: cleanId }, { _id: cleanId }, { email: cleanId.toLowerCase() }] };
        }
        await User.findOneAndDelete(query);
      } catch (err) {
        console.warn("MongoDB delete user failed:", err.message);
      }
    }

    if (!deletedLocal) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({ success: true, message: `Đã xóa vĩnh viễn người dùng ${deletedLocal.name} (${deletedLocal.email})`, user: deletedLocal });
  } catch (error) {
    console.error("Lỗi khi xóa người dùng:", error);
    res.status(400).json({ success: false, message: "Không thể xóa người dùng", error: error.message });
  }
});

// PUT Update user latest scan
app.put("/api/users/:id/latest-scan", async (req, res) => {
  try {
    const { id } = req.params;
    const { latestScan } = req.body;

    localDb.updateUser(id, { latestScan });

    if (isMongoConnected) {
      try {
        await User.findOneAndUpdate(
          { $or: [{ id }, { _id: id }] },
          { latestScan },
          { new: true }
        );
      } catch (err) {
        console.warn("MongoDB update scan failed:", err.message);
      }
    }

    res.json({ success: true, latestScan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật scan da", error: error.message });
  }
});

// GET user latest scan
app.get("/api/users/:id/latest-scan", async (req, res) => {
  try {
    const { id } = req.params;
    const localUser = localDb.findUserById(id);
    if (localUser && localUser.latestScan) {
      return res.json({ success: true, latestScan: localUser.latestScan });
    }

    if (isMongoConnected) {
      try {
        const user = await User.findOne({ $or: [{ id }, { _id: id }] });
        if (user) {
          return res.json({ success: true, latestScan: user.latestScan || null });
        }
      } catch (err) {
        console.warn("MongoDB get scan failed:", err.message);
      }
    }

    res.json({ success: true, latestScan: localUser?.latestScan || null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lấy scan da", error: error.message });
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

    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
    const baseUrl = process.env.FRONTEND_URL || origin || "http://localhost:5173";

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

// POST PayOS URL for membership upgrade
app.post("/api/payments/create-membership-payos-url", async (req, res) => {
  try {
    const { amount, userId, membership } = req.body;
    const orderCode = Date.now() % 1000000000;

    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
    const baseUrl = process.env.FRONTEND_URL || origin || "http://localhost:5173";

    const paymentLinkData = {
      orderCode,
      amount,
      description: `GlowSkin Upgrade ${membership}`,
      returnUrl: `${baseUrl}/analyze?paymentStatus=success&membership=${membership}&userId=${userId}`,
      cancelUrl: `${baseUrl}/analyze?paymentStatus=cancel&userId=${userId}`,
    };

    const paymentLink = await payos.paymentRequests.create(paymentLinkData);
    res.json({ paymentUrl: paymentLink.checkoutUrl });
  } catch (error) {
    console.error("Lỗi khi tạo PayOS URL nâng cấp hội viên:", error);
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


// POST contact form submission
app.post("/api/contact", async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ các trường bắt buộc (*)" });
    }

    // 1. Send Telegram Notification
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;
    let tgSent = false;

    if (tgToken && tgChatId) {
      const tgMessage = `✉️ <b>LIÊN HỆ MỚI TỪ KHÁCH HÀNG!</b>\n` +
        `----------------------------------\n` +
        `Họ tên: <b>${fullName}</b>\n` +
        `Email: <code>${email}</code>\n` +
        `SĐT: <code>${phone || "Không cung cấp"}</code>\n` +
        `Chủ đề: <b>${subject}</b>\n` +
        `----------------------------------\n` +
        `<b>Nội dung tin nhắn:</b>\n` +
        `<i>${message}</i>`;

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
        if (response.ok) {
          tgSent = true;
        } else {
          const errData = await response.json();
          console.error("Lỗi gửi tin nhắn Telegram từ form liên hệ:", errData);
        }
      } catch (err) {
        console.error("Lỗi kết nối API Telegram trong form liên hệ:", err);
      }
    }

    // 2. Send Email via Nodemailer
    let emailSent = false;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || "smtp.gmail.com",
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === "true" || false,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        const mailOptions = {
          from: `GlowSkin <${emailUser}>`,
          to: "tienmanhworkcontact@gmail.com",
          subject: `[GlowSkin Contact] ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e4e7; border-radius: 10px;">
              <h2 style="color: #8c6239; border-bottom: 2px solid #c39c73; padding-bottom: 10px;">Liên hệ mới từ Khách hàng</h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 150px;">Họ và tên:</td>
                  <td style="padding: 8px 0;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Địa chỉ Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Số điện thoại:</td>
                  <td style="padding: 8px 0;">${phone || "Không cung cấp"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Chủ đề:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${subject}</td>
                </tr>
              </table>
              <hr style="border: 0; border-top: 1px solid #ebdcd0; margin: 20px 0;" />
              <p style="font-weight: bold; color: #8c6239;">Nội dung tin nhắn:</p>
              <div style="background-color: #faf8f5; padding: 15px; border-radius: 8px; border-left: 4px solid #c39c73; line-height: 1.6; white-space: pre-line;">
                ${message}
              </div>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; text-align: center;">Thư này được gửi tự động từ form liên hệ của trang web GlowSkin.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (err) {
        console.error("Lỗi gửi liên hệ qua Email:", err);
      }
    } else {
      console.warn("Chưa cấu hình EMAIL_USER hoặc EMAIL_PASS trong .env. Bỏ qua gửi Email, chỉ gửi qua Telegram.");
    }

    if (tgSent || emailSent) {
      res.json({
        success: true,
        message: "Gửi liên hệ thành công! Đội ngũ của chúng tôi đã nhận được thông tin và sẽ phản hồi sớm nhất có thể.",
        details: { telegram: tgSent, email: emailSent }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Hệ thống gặp sự cố khi xử lý gửi liên hệ. Vui lòng gọi trực tiếp Hotline hoặc gửi Email."
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// Load local training AI skin knowledge dataset as fallback (originating from Training AI mô tả.xlsx)
const trainingKnowledgePath = path.join(__dirname, "data/training_ai_skin_knowledge.json");
function loadLocalTrainingKnowledge() {
  try {
    if (fs.existsSync(trainingKnowledgePath)) {
      return JSON.parse(fs.readFileSync(trainingKnowledgePath, "utf-8"));
    }
  } catch (e) {
    console.error("Lỗi nạp training_ai_skin_knowledge.json:", e);
  }
  return [];
}

let localTrainingKnowledge = loadLocalTrainingKnowledge();
console.log(`--> Đã nạp ${localTrainingKnowledge.length} hồ sơ Training AI Da Liễu từ file Excel mới nhất vào bộ nhớ.`);

// POST Search Training / Medical Knowledge via MongoDB Atlas or Local JSON (Excel dataset)
app.post("/api/medical/search", async (req, res) => {
  try {
    const { query, category } = req.body;
    let results = [];

    if (isMongoConnected) {
      try {
        const filter = {};
        if (category) filter.category = { $regex: category, $options: "i" };
        if (query && query.trim()) {
          const terms = query.trim().split(/\s+/).filter(w => w.length > 1);
          const regexArr = terms.map(t => new RegExp(t, "i"));
          filter.$or = [
            { condition: { $in: regexArr } },
            { category: { $in: regexArr } },
            { visualSigns: { $in: regexArr } },
            { distinctiveFeatures: { $in: regexArr } }
          ];
        }
        results = await SkinTrainingKnowledge.find(filter).limit(6).lean();
      } catch (dbErr) {
        console.warn("MongoDB search fallback to local training JSON:", dbErr.message);
      }
    }

    if (!results || results.length === 0) {
      const all = localTrainingKnowledge.length ? localTrainingKnowledge : loadLocalTrainingKnowledge();
      results = all.filter(item => {
        let match = true;
        if (category && !item.category.toLowerCase().includes(category.toLowerCase())) match = false;
        if (query) {
          const q = query.toLowerCase();
          const inCond = item.condition.toLowerCase().includes(q);
          const inCat = item.category.toLowerCase().includes(q);
          const inSigns = (item.visualSigns || "").toLowerCase().includes(q);
          if (!inCond && !inCat && !inSigns) match = false;
        }
        return match;
      });
    }

    res.json({
      success: true,
      source: "Training AI mô tả.xlsx",
      count: results.length,
      results: results.slice(0, 6)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tìm kiếm dữ liệu đào tạo AI", error: err.message });
  }
});

// Function to build unified clinical context exclusively from Training AI knowledge base (Excel: Training AI mô tả.xlsx)
function getIntegratedClinicalKnowledge({ query = "", skinType = "", category = "" }) {
  const queryLower = (query || "").toLowerCase();
  const allTraining = localTrainingKnowledge.length ? localTrainingKnowledge : loadLocalTrainingKnowledge();

  const scoredTraining = allTraining.map((t) => {
    let score = 0;
    const condLower = (t.condition || "").toLowerCase();
    const catLower = (t.category || "").toLowerCase();
    const signsLower = (t.visualSigns || "").toLowerCase();
    const lookalikesLower = (t.lookalikes || "").toLowerCase();
    const featuresLower = (t.distinctiveFeatures || "").toLowerCase();

    if (queryLower) {
      if (condLower.includes(queryLower)) score += 20;
      if (catLower.includes(queryLower)) score += 15;
      const qTerms = queryLower.split(/\s+/).filter((w) => w.length > 1);
      for (const term of qTerms) {
        if (condLower.includes(term)) score += 8;
        if (catLower.includes(term)) score += 5;
        if (signsLower.includes(term)) score += 3;
        if (featuresLower.includes(term)) score += 3;
        if (lookalikesLower.includes(term)) score += 4;
      }
    }

    // Default core bonuses for common facial dermatological issues
    if (condLower.includes("mụn đầu đen") || condLower.includes("sợi bã nhờn")) score += 6;
    if (condLower.includes("mụn đầu trắng") || condLower.includes("mụn ẩn")) score += 6;
    if (condLower.includes("lỗ chân lông")) score += 6;
    if (condLower.includes("thâm mụn") || condLower.includes("không đều màu")) score += 5;

    return { ...t, score };
  });

  scoredTraining.sort((a, b) => b.score - a.score);
  const matchedTraining = queryLower ? scoredTraining.slice(0, 8) : scoredTraining;

  let contextStr = `=== BỘ DỮ LIỆU ĐÀO TẠO THỊ GIÁC AI DA LIỄU (TRAINING AI KNOWLEDGE BASE - EXCEL) ===\n`;
  for (const t of matchedTraining) {
    contextStr += `* [${t.category}] ${t.condition}:\n` +
      `  - Dấu hiệu thị giác: ${t.visualSigns} | Màu sắc: ${t.color} | Bề mặt: ${t.texture} | Kích thước: ${t.typicalSize}\n` +
      `  - Vùng phân bố: ${t.distribution} | Mức độ viêm: ${t.inflammation}\n` +
      `  - Nhận diện đặc trưng: ${t.distinctiveFeatures}\n` +
      `  - Tránh nhầm lẫn với: ${t.lookalikes}\n` +
      `  - Hoạt chất điều trị khuyên dùng: ${t.recommendedIngredientsRaw}\n` +
      `  - Hướng dẫn chăm sóc: ${t.careTips}\n\n`;
  }

  return {
    contextText: contextStr,
    source: "Training AI mô tả.xlsx",
    matchedTraining: matchedTraining.map((t) => ({ condition: t.condition, category: t.category })),
    totalConditions: allTraining.length
  };
}

// GET Unified Clinical Context from newest Excel dataset
app.get("/api/skin/clinical-context", (req, res) => {
  try {
    const { query = "", skinType = "" } = req.query;
    const result = getIntegratedClinicalKnowledge({ query, skinType });
    res.json({
      success: true,
      source: "Training AI mô tả.xlsx",
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tạo context Y khoa từ dữ liệu Excel", error: err.message });
  }
});

// GET Training AI Knowledge Base from MongoDB with local fallback
app.get("/api/skin/training-knowledge", async (req, res) => {
  try {
    const { category, condition, search } = req.query;
    let query = {};
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }
    if (condition) {
      query.condition = { $regex: condition, $options: "i" };
    }
    if (search) {
      query.$or = [
        { condition: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { visualSigns: { $regex: search, $options: "i" } },
        { distinctiveFeatures: { $regex: search, $options: "i" } }
      ];
    }

    let results = [];
    try {
      results = await SkinTrainingKnowledge.find(query).sort({ index: 1 }).lean();
    } catch (e) {
      console.warn("MongoDB query SkinTrainingKnowledge fallback to local:", e.message);
    }

    if (!results || results.length === 0) {
      const all = localTrainingKnowledge.length ? localTrainingKnowledge : loadLocalTrainingKnowledge();
      results = all.filter((item) => {
        let match = true;
        if (category && !item.category.toLowerCase().includes(category.toLowerCase())) match = false;
        if (condition && !item.condition.toLowerCase().includes(condition.toLowerCase())) match = false;
        if (search) {
          const s = search.toLowerCase();
          const inCond = item.condition.toLowerCase().includes(s);
          const inCat = item.category.toLowerCase().includes(s);
          const inSigns = (item.visualSigns || "").toLowerCase().includes(s);
          if (!inCond && !inCat && !inSigns) match = false;
        }
        return match;
      });
    }

    res.json({
      success: true,
      total: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi truy vấn dữ liệu Training AI", error: err.message });
  }
});

// GET Overview of Skin Training Knowledge Base (Excel: Training AI mô tả.xlsx)
app.get("/api/skin-diseases/knowledge-base", async (req, res) => {
  try {
    const categories = await SkinTrainingKnowledge.distinct("category");
    const totalRecords = await SkinTrainingKnowledge.countDocuments();
    res.json({
      success: true,
      source: "Training AI mô tả.xlsx",
      totalDiseases: totalRecords,
      categoriesCount: categories.length,
      categories
    });
  } catch (err) {
    const all = localTrainingKnowledge.length ? localTrainingKnowledge : loadLocalTrainingKnowledge();
    const categories = [...new Set(all.map((c) => c.category))];
    res.json({
      success: true,
      source: "Local Training JSON Fallback",
      totalDiseases: all.length,
      categoriesCount: categories.length,
      categories
    });
  }
});

// POST Search Skin Diseases / Concerns from Training AI Excel Dataset
app.post("/api/skin-diseases/search", async (req, res) => {
  try {
    const { query, category, limit = 10 } = req.body;
    let results = [];

    if (isMongoConnected) {
      try {
        let filter = {};
        if (category) filter.category = { $regex: category, $options: "i" };
        if (query && query.trim()) {
          const terms = query.trim().split(/\s+/).filter((w) => w.length > 1);
          const regexArr = terms.map((t) => new RegExp(t, "i"));
          filter.$or = [
            { condition: { $in: regexArr } },
            { category: { $in: regexArr } },
            { visualSigns: { $in: regexArr } },
            { distinctiveFeatures: { $in: regexArr } }
          ];
        }

        results = await SkinTrainingKnowledge.find(filter).limit(Number(limit)).lean();
      } catch (dbErr) {
        console.warn("MongoDB skin training search fallback to local JSON:", dbErr.message);
      }
    }

    if (!results || results.length === 0) {
      const all = localTrainingKnowledge.length ? localTrainingKnowledge : loadLocalTrainingKnowledge();
      results = all.filter((item) => {
        let match = true;
        if (category && !item.category.toLowerCase().includes(category.toLowerCase())) match = false;
        if (query && query.trim()) {
          const q = query.toLowerCase();
          const inCond = item.condition.toLowerCase().includes(q);
          const inCat = item.category.toLowerCase().includes(q);
          const inSigns = (item.visualSigns || "").toLowerCase().includes(q);
          if (!inCond && !inCat && !inSigns) match = false;
        }
        return match;
      });
    }

    res.json({
      success: true,
      source: "Training AI mô tả.xlsx",
      count: results.slice(0, Number(limit)).length,
      results: results.slice(0, Number(limit))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tìm kiếm dữ liệu đào tạo da", error: err.message });
  }
});

// Nạp 6 hình ảnh mẫu đại diện từ bộ dữ liệu đào tạo (Exe_DataPicture) để AI Gemini đối chiếu trực tiếp
const loadTrainingExemplars = () => {
  const base = path.join(__dirname, "data", "Exe_DataPicture");
  const exemplars = [
    {
      category: "Mụn không viêm",
      label: "MẪU 1 (Mụn không viêm): Mụn đầu trắng (nốt vòm kín 1-2mm trắng ngà) và Mụn đầu đen (nút sừng đen cứng ở miệng nang lông)",
      file: path.join(base, "Mụn không viêm-20261004T145648Z-1-001", "Mụn không viêm", "22039-whiteheads.jpg"),
      mime: "image/jpeg"
    },
    {
      category: "Mụn viêm",
      label: "MẪU 2 (Mụn viêm): Sẩn đỏ sưng nề 2-5mm, chóp mủ trắng hoại tử hoặc bọc viêm to sưng đỏ tấy",
      file: path.join(base, "Mụn viêm-20261004T145705Z-1-001", "Mụn viêm", "2-phan-loai-mun-viem-san-mu-boc-nang-scaled.webp"),
      mime: "image/webp"
    },
    {
      category: "Sợi bã nhờn",
      label: "MẪU 3 (Sợi bã nhờn): Chấm nhỏ xám/vàng ngà li ti phân bố đều ở chóp mũi/cánh mũi, bã nhờn mềm ẩm dạng ống, KHÔNG PHẢI NÚT ĐEN CỨNG",
      file: path.join(base, "Sợi bã nhờn-20261004T145759Z-1-001", "Sợi bã nhờn", "soi-ba-nhon-tren-mui.jpg"),
      mime: "image/jpeg"
    },
    {
      category: "Lỗ chân lông",
      label: "MẪU 4 (Lỗ chân lông to): Nang lông mở rộng tạo kết cấu vỏ cam ở má trong kề cánh mũi",
      file: path.join(base, "Lỗ chân lông-20261004T145627Z-1-001", "Lỗ chân lông", "images (1).jpeg"),
      mime: "image/jpeg"
    },
    {
      category: "Sắc tố da",
      label: "MẪU 5 (Sắc tố da): Dát phẳng thâm đỏ PIE hoặc thâm nâu sẫm PIH sau viêm trên nền da",
      file: path.join(base, "Sắc tố da-20261004T145742Z-1-001", "Sắc tố da", "tang-sac-to-da-2.jpg"),
      mime: "image/jpeg"
    },
    {
      category: "Lão hoá da & sẹo",
      label: "MẪU 6 (Sẹo rỗ & lão hoá): Vết lõm đáy nhọn ice-pick, đáy vuông boxcar hoặc lượn sóng rolling",
      file: path.join(base, "Lão hoá da & sẹo-20261004T145554Z-1-001", "Lão hoá da & sẹo", "chua-seo-ro-nang-lau-nam-1.jpg"),
      mime: "image/jpeg"
    }
  ];

  const results = [];
  for (const item of exemplars) {
    try {
      if (fs.existsSync(item.file)) {
        const b64 = fs.readFileSync(item.file).toString("base64");
        results.push({
          category: item.category,
          label: item.label,
          mimeType: item.mime,
          data: b64
        });
      }
    } catch (e) {
      console.warn("Không đọc được ảnh mẫu:", item.file, e.message);
    }
  }
  return results;
};

// POST Phân tích da mặt chuyên sâu kết hợp Training AI Knowledge (Excel) & Gemini AI
app.post("/api/skin/analyze", async (req, res) => {
  try {
    const { image, frontImage, leftImage, rightImage, surveyData = {}, selectedProducts = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Chưa cấu hình GEMINI_API_KEY trên backend server (.env)"
      });
    }

    // 1. Tích hợp dữ liệu từ file Excel mới nhất (Training AI mô tả.xlsx)
    const query = [
      surveyData.skinType || "da hỗn hợp",
      surveyData.skinSensitivity ? `da ${surveyData.skinSensitivity}` : "",
      "mụn trứng cá viêm ẩn thâm sẹo lỗ chân lông"
    ].join(" ");

    const clinical = getIntegratedClinicalKnowledge({ query, skinType: surveyData.skinType });

    // 2. Xây dựng System Instruction & Prompt
    const systemPrompt = `Bạn là Bác sĩ Chuyên gia Da liễu AI của GlowSkin. Nhiệm vụ: Quan sát cực kỳ kỹ lưỡng và khách quan hình ảnh khuôn mặt thực tế của người dùng để đưa ra chẩn đoán Y khoa chính xác 100% theo đúng những gì nhìn thấy trên ảnh.

QUY TẮC CẤM QUAN TRỌNG: TUYỆT ĐỐI KHÔNG ĐƯỢC XUẤT HIỆN CỤM TỪ "Bộ Y Tế" HOẶC "Bộ Y tế" HOẶC "BYT". Hãy dùng cụm từ "Chuyên khoa Da liễu" hoặc "Tiêu chuẩn Y khoa lâm sàng".

DƯỚI ĐÂY LÀ KIẾN THỨC TÍCH HỢP TỪ BỘ DỮ LIỆU ĐÀO TẠO THỊ GIÁC AI (TRAINING AI - EXCEL):
${clinical.contextText}

QUY TẮC ĐÁNH GIÁ THỰC TẾ & QUY CHUẨN THỊ GIÁC LÂM SÀNG (6 ĐẦU MỤC):
1. Đánh giá chi tiết 5 vùng giải phẫu: Trán (forehead), Mắt/Lông mày (eyebrow), Mũi (nose), Má (upper_cheek), Cằm (chin). NẾU VÙNG NÀO SẠCH KHÔNG CÓ MỤN/TỔN THƯƠNG THÌ ĐÁNH GIÁ SẠCH (GREEN), KHÔNG BỊA ĐẶT TỔN THƯƠNG!
2. Phân định status: "green" (sạch khỏe), "yellow" (dầu nhờn/sợi bã nhờn/lỗ chân lông to/mụn ẩn), "red" (ổ viêm đỏ, mụn mủ, thâm đậm sau viêm).
3. Đánh giá 6 chỉ số da (thang 1-10): "mun_viem", "mun_khong_viem", "soi_ba_nhon", "seo", "sac_to_da", "lo_chan_long" cùng mảng tọa độ points [{top: %, left: %}].

4. QUY TRÌNH ĐỐI CHIẾU HÌNH ẢNH MẪU ĐÀO TẠO (BẮT BUỘC):
   - Hãy đối chiếu các tổn thương trên mặt người dùng với 6 ảnh mẫu đào tạo thực tế được cung cấp bên dưới:
     * Nốt có nhân trắng/đen, chìm dưới biểu bì, không sưng đỏ -> Nhóm Mụn không viêm.
     * Nốt sẩn đỏ gồ, mụn mủ chóp trắng/vàng, bọc sưng đỏ tấy -> Nhóm Mụn viêm.
     * Cụm chấm xám/vàng mịn đều trên chóp/cánh mũi -> Nhóm Sợi bã nhờn (tuyệt đối không nhầm là mụn đầu đen).
     * Nang lông mở rộng kết cấu vỏ cam ở má cạnh mũi -> Nhóm Lỗ chân lông.
     * Vết đốm phẳng thâm đỏ (PIE) hoặc thâm sẫm (PIH) -> Nhóm Sắc tố da.
     * Vết lõm đáy nhọn, đáy vuông hoặc lượn sóng -> Nhóm Sẹo.

QUY TẮC ĐỊNH VỊ TỌA ĐỘ VÒNG TRÒN TRÊN GÓC CHÍNH DIỆN & GÓC NGHIÊNG:
1. GÓC NGHIÊNG (Má trái hoặc Má phải):
   - Diện tích má quay về camera chiếm vùng rộng từ left: 24% đến 55%, top: 48% đến 72%. NẾU TRÊN MÁ CÓ MỤN, VÒNG TRÒN BẮT BUỘC PHẢI ĐẶT TRÊN MÁ ĐÓ!
   - TUYỆT ĐỐI CẤM: Đặt vòng tròn vào mắt, mí mắt, lông mày (top: 24%-44%), sống mũi giữa hai mắt, hoặc lỗ mũi!
2. GÓC CHÍNH DIỆN:
   - Sợi bã nhờn: CHỈ đặt ở mũi (top: 45%-52%, left: 45%-55%) hoặc rãnh cằm (top: 67%-72%).
   - Mụn viêm / mụn không viêm: Đặt đúng vị trí nốt mụn thực tế trên má (top: 48%-65%), trán (top: 24%-34%), cằm (top: 70%-80%).
Tọa độ phần trăm { top: %, left: % } tính từ mép trên và mép trái của ảnh.

CẤU TRÚC PHẢN HỒI (BẮT BUỘC ĐỦ CÁC THẺ SAU):
===OVERVIEW===
## Báo cáo Phân tích Da Y Khoa ✨
1. **Loại da:** (Dầu / Khô / Hỗn hợp / Nhạy cảm / Bình thường)
2. **Chẩn đoán y khoa chuyên sâu:** (Nhận xét đúng thực trạng quan sát được trong ảnh sau khi đối chiếu với bộ ảnh mẫu đào tạo)
3. **Đánh giá điểm mạnh và hàng rào bảo vệ da**

===ROUTINE===
4. **Lộ trình Routine khuyến nghị chuẩn Chuyên khoa** (Sáng & Tối từng bước)

===INGREDIENTS===
5. **Hoạt chất Y khoa nên dùng & Thành phần nên tránh**

===WARNING===
6. **Lưu ý kích ứng & Thành phần chống chỉ định**

===JSON_DATA===
{
  "score": 75,
  "averageScore": 7.5,
  "scoreLabel": "Phân tích Y Khoa & AI Vision",
  "medicalReference": "Tiêu chuẩn Chuyên Khoa Da Liễu",
  "detectedIssues": ["Lỗ chân lông", "Mụn không viêm"],
  "metrics": {
    "mun_viem": { "score": 9, "label": "Mụn viêm", "dotColor": "#f472b6", "pillColor": "#e11d48", "points": [] },
    "mun_khong_viem": { "score": 7, "label": "Mụn không viêm", "dotColor": "#eab308", "pillColor": "#d97706", "points": [{ "top": 54.0, "left": 36.0 }, { "top": 56.0, "left": 44.0 }] },
    "soi_ba_nhon": { "score": 7, "label": "Sợi bã nhờn", "dotColor": "#8b5cf6", "pillColor": "#6862b5", "points": [{ "top": 48.0, "left": 50.0 }, { "top": 47.0, "left": 46.5 }] },
    "seo": { "score": 8, "label": "Sẹo", "dotColor": "#ef4444", "pillColor": "#dc2626", "points": [] },
    "sac_to_da": { "score": 7, "label": "Sắc tố da", "dotColor": "#ea580c", "pillColor": "#e15b32", "points": [{ "top": 52.0, "left": 34.0 }] },
    "lo_chan_long": { "score": 6, "label": "Lỗ chân lông", "dotColor": "#22c55e", "pillColor": "#16a34a", "points": [{ "top": 50.0, "left": 40.0 }] }
  },
  "summary": [
    { "title": "Phân tích AI Vision", "en": "(Clinical AI Diagnosis)", "desc": "Đối chiếu chuẩn xác từ bộ ảnh đào tạo Exe_DataPicture." }
  ],
  "zones": [
    { "id": "forehead", "title": "Vùng Trán", "condition": "Da tương đối ổn định", "detail": "Không phát hiện ổ viêm lớn", "status": "green" },
    { "id": "eyebrow", "title": "Vùng Mắt & Lông Mày", "condition": "Bình thường", "detail": "Nền da ẩm tốt", "status": "green" },
    { "id": "nose", "title": "Vùng Mũi", "condition": "Sợi bã nhờn cánh mũi", "detail": "Cần làm sạch với BHA nhẹ nhàng", "status": "yellow" },
    { "id": "upper_cheek", "title": "Vùng Má", "condition": "Mụn và sắc tố nhẹ", "detail": "Duy trì làm sạch và phục hồi", "status": "yellow" },
    { "id": "chin", "title": "Vùng Cằm", "condition": "Bình thường", "detail": "Chăm sóc đều đặn", "status": "green" }
  ]
}`;

    // 3. Chuẩn bị các parts: Ảnh mẫu đào tạo + Ảnh người dùng
    let userPromptText = `Hãy phân tích hình ảnh khuôn mặt thực tế của người dùng bằng cách đối chiếu kỹ với 6 ảnh mẫu đào tạo bên dưới.\n`;
    if (surveyData && Object.keys(surveyData).length > 0) {
      userPromptText += `Thông tin người dùng khai báo:\n` +
        `- Loại da tự nhận định: ${surveyData.skinType || "Da hỗn hợp"}\n` +
        `- Độ nhạy cảm: ${surveyData.skinSensitivity || "Bình thường"}\n` +
        `- Bệnh lý/Thuốc điều trị: ${surveyData.hasMedicalCondition || "Không"} / ${surveyData.hasPrescriptionMedication || "Không"}\n` +
        `- Tình trạng mao mạch/đỏ da: ${surveyData.hasBloodVessels || "Không"}\n`;
    }

    if (selectedProducts && selectedProducts.length > 0) {
      userPromptText += `\nCác sản phẩm skincare người dùng đang dùng:\n` +
        selectedProducts.map((p, i) => `${i + 1}. [${p.brand || "Brand"}] ${p.name} - ${p.category || ""}`).join("\n") +
        `\n-> Hãy nhận xét xem các sản phẩm này có phù hợp với thực trạng da quan sát được trên ảnh không.`;
    }

    const parts = [
      { text: `${systemPrompt}\n\n${userPromptText}` }
    ];

    // Nạp các ảnh mẫu đào tạo thực tế từ Exe_DataPicture
    const exemplars = loadTrainingExemplars();
    if (exemplars.length > 0) {
      parts.push({
        text: `\n=== BỘ HÌNH ẢNH MẪU ĐÀO TẠO THỰC TẾ ĐỂ ĐỐI CHIẾU (6 NHÓM TỔN THƯƠNG TỪ EXE_DATAPICTURE) ===\nHãy đối chiếu từng nốt mụn/khuyết điểm trên mặt người dùng với 6 ảnh mẫu sau:`
      });
      for (const ex of exemplars) {
        parts.push({ text: `[ẢNH MẪU ĐỐI CHIẾU: ${ex.category.toUpperCase()}] - ${ex.label}` });
        parts.push({
          inlineData: {
            mimeType: ex.mimeType,
            data: ex.data
          }
        });
      }
    }

    const addImagePart = (imgStr, label = "") => {
      if (!imgStr) return;
      if (label) parts.push({ text: label });
      const match = imgStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      } else {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imgStr
          }
        });
      }
    };

    parts.push({ text: `\n=== HÌNH ẢNH KHUÔN MẶT CỦA NGƯỜI DÙNG CẦN PHÂN TÍCH ===` });
    if (frontImage) addImagePart(frontImage, "📸 ẢNH 1: GÓC CHÍNH DIỆN");
    if (leftImage) addImagePart(leftImage, "📸 ẢNH 2: GÓC NGHIÊNG TRÁI");
    if (rightImage) addImagePart(rightImage, "📸 ẢNH 3: GÓC NGHIÊNG PHẢI");
    if (!frontImage && !leftImage && !rightImage && image) {
    }

    // 4. Gọi Google Gemini Native API qua các candidate models ổn định
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    let aiContent = "";
    let lastError = "";

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const aiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts }] })
        });

        if (aiRes.ok) {
          const data = await aiRes.json();
          aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiContent) {
            console.log(`[Gemini API] Phân tích da thành công với model ${model}`);
            break;
          }
        } else {
          const errData = await aiRes.json().catch(() => ({}));
          const errMsg = errData.error?.message || aiRes.statusText;
          console.warn(`[Gemini API] Model ${model} returned ${aiRes.status}:`, errMsg);
          lastError = errMsg;
        }
      } catch (callErr) {
        console.warn(`[Gemini API] Model ${model} fetch exception:`, callErr.message);
        lastError = callErr.message;
      }
    }

    if (!aiContent) {
      throw new Error(lastError || "Không thể nhận phản hồi từ Gemini Vision API");
    }

    res.json({
      success: true,
      content: aiContent,
      source: "Gemini AI & Skin Training Knowledge (Training AI mô tả.xlsx)",
      matchedTraining: clinical.matchedTraining
    });
  } catch (err) {
    console.error("Lỗi phân tích da /api/skin/analyze:", err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi trong quá trình phân tích da với Gemini AI",
      error: err.message
    });
  }
});

// 7. REMOVE.BG BACKGROUND REMOVAL ENDPOINT
app.post("/api/skin/remove-background", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu ảnh (imageBase64)" });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      console.warn("[Remove.bg] Chưa cấu hình REMOVE_BG_API_KEY trong .env, fallback về ảnh gốc");
      return res.json({ success: false, fallbackImage: imageBase64, message: "Chưa cấu hình API Key" });
    }

    // Tách phần dữ liệu base64 thuần
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const formData = new FormData();
    formData.append("image_file_b64", cleanBase64);
    formData.append("size", "preview"); // 'preview' tối ưu dùng credit miễn phí 50 lượt/tháng
    formData.append("type", "person");
    formData.append("format", "png");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Remove.bg] API trả về status ${response.status}:`, errText);
      return res.json({
        success: false,
        fallbackImage: imageBase64,
        error: `Remove.bg error: ${response.status}`,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(arrayBuffer).toString("base64");
    const transparentDataUrl = `data:image/png;base64,${resultBase64}`;

    console.log("[Remove.bg] Xóa nền ảnh khuôn mặt thành công!");
    return res.json({
      success: true,
      resultImage: transparentDataUrl,
    });
  } catch (error) {
    console.error("[Remove.bg] Lỗi khi xử lý:", error.message);
    return res.json({
      success: false,
      fallbackImage: req.body?.imageBase64,
      error: error.message,
    });
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
