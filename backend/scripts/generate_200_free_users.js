import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendUsersPath = path.join(__dirname, "../data/users.json");
const frontendUsersPath = path.join(__dirname, "../../fontend/src/data/users.json");

// Helper to remove Vietnamese tones for email username
function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const lastNames = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đinh", "Đoàn", "Trương", "Lâm",
  "Mai", "Trịnh", "Đào", "Cao", "Hà", "Lưu", "Lương", "Thái", "Châu", "Tạ",
  "Phùng", "Tô", "Vương", "Quách"
];

const middleAndFirstNamesMale = [
  "Văn Phúc", "Minh Trí", "Trọng Nghĩa", "Hải Đăng", "Đình Trọng", "Đức Duy", "Tấn Tài", "Hữu Phước",
  "Tấn Phát", "Quốc Hưng", "Nhật Minh", "Hùng Cường", "Thanh Tùng", "Đăng Khoa", "Tuấn Vũ", "Khắc Tiệp",
  "Hữu Thắng", "Gia Bảo", "Thế Hiển", "Minh Khang", "Văn Hậu", "Quang Minh", "Thành Nam", "Tuấn Kiệt",
  "Duy Hưng", "Hoàng Nam", "Quốc Bảo", "Anh Tuấn", "Trọng Nhân", "Đức Huy", "Tiến Dũng", "Hoàng Long",
  "Quang Vinh", "Mạnh Cường", "Minh Quân", "Huy Hoàng", "Bảo Nam", "Minh Triết", "Trường Giang", "Việt Anh",
  "Thái Sơn", "Tuấn Anh", "Văn Nam", "Đức Anh", "Hoàng Bách", "Tấn Lực", "Công Phượng", "Quang Hải",
  "Văn Quyết", "Trung Kiên", "Minh Hiếu", "Quốc Huy", "Văn Hùng", "Hữu Đạt", "Tùng Dương", "Đăng Khôi",
  "Trí Dũng", "Duy Mạnh", "Quốc Đạt", "Khánh Toàn", "Văn Đức", "Quang Đại", "Bảo Khang", "Bình An"
];

const middleAndFirstNamesFemale = [
  "Thúy Nga", "Thanh Hương", "Khánh Linh", "Bích Ngọc", "Cẩm Vân", "Kim Oanh", "Bảo Trâm", "Minh Châu",
  "Yến Nhi", "Diệu Thảo", "Thanh Hà", "Thùy Trang", "Ngọc Huyền", "Tuyết Mai", "Hương Giang", "Hồng Nhung",
  "Mai Phương", "Thảo Vy", "Bích Trâm", "Hoài Thương", "Cát Tường", "Thảo My", "Phương Linh", "Quỳnh Chi",
  "Diệu Linh", "Thùy Linh", "Thu Trang", "Mỹ Uyên", "Ngọc Ánh", "Lan Anh", "Hà My", "Thục Quyên",
  "Trà My", "Thảo Nguyên", "Quỳnh Nga", "Bảo Ngọc", "Thu Hà", "Ngọc Mai", "Kim Ngân", "Thu Ngân",
  "Diễm Quỳnh", "Thanh Trúc", "Yến Vy", "Bảo Yến", "Ánh Dương", "Quỳnh Trang", "Tuyết Nhi", "Nhã Uyên",
  "Hải Yến", "Cẩm Tú", "Phương Thảo", "Thùy Chi", "Diễm My", "Mỹ Linh", "Hồng Hạnh", "Thu Thảo",
  "Kiều Oanh", "Thảo Ly", "Thùy Dung", "Khánh Vy", "Mai Chi", "Như Ý", "Tố Như", "Thảo Nhi"
];

const phonePrefixes = [
  "032", "033", "034", "035", "036", "037", "038", "039",
  "070", "076", "077", "078", "079",
  "081", "082", "083", "084", "085", "086", "088", "089",
  "090", "091", "092", "093", "094", "096", "097", "098"
];

async function generateUsers() {
  const currentUsers = JSON.parse(fs.readFileSync(backendUsersPath, "utf-8"));
  console.log(`Hiện có ${currentUsers.length} tài khoản trong users.json.`);

  const existingEmails = new Set(currentUsers.map((u) => (u.email || "").toLowerCase().trim()));
  const existingPhones = new Set(currentUsers.map((u) => (u.phone || "").trim()));
  const existingIds = new Set(currentUsers.map((u) => u.id));

  // Determine starting index for u_free
  let maxFreeIndex = 0;
  for (const u of currentUsers) {
    if (u.id && u.id.startsWith("u_free_")) {
      const num = parseInt(u.id.replace("u_free_", ""), 10);
      if (!isNaN(num) && num > maxFreeIndex) {
        maxFreeIndex = num;
      }
    }
  }

  console.log(`Số thứ tự u_free cao nhất hiện tại: ${maxFreeIndex}`);

  const birthYears = [
    "95", "96", "97", "98", "99", "2000", "2001", "2002", "2003", "2004", "2005"
  ];

  const newUsers = [];
  const TOTAL_TO_ADD = 200;

  // Time range: 2026-08-01 to 2026-10-27
  const startTime = new Date("2026-08-01T08:00:00.000Z").getTime();
  const endTime = new Date("2026-10-27T18:00:00.000Z").getTime();
  const timeStep = (endTime - startTime) / TOTAL_TO_ADD;

  let currentIndex = maxFreeIndex + 1;
  let maleIdx = 0;
  let femaleIdx = 0;
  let lastNameIdx = 0;
  let phoneCounter = 1000000;

  for (let i = 0; i < TOTAL_TO_ADD; i++) {
    const isMale = i % 2 === 0;
    const lastName = lastNames[lastNameIdx % lastNames.length];
    lastNameIdx++;

    let middleFirst = "";
    if (isMale) {
      middleFirst = middleAndFirstNamesMale[maleIdx % middleAndFirstNamesMale.length];
      maleIdx++;
    } else {
      middleFirst = middleAndFirstNamesFemale[femaleIdx % middleAndFirstNamesFemale.length];
      femaleIdx++;
    }

    const fullName = `${lastName} ${middleFirst}`;
    const baseSlug = removeVietnameseTones(fullName);
    const birthYear = birthYears[i % birthYears.length];

    // Ensure unique email
    let emailCandidate = `${baseSlug}${birthYear}@gmail.com`;
    let emailCounter = 1;
    while (existingEmails.has(emailCandidate)) {
      emailCandidate = `${baseSlug}${birthYear}${emailCounter}@gmail.com`;
      emailCounter++;
    }
    existingEmails.add(emailCandidate);

    // Ensure unique phone
    const prefix = phonePrefixes[i % phonePrefixes.length];
    let phoneCandidate = "";
    let attempts = 0;
    do {
      const suffix = String(phoneCounter % 10000000).padStart(7, "0");
      phoneCounter += 3137;
      phoneCandidate = `${prefix}${suffix.slice(0, 7)}`;
      attempts++;
    } while (existingPhones.has(phoneCandidate) && attempts < 100);
    existingPhones.add(phoneCandidate);

    // ID
    let idCandidate = `u_free_${currentIndex}`;
    while (existingIds.has(idCandidate)) {
      currentIndex++;
      idCandidate = `u_free_${currentIndex}`;
    }
    existingIds.add(idCandidate);
    currentIndex++;

    // Created At timestamp nicely distributed
    const userTimestamp = new Date(startTime + i * timeStep + (i % 7) * 3600000);
    const isoDate = userTimestamp.toISOString();

    const userObj = {
      id: idCandidate,
      name: fullName,
      preferredName: fullName,
      phone: phoneCandidate,
      email: emailCandidate,
      password: "user123",
      role: "user",
      membership: "Free",
      addresses: [],
      createdAt: isoDate,
      updatedAt: isoDate
    };

    newUsers.push(userObj);
  }

  console.log(`Đã tạo thành công ${newUsers.length} tài khoản người dùng Free mới.`);
  console.log(`Mẫu 3 người đầu tiên:`, newUsers.slice(0, 3));
  console.log(`Mẫu 3 người cuối cùng:`, newUsers.slice(-3));

  // Merge into full list
  const updatedUsers = [...currentUsers, ...newUsers];

  // 1. Write to backend users.json
  fs.writeFileSync(backendUsersPath, JSON.stringify(updatedUsers, null, 2), "utf-8");
  console.log(`✅ Đã lưu ${updatedUsers.length} tài khoản vào: ${backendUsersPath}`);

  // 2. Write to frontend users.json
  fs.writeFileSync(frontendUsersPath, JSON.stringify(updatedUsers, null, 2), "utf-8");
  console.log(`✅ Đã đồng bộ sang: ${frontendUsersPath}`);

  // 3. Sync to MongoDB Atlas
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.warn("⚠️ Không tìm thấy MONGODB_URI trong .env, bỏ qua đồng bộ MongoDB.");
    return;
  }

  try {
    console.log("--> Đang kết nối tới MongoDB Atlas để đồng bộ 200 người dùng mới...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    console.log("--> Kết nối MongoDB Atlas thành công! ✅");

    const User = (await import("../models/User.js")).default;

    let upsertedCount = 0;
    for (const u of newUsers) {
      const res = await User.updateOne(
        { email: u.email },
        {
          $set: {
            id: u.id,
            name: u.name,
            preferredName: u.preferredName,
            phone: u.phone,
            email: u.email,
            password: u.password,
            role: u.role,
            membership: u.membership,
            addresses: u.addresses,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt)
          }
        },
        { upsert: true }
      );
      if (res.upsertedCount > 0 || res.modifiedCount > 0) {
        upsertedCount++;
      }
    }

    const totalMongoUsers = await User.countDocuments();
    console.log(`✅ Đồng bộ MongoDB hoàn tất: Đã upsert ${upsertedCount} tài khoản.`);
    console.log(`📊 Tổng số người dùng hiện tại trên MongoDB Atlas: ${totalMongoUsers}`);

    await mongoose.disconnect();
  } catch (mongoErr) {
    console.error("❌ Lỗi khi đồng bộ lên MongoDB:", mongoErr.message);
  }
}

generateUsers().catch(console.error);
