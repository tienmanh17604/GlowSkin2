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

const names = [
  "Nguyễn Hoàng Long", "Trần Thị Mai", "Lê Văn Hùng", "Phạm Quỳnh Như", "Hoàng Minh Tuấn",
  "Vũ Thu Trang", "Đặng Quốc Anh", "Bùi Ngọc Ánh", "Đỗ Thành Đạt", "Hồ Mỹ Linh",
  "Ngô Văn Phúc", "Dương Thúy Nga", "Lý Quang Diệu", "Đinh Thanh Hương", "Huỳnh Minh Trí",
  "Đoàn Khánh Linh", "Võ Trọng Nghĩa", "Phan Bích Ngọc", "Trương Hải Đăng", "Nguyễn Cẩm Vân",
  "Trần Đình Trọng", "Lê Kim Oanh", "Phạm Đức Duy", "Hoàng Bảo Trâm", "Vũ Tấn Tài",
  "Đặng Minh Châu", "Bùi Hữu Phước", "Đỗ Yến Nhi", "Hồ Tấn Phát", "Ngô Diệu Thảo",
  "Dương Quốc Hưng", "Lý Thanh Hà", "Đinh Nhật Minh", "Huỳnh Thùy Trang", "Đoàn Hùng Cường",
  "Võ Ngọc Huyền", "Phan Thanh Tùng", "Trương Tuyết Mai", "Nguyễn Đăng Khoa", "Trần Hương Giang",
  "Lê Tuấn Vũ", "Phạm Hồng Nhung", "Hoàng Khắc Tiệp", "Vũ Mai Phương", "Đặng Hữu Thắng",
  "Bùi Thảo Vy", "Đỗ Gia Bảo", "Hồ Bích Trâm", "Ngô Thế Hiển", "Dương Hoài Thương",
  "Lý Minh Khang", "Đinh Cát Tường", "Huỳnh Văn Hậu", "Đoàn Thảo My"
];

function toCleanEmail(name, idx) {
  const norm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/đ/g, "d").replace(/[^a-z]/g, "");
  const birthYears = [95, 96, 97, 98, 99, 2000, 2001, 2002, 2003, 2004];
  const yr = birthYears[idx % birthYears.length];
  return norm + yr + "@gmail.com";
}

const phonePrefixes = ["090", "091", "093", "094", "096", "097", "098", "086", "088", "089", "032", "033", "035", "036", "037", "038", "070", "077", "079"];
function genPhone(idx) {
  const prefix = phonePrefixes[idx % phonePrefixes.length];
  const num = String(1000000 + (idx * 31379) % 8999999).slice(-7);
  return prefix + num;
}

async function main() {
  const usersPath = path.join(__dirname, "../data/users.json");
  let currentUsers = [];
  if (fs.existsSync(usersPath)) {
    currentUsers = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  }

  // Lọc bỏ tài khoản cũ nếu có trùng id u_free_
  const nonFreeUsers = currentUsers.filter(u => !u.id.startsWith("u_free_"));
  const existingEmails = new Set(nonFreeUsers.map(u => u.email.toLowerCase()));

  const newFreeUsers = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    let email = toCleanEmail(name, i).replace(/\./g, "").replace("@gmailcom", "@gmail.com");
    let counter = 1;
    while (existingEmails.has(email)) {
      email = email.replace("@gmail.com", "") + counter + "@gmail.com";
      counter++;
    }
    existingEmails.add(email);

    const phone = genPhone(i);
    const day = String((i % 12) + 1).padStart(2, "0");
    const hour = String(7 + (i % 15)).padStart(2, "0");
    const minute = String((i * 17) % 60).padStart(2, "0");

    newFreeUsers.push({
      id: `u_free_${i + 1}`,
      name: name,
      preferredName: name,
      phone: phone,
      email: email,
      password: "user123",
      role: "user",
      membership: "Free",
      addresses: [],
      createdAt: `2026-10-${day}T${hour}:${minute}:00.000Z`,
      updatedAt: `2026-10-${day}T${hour}:${minute}:00.000Z`
    });
  }

  // Kết hợp danh sách
  const allUpdatedUsers = [...nonFreeUsers, ...newFreeUsers];
  fs.writeFileSync(usersPath, JSON.stringify(allUpdatedUsers, null, 2), "utf-8");
  console.log(`--> Đã ghi ${allUpdatedUsers.length} tài khoản vào users.json (${newFreeUsers.length} tài khoản Free mới)`);

  // Đồng bộ lên MongoDB Atlas
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ Thiếu MONGODB_URI");
    process.exit(1);
  }

  console.log("--> Đang kết nối MongoDB Atlas để cập nhật 54 tài khoản Free...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  let upsertedCount = 0;
  for (const u of newFreeUsers) {
    await User.updateOne(
      { email: u.email },
      { $set: u },
      { upsert: true }
    );
    upsertedCount++;
  }

  const totalMongoUsers = await User.countDocuments();
  console.log(`--> Đã đồng bộ thành công ${upsertedCount} tài khoản Free lên MongoDB Atlas! ✅`);
  console.log(`--> Tổng số tài khoản trên MongoDB Atlas hiện tại: ${totalMongoUsers}`);

  await mongoose.disconnect();
  console.log("--> Hoàn tất!");
}

main().catch(console.error);
