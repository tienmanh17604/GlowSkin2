import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from "../models/User.js";
import MembershipTransaction from "../models/MembershipTransaction.js";

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  console.log("--> Đang kết nối tới MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  console.log("--> Kết nối MongoDB Atlas thành công! ✅");

  // 1. Sync Users
  const usersPath = path.join(__dirname, "../data/users.json");
  if (fs.existsSync(usersPath)) {
    const rawUsers = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
    console.log(`--> Tìm thấy ${rawUsers.length} tài khoản trong users.json. Bắt đầu đồng bộ...`);

    let userInserted = 0;
    let userUpdated = 0;

    for (const u of rawUsers) {
      const cleanEmail = u.email ? u.email.trim().toLowerCase() : "";
      if (!cleanEmail) continue;

      const userData = {
        id: u.id || `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: u.name || "Khách hàng",
        preferredName: u.preferredName || u.name || "",
        phone: u.phone || u.userPhone || "",
        email: cleanEmail,
        password: u.password || "user123",
        role: u.role || "user",
        membership: u.membership || "Premium",
        addresses: Array.isArray(u.addresses) ? u.addresses : [],
      };

      const res = await User.updateOne(
        { email: cleanEmail },
        { $set: userData },
        { upsert: true }
      );

      if (res.upsertedCount > 0) userInserted++;
      else userUpdated++;
    }

    console.log(`--> [Tài khoản] Thêm mới: ${userInserted}, Cập nhật: ${userUpdated} tài khoản lên MongoDB Atlas! ✅`);
  }

  // 2. Sync Membership Transactions
  const txPath = path.join(__dirname, "../data/membership_transactions.json");
  if (fs.existsSync(txPath)) {
    const rawTxs = JSON.parse(fs.readFileSync(txPath, "utf-8"));
    console.log(`--> Tìm thấy ${rawTxs.length} giao dịch trong membership_transactions.json. Bắt đầu đồng bộ...`);

    let txInserted = 0;
    let txUpdated = 0;

    for (const t of rawTxs) {
      const orderCodeNum = Number(t.orderCode);
      if (!orderCodeNum) continue;

      const txData = {
        id: t.id || `SUB_${orderCodeNum}`,
        orderCode: orderCodeNum,
        userId: t.userId || "",
        userName: t.userName || "Khách hàng",
        userEmail: t.userEmail || "",
        userPhone: t.userPhone || "",
        plan: t.plan || "Premium",
        amount: Number(t.amount) || 99000,
        paymentMethod: t.paymentMethod || "PayOS (VietQR)",
        status: t.status || "PAID",
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      };

      const res = await MembershipTransaction.updateOne(
        { orderCode: orderCodeNum },
        { $set: txData },
        { upsert: true }
      );

      if (res.upsertedCount > 0) txInserted++;
      else txUpdated++;
    }

    console.log(`--> [Giao dịch Doanh thu] Thêm mới: ${txInserted}, Cập nhật: ${txUpdated} giao dịch lên MongoDB Atlas! ✅`);
  }

  const finalUsersCount = await User.countDocuments();
  const finalTxCount = await MembershipTransaction.countDocuments();
  console.log(`\n🎉 HOÀN THÀNH ĐỒNG BỘ:`);
  console.log(`- Tổng số tài khoản trên MongoDB Atlas: ${finalUsersCount}`);
  console.log(`- Tổng số giao dịch nâng cấp trên MongoDB Atlas: ${finalTxCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Lỗi đồng bộ:", err);
  process.exit(1);
});
