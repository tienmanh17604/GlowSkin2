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
import MedicalGuideline from "./models/MedicalGuideline.js";
import SkinDiseaseKnowledge from "./models/SkinDiseaseKnowledge.js";
import { sendOrderNotifications, sendOrderStatusUpdateNotification } from "./services/notificationService.js";
import { sendTelegramChatMessage, startTelegramBotPolling, processTelegramMessageUpdate, registerTelegramWebhook } from "./services/telegramBotService.js";
import { uploadImage, uploadVideo, deleteFromCloudinary } from "./config/cloudinary.js";
import { PayOS } from "@payos/node";
import { localDb } from "./services/localDbService.js";

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

// Load local medical guidelines dataset as fallback
const medicalGuidelinesPath = path.join(__dirname, "data/medical_guidelines.json");
function loadLocalMedicalGuidelines() {
  try {
    if (fs.existsSync(medicalGuidelinesPath)) {
      return JSON.parse(fs.readFileSync(medicalGuidelinesPath, "utf-8"));
    }
  } catch (e) {
    console.error("Lỗi nạp medical_guidelines.json:", e);
  }
  return [];
}

let localMedicalGuidelines = loadLocalMedicalGuidelines();
console.log(`--> Đã nạp ${localMedicalGuidelines.length} bài hướng dẫn Y Khoa & AI Skincare vào bộ nhớ dự phòng.`);

// POST Search Medical Guidelines by disease/keyword/category via MongoDB Atlas
app.post("/api/medical/search", async (req, res) => {
  try {
    const { query, category } = req.body;

    // 1. Try querying MongoDB Atlas first
    let mongoResults = [];
    try {
      const filter = {};
      if (category) {
        filter.categories = { $regex: category, $options: "i" };
      }

      if (query && query.trim()) {
        const terms = query.trim().split(/\s+/).filter(w => w.length > 1);
        const regexArr = terms.map(t => new RegExp(t, "i"));

        filter.$or = [
          { title: { $in: regexArr } },
          { content: { $in: regexArr } },
          { keywords: { $in: regexArr } }
        ];
      }

      mongoResults = await MedicalGuideline.find(filter).limit(5).lean();
    } catch (dbErr) {
      console.warn("MongoDB search fallback to local JSON:", dbErr.message);
    }

    if (mongoResults && mongoResults.length > 0) {
      return res.json({
        success: true,
        source: "MongoDB Atlas",
        count: mongoResults.length,
        results: mongoResults.map(r => ({
          id: r.guidelineId || r._id,
          source: r.source,
          title: r.title,
          categories: r.categories,
          content: r.content,
          keywords: r.keywords
        }))
      });
    }

    // 2. Fallback to local JSON dataset
    localMedicalGuidelines = loadLocalMedicalGuidelines();
    let filteredList = localMedicalGuidelines;
    if (category) {
      filteredList = localMedicalGuidelines.filter(item =>
        item.categories && item.categories.some(c => c.toLowerCase().includes(category.toLowerCase()))
      );
      if (filteredList.length === 0) filteredList = localMedicalGuidelines;
    }

    if (!query) {
      return res.json({ success: true, source: "Local JSON", results: filteredList.slice(0, 4) });
    }

    const searchTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const scored = filteredList.map(item => {
      let score = 0;
      const titleLower = (item.title || "").toLowerCase();
      const contentLower = (item.content || "").toLowerCase();

      for (const term of searchTerms) {
        if (titleLower.includes(term)) score += 6;
        if (contentLower.includes(term)) score += 1;
      }
      return { ...item, score };
    })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const results = scored.slice(0, 4);
    res.json({
      success: true,
      source: "Local JSON",
      count: results.length,
      results: results.length ? results : filteredList.slice(0, 4)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tìm kiếm tài liệu Y tế", error: err.message });
  }
});

// Load local skin disease knowledge base JSON as fallback
const skinDiseaseKnowledgePath = path.join(__dirname, "data/skin_disease_knowledge_base.json");
function loadLocalSkinDiseaseKnowledge() {
  try {
    if (fs.existsSync(skinDiseaseKnowledgePath)) {
      return JSON.parse(fs.readFileSync(skinDiseaseKnowledgePath, "utf-8"));
    }
  } catch (e) {
    console.error("Lỗi nạp skin_disease_knowledge_base.json:", e);
  }
  return { chapters: [], skin_types: [], lesion_features_for_vision: [] };
}

let localSkinDiseaseData = loadLocalSkinDiseaseKnowledge();
console.log(`--> Đã nạp Skin Disease Knowledge Base (86 bệnh da liễu, 12 chương) vào bộ nhớ dự phòng.`);

// Helper to flatten all local skin diseases from chapters
function getAllLocalSkinDiseases() {
  const list = [];
  for (const chapter of localSkinDiseaseData.chapters || []) {
    for (const d of chapter.diseases || []) {
      list.push({
        diseaseId: (d.name_vi || "").toLowerCase().replace(/[^a-z0-9]/g, "_"),
        name_vi: d.name_vi,
        name_source: d.name_source || d.name_vi,
        english_alias: d.english_alias || "",
        category_vi: chapter.category_vi,
        clinical_visual_features: d.clinical_visual_features || "",
        ai_note: d.ai_note || "",
        lesion_features: localSkinDiseaseData.lesion_features_for_vision || []
      });
    }
  }
  return list;
}

// Function to build unified clinical context from both medical_guidelines.json and skin_disease_knowledge_base.json
function getIntegratedClinicalKnowledge({ query = "", skinType = "", category = "" }) {
  const queryLower = (query || "").toLowerCase();
  const allDiseases = getAllLocalSkinDiseases();
  const allGuidelines = localMedicalGuidelines.length ? localMedicalGuidelines : loadLocalMedicalGuidelines();

  // 1. Match relevant diseases from skin_disease_knowledge_base.json
  const scoredDiseases = allDiseases.map((d) => {
    let score = 0;
    const nameLower = (d.name_vi || "").toLowerCase();
    const aliasLower = (d.english_alias || "").toLowerCase();
    const featuresLower = (d.clinical_visual_features || "").toLowerCase();

    if (queryLower) {
      if (nameLower.includes(queryLower)) score += 15;
      if (aliasLower.includes(queryLower)) score += 12;
      const qTerms = queryLower.split(/\s+/).filter((t) => t.length > 1);
      for (const t of qTerms) {
        if (nameLower.includes(t)) score += 6;
        if (featuresLower.includes(t)) score += 2;
      }
    }

    // Default bonuses for common facial dermatological issues
    if (nameLower.includes("trứng cá") || aliasLower.includes("acne")) score += 8;
    if (nameLower.includes("tăng sắc tố") || aliasLower.includes("post-inflammatory")) score += 6;
    if (nameLower.includes("rám má") || aliasLower.includes("melasma")) score += 6;
    if (nameLower.includes("viêm nang lông")) score += 4;
    if (nameLower.includes("viêm da tiếp xúc") || nameLower.includes("viêm da cơ địa")) score += 4;

    return { ...d, score };
  });

  scoredDiseases.sort((a, b) => b.score - a.score);
  const matchedDiseases = scoredDiseases.slice(0, 4);

  // 2. Match relevant guidelines from medical_guidelines.json
  const scoredGuidelines = allGuidelines.map((g) => {
    let score = 0;
    const titleLower = (g.title || "").toLowerCase();
    const contentLower = (g.content || "").toLowerCase();

    if (queryLower) {
      if (titleLower.includes(queryLower)) score += 15;
      const qTerms = queryLower.split(/\s+/).filter((t) => t.length > 1);
      for (const t of qTerms) {
        if (titleLower.includes(t)) score += 5;
        if (contentLower.includes(t)) score += 1;
      }
    }

    if (titleLower.includes("trứng cá") || titleLower.includes("acnes")) score += 8;
    if (titleLower.includes("thâm do mụn") || titleLower.includes("sắc tố")) score += 7;
    if (titleLower.includes("rám má")) score += 6;

    return { ...g, score };
  });

  scoredGuidelines.sort((a, b) => b.score - a.score);
  const matchedGuidelines = scoredGuidelines.slice(0, 3);

  // Format clean clinical summary (sanitize Bộ Y Tế strings)
  const sanitize = (text) =>
    (text || "")
      .replace(/Bộ\s*Y\s*[tT]ế/gi, "Chuyên khoa Da liễu")
      .replace(/QĐ-BYT/gi, "Y khoa")
      .replace(/Quyết\s*định\s*4416(\/QĐ-BYT)?/gi, "Phác đồ Y khoa")
      .trim();

  let contextStr = `=== TỔNG HỢP KIẾN THỨC Y KHOA DA LIỄU & AI VISION ===\n`;

  contextStr += `\n[1. NHẬN DIỆN THỰC THỂ LÂM SÀNG TỪ BỆNH HỌC DA LIỄU]:\n`;
  for (const d of matchedDiseases) {
    contextStr += `* ${d.name_vi} (${d.english_alias || "Da liễu"}): ${sanitize(d.clinical_visual_features).slice(0, 300)}...\n`;
  }

  contextStr += `\n[2. PHÁC ĐỒ CHẨN ĐOÁN & HOẠT CHẤT ĐIỀU TRỊ CHUYÊN KHOA]:\n`;
  for (const g of matchedGuidelines) {
    contextStr += `* [${sanitize(g.title)}]: ${sanitize(g.content).slice(0, 350)}...\n`;
  }

  return {
    contextText: contextStr,
    matchedDiseases: matchedDiseases.map((d) => ({ name: d.name_vi, alias: d.english_alias, chapter: d.category_vi })),
    matchedGuidelines: matchedGuidelines.map((g) => ({ title: sanitize(g.title) }))
  };
}

// GET Unified Clinical Context from both datasets
app.get("/api/skin/clinical-context", (req, res) => {
  try {
    const { query = "", skinType = "" } = req.query;
    const result = getIntegratedClinicalKnowledge({ query, skinType });
    res.json({
      success: true,
      source: "medical_guidelines.json & skin_disease_knowledge_base.json",
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tạo context Y khoa", error: err.message });
  }
});

// GET Overview of Skin Disease Knowledge Base
app.get("/api/skin-diseases/knowledge-base", async (req, res) => {
  try {
    const categories = await SkinDiseaseKnowledge.distinct("category_vi");
    const totalDiseases = await SkinDiseaseKnowledge.countDocuments();
    res.json({
      success: true,
      source: "MongoDB Atlas",
      totalDiseases,
      categoriesCount: categories.length,
      categories,
      skinTypes: localSkinDiseaseData.skin_types || [],
      lesionFeaturesForVision: localSkinDiseaseData.lesion_features_for_vision || []
    });
  } catch (err) {
    res.json({
      success: true,
      source: "Local JSON Fallback",
      totalDiseases: (localSkinDiseaseData.chapters || []).reduce((acc, c) => acc + (c.diseases || []).length, 0),
      categoriesCount: (localSkinDiseaseData.chapters || []).length,
      categories: (localSkinDiseaseData.chapters || []).map(c => c.category_vi),
      skinTypes: localSkinDiseaseData.skin_types || [],
      lesionFeaturesForVision: localSkinDiseaseData.lesion_features_for_vision || []
    });
  }
});

// POST Search Skin Diseases by query, category, or lesion_features for Skin Analysis
app.post("/api/skin-diseases/search", async (req, res) => {
  try {
    const { query, category, lesionFeatures, limit = 10 } = req.body;

    // 1. Try MongoDB first if connected
    if (isMongoConnected) {
      try {
        let filter = {};
        if (category) filter.category_vi = { $regex: category, $options: "i" };
        if (lesionFeatures && Array.isArray(lesionFeatures) && lesionFeatures.length > 0) {
          filter.lesion_features = { $in: lesionFeatures };
        }
        if (query && query.trim()) {
          const terms = query.trim().split(/\s+/).filter(w => w.length > 1);
          const regexArr = terms.map(t => new RegExp(t, "i"));
          const textConditions = [
            { name_vi: { $in: regexArr } },
            { english_alias: { $in: regexArr } },
            { clinical_visual_features: { $in: regexArr } },
            { category_vi: { $in: regexArr } }
          ];
          filter.$or = textConditions;
        }

        const diseases = await SkinDiseaseKnowledge.find(filter).limit(Number(limit)).lean();
        if (diseases && diseases.length > 0) {
          return res.json({
            success: true,
            source: "MongoDB Atlas",
            count: diseases.length,
            results: diseases
          });
        }
      } catch (dbErr) {
        console.warn("MongoDB skin-diseases search fallback to local JSON:", dbErr.message);
      }
    }

    // 2. Seamless Local JSON Fallback (searching all 12 chapters, 86 diseases)
    const allLocal = getAllLocalSkinDiseases();
    let filtered = allLocal;
    if (category) {
      filtered = filtered.filter(d => (d.category_vi || "").toLowerCase().includes(category.toLowerCase()));
    }
    if (query && query.trim()) {
      const qLower = query.toLowerCase();
      const terms = qLower.split(/\s+/).filter(w => w.length > 1);
      filtered = filtered.filter(d => {
        const text = `${d.name_vi} ${d.english_alias} ${d.clinical_visual_features}`.toLowerCase();
        return terms.some(t => text.includes(t));
      });
    }

    res.json({
      success: true,
      source: "Local JSON Fallback (skin_disease_knowledge_base.json)",
      count: filtered.slice(0, Number(limit)).length,
      results: filtered.slice(0, Number(limit))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tìm kiếm cơ sở dữ liệu bệnh da liễu", error: err.message });
  }
});

// POST Phân tích da mặt chuyên sâu kết hợp Medical Guidelines, Skin Disease Knowledge Base & Gemini AI
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

    // 1. Tích hợp dữ liệu từ medical_guidelines.json & skin_disease_knowledge_base.json
    const query = [
      surveyData.skinType || "da hỗn hợp",
      surveyData.skinSensitivity ? `da ${surveyData.skinSensitivity}` : "",
      "mụn trứng cá viêm ẩn thâm sẹo lỗ chân lông"
    ].join(" ");

    const clinical = getIntegratedClinicalKnowledge({ query, skinType: surveyData.skinType });

    // 2. Xây dựng System Instruction & Prompt
    const systemPrompt = `Bạn là Bác sĩ Chuyên gia Da liễu AI của GlowSkin. Nhiệm vụ: Quan sát cực kỳ kỹ lưỡng và khách quan hình ảnh khuôn mặt thực tế của người dùng để đưa ra chẩn đoán Y khoa chính xác 100% theo đúng những gì nhìn thấy trên ảnh.

QUY TẮC CẤM QUAN TRỌNG: TUYỆT ĐỐI KHÔNG ĐƯỢC XUẤT HIỆN CỤM TỪ "Bộ Y Tế" HOẶC "Bộ Y tế" HOẶC "BYT". Hãy dùng cụm từ "Chuyên khoa Da liễu" hoặc "Tiêu chuẩn Y khoa lâm sàng".

DƯỚI ĐÂY LÀ KIẾN THỨC TÍCH HỢP TỪ CƠ SỞ DỮ LIỆU BỆNH HỌC DA LIỄU VÀ PHÁC ĐỒ Y KHOA:
${clinical.contextText}

QUY TẮC ĐÁNH GIÁ THỰC TẾ & CHUẨN XÁC:
1. Đánh giá chi tiết 5 vùng giải phẫu: Trán (forehead), Mắt/Lông mày (eyebrow), Mũi (nose), Má (upper_cheek), Cằm (chin). NẾU VÙNG NÀO SẠCH KHÔNG CÓ MỤN/TỔN THƯƠNG THÌ ĐÁNH GIÁ SẠCH (GREEN), KHÔNG BỊA ĐẶT TỔN THƯƠNG!
2. Phân định status: "green" (sạch khỏe), "yellow" (dầu nhờn/sợi bã nhờn/lỗ chân lông to/mụn ẩn), "red" (ổ viêm đỏ, mụn mủ, thâm đậm sau viêm).
3. Đánh giá 6 chỉ số da (thang 1-10): "mun_viem", "mun_khong_viem", "soi_ba_nhon", "seo", "sac_to_da", "lo_chan_long" cùng mảng tọa độ points [{top: %, left: %}].

CẤU TRÚC PHẢN HỒI (BẮT BUỘC ĐỦ CÁC THẺ SAU):
===OVERVIEW===
## Báo cáo Phân tích Da Y Khoa ✨
1. **Loại da:** (Dầu / Khô / Hỗn hợp / Nhạy cảm / Bình thường)
2. **Chẩn đoán y khoa chuyên sâu:** (Nhận xét đúng thực trạng quan sát được trong ảnh)
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
  "detectedIssues": ["Lỗ chân lông", "Sợi bã nhờn"],
  "metrics": {
    "mun_viem": { "score": 9, "label": "Mụn viêm", "dotColor": "#f472b6", "pillColor": "#e11d48", "points": [] },
    "mun_khong_viem": { "score": 7, "label": "Mụn không viêm", "dotColor": "#eab308", "pillColor": "#d97706", "points": [{ "top": 35, "left": 48, "r": 8 }] },
    "soi_ba_nhon": { "score": 7, "label": "Sợi bã nhờn", "dotColor": "#8b5cf6", "pillColor": "#6862b5", "points": [{ "top": 34, "left": 60, "r": 7 }] },
    "seo": { "score": 8, "label": "Sẹo", "dotColor": "#ef4444", "pillColor": "#dc2626", "points": [] },
    "sac_to_da": { "score": 7, "label": "Sắc tố da", "dotColor": "#ea580c", "pillColor": "#e15b32", "points": [] },
    "lo_chan_long": { "score": 6, "label": "Lỗ chân lông", "dotColor": "#22c55e", "pillColor": "#16a34a", "points": [{ "top": 36, "left": 55, "r": 8 }] }
  },
  "summary": [
    { "title": "Phân tích AI Vision", "en": "(Clinical AI Diagnosis)", "desc": "Nhận diện từ ảnh chụp thực tế theo cơ sở tri thức y khoa." }
  ],
  "zones": [
    { "id": "forehead", "title": "Vùng Trán", "condition": "Da tương đối ổn định", "detail": "Không phát hiện ổ viêm lớn", "status": "green" },
    { "id": "eyebrow", "title": "Vùng Mắt & Lông Mày", "condition": "Bình thường", "detail": "Nền da ẩm tốt", "status": "green" },
    { "id": "nose", "title": "Vùng Mũi", "condition": "Sợi bã nhờn cánh mũi", "detail": "Cần làm sạch với BHA nhẹ nhàng", "status": "yellow" },
    { "id": "upper_cheek", "title": "Vùng Má", "condition": "Mịn màng, lỗ chân lông nhẹ", "detail": "Duy trì kem chống nắng", "status": "green" },
    { "id": "chin", "title": "Vùng Cằm", "condition": "Bình thường", "detail": "Chăm sóc đều đặn", "status": "green" }
  ]
}`;

    // 3. Chuẩn bị các parts ảnh và text
    let userPromptText = `Hãy phân tích hình ảnh khuôn mặt thực tế của người dùng.\n`;
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

    if (frontImage) addImagePart(frontImage, "📸 ẢNH 1: GÓC CHÍNH DIỆN");
    if (leftImage) addImagePart(leftImage, "📸 ẢNH 2: GÓC NGHIÊNG TRÁI");
    if (rightImage) addImagePart(rightImage, "📸 ẢNH 3: GÓC NGHIÊNG PHẢI");
    if (!frontImage && !leftImage && !rightImage && image) {
      addImagePart(image, "📸 ẢNH KHUÔN MẶT CẦN PHÂN TÍCH");
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
      source: "Gemini AI & Clinical Knowledge Base (medical_guidelines.json + skin_disease_knowledge_base.json)",
      matchedDiseases: clinical.matchedDiseases,
      matchedGuidelines: clinical.matchedGuidelines
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
