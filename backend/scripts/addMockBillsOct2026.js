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

// 9 hóa đơn theo đúng yêu cầu:
// 2 bill ngày 13/10
// 1 bill ngày 15/10
// 3 bill ngày 16/10
// 2 bill ngày 19/10
// 1 bill ngày 21/10 lúc 8h23 sáng nay
// Giờ VN là UTC+7, nên giờ UTC = Giờ VN - 7 tiếng.
const newBills = [
  // 1 bill ngày 21/10 lúc 8h23 sáng (08:23 UTC+7 -> 01:23 UTC)
  {
    id: "SUB_89147635",
    orderCode: 89147635,
    userId: "u_premium_24",
    userName: "Ngô Thu Uyên",
    userEmail: "thuuyenngo2k@gmail.com",
    userPhone: "0938176542",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-21T01:23:00.000Z",
    updatedAt: "2026-10-21T01:23:00.000Z",
    gender: "Nữ",
    birthDate: "14/09/2000",
    city: "Hà Nội",
    address: "Tòa S2.05 Vinhomes Ocean Park, Gia Lâm, Hà Nội"
  },
  // 2 bill ngày 19/10
  {
    id: "SUB_89143289",
    orderCode: 89143289,
    userId: "u_premium_23",
    userName: "Trương Minh Châu",
    userEmail: "minhchautruong.99@gmail.com",
    userPhone: "0789234561",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-19T09:40:00.000Z", // 16:40 VN
    updatedAt: "2026-10-19T09:40:00.000Z",
    gender: "Nữ",
    birthDate: "28/11/1999",
    city: "TP. Hồ Chí Minh",
    address: "245 Nguyễn Đình Chiểu, Phường 5, Quận 3, TP. Hồ Chí Minh"
  },
  {
    id: "SUB_89141506",
    orderCode: 89141506,
    userId: "u_premium_22",
    userName: "Vũ Đình Khang",
    userEmail: "dinhkhangvu01@gmail.com",
    userPhone: "0857912345",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-19T03:28:00.000Z", // 10:28 VN
    updatedAt: "2026-10-19T03:28:00.000Z",
    gender: "Nam",
    birthDate: "19/04/2001",
    city: "Đà Nẵng",
    address: "86 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng"
  },
  // 3 bill ngày 16/10
  {
    id: "SUB_89136720",
    orderCode: 89136720,
    userId: "u_premium_21",
    userName: "Đặng Ngọc Ánh",
    userEmail: "ngocanhdang98@gmail.com",
    userPhone: "0974512390",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-16T14:05:00.000Z", // 21:05 VN
    updatedAt: "2026-10-16T14:05:00.000Z",
    gender: "Nữ",
    birthDate: "05/12/1998",
    city: "Hải Phòng",
    address: "112 Lạch Tray, Quận Ngô Quyền, Hải Phòng"
  },
  {
    id: "SUB_89134985",
    orderCode: 89134985,
    userId: "u_premium_20",
    userName: "Hoàng Trọng Nghĩa",
    userEmail: "trongnghiahoang96@gmail.com",
    userPhone: "0869123876",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-16T06:22:00.000Z", // 13:22 VN
    updatedAt: "2026-10-16T06:22:00.000Z",
    gender: "Nam",
    birthDate: "22/07/1996",
    city: "TP. Hồ Chí Minh",
    address: "78 Nguyễn Trãi, Phường 3, Quận 5, TP. Hồ Chí Minh"
  },
  {
    id: "SUB_89133412",
    orderCode: 89133412,
    userId: "u_premium_19",
    userName: "Phạm Gia Linh",
    userEmail: "gialinhpham2k1@gmail.com",
    userPhone: "0396452189",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-16T01:45:00.000Z", // 08:45 VN
    updatedAt: "2026-10-16T01:45:00.000Z",
    gender: "Nữ",
    birthDate: "10/03/2001",
    city: "Hà Nội",
    address: "42 Hoàng Quốc Việt, Cầu Giấy, Hà Nội"
  },
  // 1 bill ngày 15/10
  {
    id: "SUB_89131290",
    orderCode: 89131290,
    userId: "u_premium_18",
    userName: "Trần Thảo Nguyên",
    userEmail: "thaonguyentran99@gmail.com",
    userPhone: "0908765412",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-15T07:15:00.000Z", // 14:15 VN
    updatedAt: "2026-10-15T07:15:00.000Z",
    gender: "Nữ",
    birthDate: "18/06/1999",
    city: "TP. Hồ Chí Minh",
    address: "15/8 Phan Văn Trị, Phường 11, Quận Bình Thạnh, TP. Hồ Chí Minh"
  },
  // 2 bill ngày 13/10
  {
    id: "SUB_89127823",
    orderCode: 89127823,
    userId: "u_premium_17",
    userName: "Lê Hoàng Long",
    userEmail: "hoanglongle97@gmail.com",
    userPhone: "0915678234",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-13T11:50:00.000Z", // 18:50 VN
    updatedAt: "2026-10-13T11:50:00.000Z",
    gender: "Nam",
    birthDate: "03/10/1997",
    city: "Hà Nội",
    address: "88 Láng Hạ, Đống Đa, Hà Nội"
  },
  {
    id: "SUB_89126148",
    orderCode: 89126148,
    userId: "u_premium_16",
    userName: "Nguyễn Hà My",
    userEmail: "hamynguyen02@gmail.com",
    userPhone: "0982341567",
    plan: "Premium",
    amount: 99000,
    paymentMethod: "PayOS (VietQR)",
    status: "PAID",
    createdAt: "2026-10-13T02:34:00.000Z", // 09:34 VN
    updatedAt: "2026-10-13T02:34:00.000Z",
    gender: "Nữ",
    birthDate: "15/08/2002",
    city: "Cần Thơ",
    address: "124 đường 30/4, Quận Ninh Kiều, Cần Thơ"
  }
];

async function main() {
  console.log("=== BẮT ĐẦU TẠO 9 HÓA ĐƠN GÓI 99K THEO YÊU CẦU ===");

  // 1. Cập nhật file membership_transactions.json ở backend & frontend
  const backendTxFile = path.join(__dirname, "../data/membership_transactions.json");
  const frontendTxFile = path.join(__dirname, "../../fontend/src/data/membership_transactions.json");

  let existingTxs = [];
  if (fs.existsSync(backendTxFile)) {
    existingTxs = JSON.parse(fs.readFileSync(backendTxFile, "utf-8"));
  }

  // Lọc bỏ trùng lặp nếu đã chạy trước đó
  const newOrderCodes = new Set(newBills.map((b) => b.orderCode));
  const filteredExistingTxs = existingTxs.filter((t) => !newOrderCodes.has(t.orderCode));

  // Chuẩn bị danh sách transaction hoàn chỉnh
  const cleanNewTxList = newBills.map((b) => ({
    id: b.id,
    orderCode: b.orderCode,
    userId: b.userId,
    userName: b.userName,
    userEmail: b.userEmail,
    userPhone: b.userPhone,
    plan: b.plan,
    amount: b.amount,
    paymentMethod: b.paymentMethod,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt
  }));

  // Gộp lại và sắp xếp giảm dần theo thời gian (mới nhất lên đầu)
  const combinedTxs = [...cleanNewTxList, ...filteredExistingTxs].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  fs.writeFileSync(backendTxFile, JSON.stringify(combinedTxs, null, 2), "utf-8");
  console.log(`✅ Đã cập nhật ${backendTxFile} (Tổng: ${combinedTxs.length} giao dịch)`);

  if (fs.existsSync(path.dirname(frontendTxFile))) {
    fs.writeFileSync(frontendTxFile, JSON.stringify(combinedTxs, null, 2), "utf-8");
    console.log(`✅ Đã cập nhật ${frontendTxFile}`);
  }

  // 2. Cập nhật file users.json ở backend & frontend
  const backendUsersFile = path.join(__dirname, "../data/users.json");
  const frontendUsersFile = path.join(__dirname, "../../fontend/src/data/users.json");

  let existingUsers = [];
  if (fs.existsSync(backendUsersFile)) {
    existingUsers = JSON.parse(fs.readFileSync(backendUsersFile, "utf-8"));
  }

  const userEmails = new Set(newBills.map((b) => b.userEmail.toLowerCase()));
  const filteredUsers = existingUsers.filter((u) => !userEmails.has(u.email?.toLowerCase()));

  const newUserDataList = newBills.map((b) => ({
    id: b.userId,
    name: b.userName,
    preferredName: b.userName.split(" ").slice(-2).join(" "),
    phone: b.userPhone,
    email: b.userEmail,
    password: "user123",
    role: "user",
    membership: "Premium",
    addresses: [b.address],
    gender: b.gender,
    birthDate: b.birthDate,
    city: b.city,
    createdAt: b.createdAt
  }));

  const combinedUsers = [...newUserDataList, ...filteredUsers];
  fs.writeFileSync(backendUsersFile, JSON.stringify(combinedUsers, null, 2), "utf-8");
  console.log(`✅ Đã cập nhật ${backendUsersFile} (Tổng: ${combinedUsers.length} tài khoản)`);

  if (fs.existsSync(path.dirname(frontendUsersFile))) {
    fs.writeFileSync(frontendUsersFile, JSON.stringify(combinedUsers, null, 2), "utf-8");
    console.log(`✅ Đã cập nhật ${frontendUsersFile}`);
  }

  // 3. Đồng bộ lên MongoDB Atlas
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    try {
      console.log("--> Đang kết nối MongoDB Atlas để đồng bộ...");
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      console.log("--> Kết nối MongoDB Atlas thành công!");

      // Đồng bộ MembershipTransaction
      let txAdded = 0;
      for (const tx of cleanNewTxList) {
        await MembershipTransaction.findOneAndUpdate(
          { orderCode: tx.orderCode },
          { $set: tx },
          { upsert: true, new: true }
        );
        txAdded++;
      }
      console.log(`✅ Đã upsert ${txAdded} giao dịch mới lên MongoDB Atlas!`);

      // Đồng bộ User
      let userAdded = 0;
      for (const u of newUserDataList) {
        await User.findOneAndUpdate(
          { email: u.email.toLowerCase() },
          { $set: u },
          { upsert: true, new: true }
        );
        userAdded++;
      }
      console.log(`✅ Đã upsert ${userAdded} tài khoản khách hàng Premium lên MongoDB Atlas!`);

      const totalTxs = await MembershipTransaction.countDocuments();
      const totalUsers = await User.countDocuments();
      console.log(`\n📊 Thống kê MongoDB Atlas:`);
      console.log(`- Tổng số giao dịch nâng cấp: ${totalTxs}`);
      console.log(`- Tổng số tài khoản: ${totalUsers}`);

      await mongoose.disconnect();
    } catch (err) {
      console.error("⚠️ Lỗi kết nối hoặc đồng bộ MongoDB:", err.message);
    }
  }

  console.log("\n🎉 HOÀN THÀNH TẤT CẢ 9 HÓA ĐƠN GÓI 99K!");
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
