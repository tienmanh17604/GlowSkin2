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

// Danh sách 60 người dùng chân thật, đa dạng giới tính, độ tuổi, thành phố, địa chỉ giao hàng và hồ sơ da liễu
const rawUserData = [
  // 1-10
  {
    name: "Nguyễn Thảo Linh",
    gender: "Nữ",
    birthDate: "15/04/1999",
    city: "TP. Hồ Chí Minh",
    address: "Số 48 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh",
    membership: "Premium",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Collagen & Vitamin C",
    vessels: "Không"
  },
  {
    name: "Trần Quốc Bảo",
    gender: "Nam",
    birthDate: "22/09/1997",
    city: "Hà Nội",
    address: "Số 125 Hoàng Hoa Thám, Phường Thụy Khuê, Quận Tây Hồ, Hà Nội",
    membership: "Free",
    skinType: "Da dầu mụn",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Kẽm ZinC",
    vessels: "Không"
  },
  {
    name: "Lê Phương Nhi",
    gender: "Nữ",
    birthDate: "08/11/2001",
    city: "Đà Nẵng",
    address: "Số 78 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng",
    membership: "VIP",
    skinType: "Da khô",
    sensitivity: "Bình thường",
    budget: "Trên 500k/sản phẩm.",
    supplements: "Vitamin E, Hyaluronic Acid",
    vessels: "Không"
  },
  {
    name: "Phạm Minh Quân",
    gender: "Nam",
    birthDate: "17/02/2000",
    city: "TP. Hồ Chí Minh",
    address: "Tòa S2.03 Vinhomes Grand Park, Phường Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Hoàng Khánh Vy",
    gender: "Nữ",
    birthDate: "30/06/2002",
    city: "Hà Nội",
    address: "Số 16 Ngõ 82 Chùa Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội",
    membership: "Premium",
    skinType: "Da nhạy cảm",
    sensitivity: "Rất nhạy cảm",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Không",
    vessels: "Mẩn đỏ vùng gò má"
  },
  {
    name: "Vũ Hữu Thắng",
    gender: "Nam",
    birthDate: "14/08/1996",
    city: "Hải Phòng",
    address: "Số 42 Lạch Tray, Phường Lạch Tray, Quận Ngô Quyền, Hải Phòng",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Vitamin tổng hợp",
    vessels: "Không"
  },
  {
    name: "Đặng Thùy Dương",
    gender: "Nữ",
    birthDate: "05/12/1998",
    city: "TP. Hồ Chí Minh",
    address: "Số 89 Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da hỗn hợp thiên khô",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Collagen",
    vessels: "Không"
  },
  {
    name: "Bùi Quang Huy",
    gender: "Nam",
    birthDate: "27/03/1999",
    city: "Cần Thơ",
    address: "Số 130 Đường 30 Tháng 4, Phường An Phú, Quận Ninh Kiều, Cần Thơ",
    membership: "Free",
    skinType: "Da dầu mụn",
    sensitivity: "Bình thường",
    budget: "Dưới 200k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Đỗ Yến Nhi",
    gender: "Nữ",
    birthDate: "19/07/2003",
    city: "Bình Dương",
    address: "Số 65 Đại lộ Bình Dương, Phường Phú Hòa, TP. Thủ Dầu Một, Bình Dương",
    membership: "Premium",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Vitamin C",
    vessels: "Không"
  },
  {
    name: "Hồ Văn Cường",
    gender: "Nam",
    birthDate: "10/10/1995",
    city: "Đồng Nai",
    address: "Số 104 Nguyễn Ái Quốc, Phường Tân Tiến, TP. Biên Hòa, Đồng Nai",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },

  // 11-20
  {
    name: "Ngô Lan Anh",
    gender: "Nữ",
    birthDate: "25/01/2000",
    city: "Hà Nội",
    address: "Số 22 Trần Duy Hưng, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội",
    membership: "VIP",
    skinType: "Da khô",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Trên 500k/sản phẩm.",
    supplements: "Nước uống Collagen, Tinh dầu hoa anh thảo",
    vessels: "Không"
  },
  {
    name: "Dương Thế Anh",
    gender: "Nam",
    birthDate: "11/05/1998",
    city: "TP. Hồ Chí Minh",
    address: "Số 215 Lê Văn Sỹ, Phường 14, Quận Phú Nhuận, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Vitamin C",
    vessels: "Không"
  },
  {
    name: "Lý Quỳnh Trang",
    gender: "Nữ",
    birthDate: "03/09/2002",
    city: "Nha Trang",
    address: "Số 56 Quang Trung, Phường Vạn Thắng, TP. Nha Trang, Khánh Hòa",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Đinh Hoàng Hải",
    gender: "Nam",
    birthDate: "20/12/1997",
    city: "Đà Nẵng",
    address: "Số 390 Lê Duẩn, Phường Chính Gián, Quận Thanh Khê, Đà Nẵng",
    membership: "Free",
    skinType: "Da dầu mụn",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Kẽm ZinC",
    vessels: "Không"
  },
  {
    name: "Đoàn Kim Ngân",
    gender: "Nữ",
    birthDate: "18/06/2001",
    city: "TP. Hồ Chí Minh",
    address: "Chung cư Sunrise City, 27 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh",
    membership: "Premium",
    skinType: "Da khô",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Glutathione & Vitamin C",
    vessels: "Không"
  },
  {
    name: "Trương Quốc Dũng",
    gender: "Nam",
    birthDate: "07/04/1996",
    city: "Hà Nội",
    address: "Số 71 Thụy Khuê, Phường Thụy Khuê, Quận Tây Hồ, Hà Nội",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Lâm Thảo Vy",
    gender: "Nữ",
    birthDate: "29/10/2004",
    city: "Cần Thơ",
    address: "Số 88 Mậu Thân, Phường An Hòa, Quận Ninh Kiều, Cần Thơ",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Dưới 200k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Mai Bích Hạnh",
    gender: "Nữ",
    birthDate: "12/03/1995",
    city: "Vũng Tàu",
    address: "Số 152 Ba Cu, Phường 3, TP. Vũng Tàu, Bà Rịa - Vũng Tàu",
    membership: "Premium",
    skinType: "Da lão hóa nhẹ, khô",
    sensitivity: "Bình thường",
    budget: "Trên 500k/sản phẩm.",
    supplements: "Collagen Peptide",
    vessels: "Mạch máu nhỏ vùng cánh mũi"
  },
  {
    name: "Trịnh Công Sơn",
    gender: "Nam",
    birthDate: "24/07/1999",
    city: "Huế",
    address: "Số 45 Lê Lợi, Phường Phú Hội, TP. Huế, Thừa Thiên Huế",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Lương Ngọc Hân",
    gender: "Nữ",
    birthDate: "16/11/2000",
    city: "TP. Hồ Chí Minh",
    address: "Số 34 Đường Số 7, Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh",
    membership: "VIP",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Trên 500k/sản phẩm.",
    supplements: "Collagen & Niacinamide",
    vessels: "Không"
  },

  // 21-30
  {
    name: "Nguyễn Khắc Triệu",
    gender: "Nam",
    birthDate: "04/02/1998",
    city: "Hà Nội",
    address: "Số 95 Xã Đàn, Phường Phương Liên, Quận Đống Đa, Hà Nội",
    membership: "Free",
    skinType: "Da dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Trần Hải Yến",
    gender: "Nữ",
    birthDate: "21/08/2001",
    city: "Quảng Ninh",
    address: "Số 88 Lê Thánh Tông, Phường Bạch Đằng, TP. Hạ Long, Quảng Ninh",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Vitamin E",
    vessels: "Không"
  },
  {
    name: "Lê Diệu Huyền",
    gender: "Nữ",
    birthDate: "13/05/1999",
    city: "TP. Hồ Chí Minh",
    address: "Số 204 Pasteur, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    membership: "Premium",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Collagen nước",
    vessels: "Không"
  },
  {
    name: "Phạm Thiên Ân",
    gender: "Nam",
    birthDate: "09/12/2003",
    city: "Đà Lạt",
    address: "Số 32 Phan Đình Phùng, Phường 2, TP. Đà Lạt, Lâm Đồng",
    membership: "Free",
    skinType: "Da khô",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Hoàng Cẩm Tú",
    gender: "Nữ",
    birthDate: "17/10/1997",
    city: "Bắc Ninh",
    address: "Số 112 Trần Hưng Đạo, Phường Tiền An, TP. Bắc Ninh, Bắc Ninh",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Vitamin C",
    vessels: "Không"
  },
  {
    name: "Vũ Minh Châu",
    gender: "Nữ",
    birthDate: "02/04/2000",
    city: "Hà Nội",
    address: "Tòa Park 6 Times City, 458 Minh Khai, Phường Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội",
    membership: "VIP",
    skinType: "Da nhạy cảm",
    sensitivity: "Rất nhạy cảm",
    budget: "Trên 500k/sản phẩm.",
    supplements: "Ceramides, Omega-3",
    vessels: "Có nổi vân máu nhẹ ở má"
  },
  {
    name: "Đặng Tiến Đạt",
    gender: "Nam",
    birthDate: "15/09/1995",
    city: "TP. Hồ Chí Minh",
    address: "Số 371 Đoàn Văn Bơ, Phường 13, Quận 4, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da dầu mụn",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Bùi Tuyết Mai",
    gender: "Nữ",
    birthDate: "28/06/1998",
    city: "Hải Phòng",
    address: "Số 55 Hoàng Văn Thụ, Phường Hoàng Văn Thụ, Quận Hồng Bàng, Hải Phòng",
    membership: "Free",
    skinType: "Da khô",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Vitamin E",
    vessels: "Không"
  },
  {
    name: "Đỗ Minh Tuấn",
    gender: "Nam",
    birthDate: "06/01/2002",
    city: "TP. Hồ Chí Minh",
    address: "Số 182 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da dầu",
    sensitivity: "Bình thường",
    budget: "Dưới 200k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Hồ Ngọc Mai",
    gender: "Nữ",
    birthDate: "23/11/2001",
    city: "Đà Nẵng",
    address: "Số 92 Nguyễn Thị Minh Khai, Phường Thạch Thang, Quận Hải Châu, Đà Nẵng",
    membership: "Premium",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Collagen bột",
    vessels: "Không"
  },

  // 31-40
  {
    name: "Ngô Gia Huy",
    gender: "Nam",
    birthDate: "19/03/1999",
    city: "Hà Nội",
    address: "Số 43 Nguyễn Chí Thanh, Phường Ngọc Khánh, Quận Ba Đình, Hà Nội",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Vitamin C",
    vessels: "Không"
  },
  {
    name: "Dương Mai Chi",
    gender: "Nữ",
    birthDate: "31/07/2003",
    city: "TP. Hồ Chí Minh",
    address: "Số 108 Trần Não, Phường An Khánh, TP. Thủ Đức, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da dầu mụn",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Lý Gia Hưng",
    gender: "Nam",
    birthDate: "11/10/1996",
    city: "Bình Dương",
    address: "Số 250 Thích Quảng Đức, Phường Chánh Nghĩa, TP. Thủ Dầu Một, Bình Dương",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Đinh Thục Quyên",
    gender: "Nữ",
    birthDate: "05/05/2000",
    city: "TP. Hồ Chí Minh",
    address: "Số 54 Huỳnh Tấn Phát, Phường Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh",
    membership: "Premium",
    skinType: "Da khô",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Collagen & Hyaluronic Acid",
    vessels: "Không"
  },
  {
    name: "Đoàn Văn Hậu",
    gender: "Nam",
    birthDate: "19/04/1999",
    city: "Hà Nội",
    address: "Số 148 Lạc Long Quân, Phường Bưởi, Quận Tây Hồ, Hà Nội",
    membership: "Free",
    skinType: "Da dầu",
    sensitivity: "Bình thường",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Whey Protein & Vitamin D3",
    vessels: "Không"
  },
  {
    name: "Trương Như Ý",
    gender: "Nữ",
    birthDate: "26/12/2002",
    city: "Cần Thơ",
    address: "Số 21 Trần Văn Khéo, Phường Cái Khế, Quận Ninh Kiều, Cần Thơ",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Dưới 200k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Lâm Chí Vĩ",
    gender: "Nam",
    birthDate: "08/08/1997",
    city: "TP. Hồ Chí Minh",
    address: "Số 82 Hùng Vương, Phường 9, Quận 5, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Mai Thục Anh",
    gender: "Nữ",
    birthDate: "14/02/2001",
    city: "Hà Nội",
    address: "Số 67 Lý Thường Kiệt, Phường Cửa Nam, Quận Hoàn Kiếm, Hà Nội",
    membership: "VIP",
    skinType: "Da nhạy cảm, khô",
    sensitivity: "Rất nhạy cảm",
    budget: "Trên 500k/sản phẩm.",
    supplements: "Collagen tươi & Vitamin E",
    vessels: "Mạch máu đỏ li ti hai bên má"
  },
  {
    name: "Trịnh Thúy Diễm",
    gender: "Nữ",
    birthDate: "03/06/1998",
    city: "Buôn Ma Thuột",
    address: "Số 15 Phan Chu Trinh, Phường Thắng Lợi, TP. Buôn Ma Thuột, Đắk Lắk",
    membership: "Free",
    skinType: "Da khô",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Vitamin E",
    vessels: "Không"
  },
  {
    name: "Lương Thế Vinh",
    gender: "Nam",
    birthDate: "22/10/2000",
    city: "TP. Hồ Chí Minh",
    address: "Số 14 Tô Hiến Thành, Phường 15, Quận 10, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da dầu mụn",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Kẽm ZinC",
    vessels: "Không"
  },

  // 41-50
  {
    name: "Nguyễn Kiều Oanh",
    gender: "Nữ",
    birthDate: "18/01/1999",
    city: "Đà Nẵng",
    address: "Số 52 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng",
    membership: "Premium",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Collagen & Vitamin C",
    vessels: "Không"
  },
  {
    name: "Trần Trung Kiên",
    gender: "Nam",
    birthDate: "07/09/1996",
    city: "Hà Nội",
    address: "Số 234 Đội Cấn, Phường Liễu Giai, Quận Ba Đình, Hà Nội",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Lê Bảo Long",
    gender: "Nam",
    birthDate: "12/12/2002",
    city: "TP. Hồ Chí Minh",
    address: "Số 630 Trường Chinh, Phường 15, Quận Tân Bình, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da dầu mụn",
    sensitivity: "Bình thường",
    budget: "Dưới 200k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Phạm Thanh Trúc",
    gender: "Nữ",
    birthDate: "25/04/2000",
    city: "Hải Phòng",
    address: "Số 18 Điện Biên Phủ, Phường Máy Tơ, Quận Ngô Quyền, Hải Phòng",
    membership: "Free",
    skinType: "Da hỗn hợp thiên khô",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Vitamin E",
    vessels: "Không"
  },
  {
    name: "Hoàng Trọng Nghĩa",
    gender: "Nam",
    birthDate: "30/08/1995",
    city: "TP. Hồ Chí Minh",
    address: "Số 19 Huỳnh Văn Bánh, Phường 17, Quận Phú Nhuận, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Vitamin tổng hợp",
    vessels: "Không"
  },
  {
    name: "Vũ Đức Thắng",
    gender: "Nam",
    birthDate: "15/11/1997",
    city: "Nghệ An",
    address: "Số 84 Nguyễn Thị Minh Khai, Phường Hưng Bình, TP. Vinh, Nghệ An",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Đặng Hoài An",
    gender: "Nữ",
    birthDate: "20/03/2004",
    city: "Hà Nội",
    address: "Số 15 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội",
    membership: "Premium",
    skinType: "Da nhạy cảm",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Vitamin C",
    vessels: "Không"
  },
  {
    name: "Bùi Nhật Tân",
    gender: "Nam",
    birthDate: "04/07/2001",
    city: "Đà Nẵng",
    address: "Số 115 Hùng Vương, Phường Hải Châu 2, Quận Hải Châu, Đà Nẵng",
    membership: "Free",
    skinType: "Da dầu",
    sensitivity: "Bình thường",
    budget: "Dưới 200k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Đỗ Hương Tràm",
    gender: "Nữ",
    birthDate: "16/05/1998",
    city: "TP. Hồ Chí Minh",
    address: "Số 92 Nam Kỳ Khởi Nghĩa, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da khô",
    sensitivity: "Bình thường",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Collagen & Vitamin E",
    vessels: "Không"
  },
  {
    name: "Hồ Trọng Nhân",
    gender: "Nam",
    birthDate: "28/10/2003",
    city: "Cần Thơ",
    address: "Số 40 Đại Lộ Hòa Bình, Phường An Cư, Quận Ninh Kiều, Cần Thơ",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },

  // 51-60
  {
    name: "Nguyễn Phúc Thịnh",
    gender: "Nam",
    birthDate: "02/08/1999",
    city: "TP. Hồ Chí Minh",
    address: "Số 105 Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da dầu mụn",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Kẽm ZinC",
    vessels: "Không"
  },
  {
    name: "Trần Mỹ Duyên",
    gender: "Nữ",
    birthDate: "11/12/2001",
    city: "Hà Nội",
    address: "Số 89 Nguyễn Khang, Phường Yên Hòa, Quận Cầu Giấy, Hà Nội",
    membership: "Premium",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Vitamin C, L-Cystine",
    vessels: "Không"
  },
  {
    name: "Lê Gia Hân",
    gender: "Nữ",
    birthDate: "27/02/2004",
    city: "TP. Hồ Chí Minh",
    address: "Số 382 Cách Mạng Tháng 8, Phường 10, Quận 3, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Dưới 200k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Phạm Hữu Đạt",
    gender: "Nam",
    birthDate: "09/06/1997",
    city: "Đà Nẵng",
    address: "Số 204 Đống Đa, Phường Thuận Phước, Quận Hải Châu, Đà Nẵng",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Hoàng Ngân Hà",
    gender: "Nữ",
    birthDate: "14/09/2000",
    city: "Hà Nội",
    address: "Tòa Imperia Garden, 203 Nguyễn Huy Tưởng, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội",
    membership: "VIP",
    skinType: "Da khô lão hóa sớm",
    sensitivity: "Nhạy cảm nhẹ",
    budget: "Trên 500k/sản phẩm.",
    supplements: "Collagen nước DHC & Astaxanthin",
    vessels: "Không"
  },
  {
    name: "Vũ Quang Dũng",
    gender: "Nam",
    birthDate: "18/03/1996",
    city: "Bình Dương",
    address: "Số 14 Yersin, Phường Hiệp Thành, TP. Thủ Dầu Một, Bình Dương",
    membership: "Free",
    skinType: "Da dầu",
    sensitivity: "Bình thường",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Đặng Tú Uyên",
    gender: "Nữ",
    birthDate: "23/07/2002",
    city: "TP. Hồ Chí Minh",
    address: "Số 445 Hai Bà Trưng, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    membership: "Premium",
    skinType: "Da nhạy cảm",
    sensitivity: "Rất nhạy cảm",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Biotin, Vitamin E",
    vessels: "Da mỏng thấy mạch máu"
  },
  {
    name: "Bùi Văn Nam",
    gender: "Nam",
    birthDate: "05/11/1998",
    city: "Đồng Nai",
    address: "Số 68 Võ Thị Sáu, Phường Quyết Thắng, TP. Biên Hòa, Đồng Nai",
    membership: "Free",
    skinType: "Da thường",
    sensitivity: "Khỏe mạnh",
    budget: "Từ 200-300k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Đỗ Cẩm Ly",
    gender: "Nữ",
    birthDate: "12/04/2003",
    city: "Nha Trang",
    address: "Số 18 Yersin, Phường Phương Sài, TP. Nha Trang, Khánh Hòa",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Dưới 200k/sản phẩm.",
    supplements: "Không",
    vessels: "Không"
  },
  {
    name: "Hồ Minh Đăng",
    gender: "Nam",
    birthDate: "30/01/1995",
    city: "TP. Hồ Chí Minh",
    address: "Số 98 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh",
    membership: "Free",
    skinType: "Da hỗn hợp thiên dầu",
    sensitivity: "Bình thường",
    budget: "Từ 300-500k/sản phẩm.",
    supplements: "Vitamin tổng hợp",
    vessels: "Không"
  }
];

// Helper chuẩn hóa email đẹp như người dùng thật
function genCleanEmail(name, birthDate, idx) {
  const norm = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z]/g, "");

  const parts = birthDate.split("/");
  const yearShort = parts[2].slice(-2);
  const fullYear = parts[2];

  // Đa dạng đuôi email tự nhiên: năm sinh, 2 số cuối năm sinh, hoặc ngày tháng
  if (idx % 3 === 0) return `${norm}${yearShort}@gmail.com`;
  if (idx % 3 === 1) return `${norm}.${parts[0]}${parts[1]}@gmail.com`;
  return `${norm}${fullYear}@gmail.com`;
}

// Helper sinh số điện thoại chuẩn việt nam 10 chữ số
const phonePrefixes = ["090", "091", "093", "094", "096", "097", "098", "086", "088", "089", "070", "076", "077", "078", "079", "033", "034", "035", "036", "037", "038"];
function genPhone(idx) {
  const prefix = phonePrefixes[idx % phonePrefixes.length];
  const middle = String(100 + ((idx * 47) % 899));
  const last = String(1000 + ((idx * 139 + 71) % 8999));
  return `${prefix}${middle}${last}`.slice(0, 10);
}

async function run() {
  const backendUsersPath = path.join(__dirname, "../data/users.json");
  const frontendUsersPath = path.join(__dirname, "../../fontend/src/data/users.json");

  let currentUsers = [];
  if (fs.existsSync(backendUsersPath)) {
    currentUsers = JSON.parse(fs.readFileSync(backendUsersPath, "utf-8"));
  }

  // Tập hợp email đã tồn tại để tránh trùng lặp tuyệt đối
  const existingEmails = new Set(currentUsers.map((u) => u.email ? u.email.trim().toLowerCase() : ""));
  const existingIds = new Set(currentUsers.map((u) => u.id));

  const new60Users = [];

  for (let i = 0; i < rawUserData.length; i++) {
    const raw = rawUserData[i];
    let email = genCleanEmail(raw.name, raw.birthDate, i);
    let counter = 1;
    while (existingEmails.has(email)) {
      email = email.replace("@gmail.com", "") + counter + "@gmail.com";
      counter++;
    }
    existingEmails.add(email);

    // Lấy tên gọi ngắn gọn
    const nameWords = raw.name.trim().split(" ");
    const preferredName = nameWords.length > 2 ? `${nameWords[nameWords.length - 2]} ${nameWords[nameWords.length - 1]}` : nameWords[nameWords.length - 1];

    let userId = `u_active_${i + 1}`;
    while (existingIds.has(userId)) {
      userId = `u_active_${i + 1}_${Math.floor(Math.random() * 1000)}`;
    }
    existingIds.add(userId);

    // Thời gian đăng ký rải đều trong tháng 10/2026 từ 08/10 đến 18/10
    const day = String(8 + (i % 11)).padStart(2, "0");
    const hour = String(7 + ((i * 3) % 15)).padStart(2, "0");
    const minute = String((i * 19 + 7) % 60).padStart(2, "0");
    const createdAt = `2026-10-${day}T${hour}:${minute}:00.000Z`;

    const userObj = {
      id: userId,
      name: raw.name,
      preferredName: preferredName,
      email: email,
      phone: genPhone(i),
      password: "user123",
      role: "user",
      membership: raw.membership,
      addresses: [raw.address],
      gender: raw.gender,
      birthDate: raw.birthDate,
      city: raw.city,
      onboardingCompleted: true,
      skinSurvey: {
        budget: raw.budget,
        hasMedicalCondition: "Không",
        hasPrescriptionMedication: "Không",
        hasSupplements: raw.supplements,
        hasBloodVessels: raw.vessels,
        skinType: raw.skinType,
        skinSensitivity: raw.sensitivity
      },
      createdAt: createdAt,
      updatedAt: createdAt
    };

    new60Users.push(userObj);
  }

  console.log(`✨ Đã khởi tạo thành công 60 active user với đầy đủ thông tin: SĐT, Địa chỉ, Hồ sơ da, Ngày sinh, Tỉnh thành!`);

  // Ghép danh sách
  const combinedUsers = [...currentUsers, ...new60Users];

  // 1. Ghi vào backend data/users.json
  fs.writeFileSync(backendUsersPath, JSON.stringify(combinedUsers, null, 2), "utf-8");
  console.log(`--> [Backend] Đã lưu ${combinedUsers.length} tài khoản vào: ${backendUsersPath}`);

  // 2. Ghi vào frontend data/users.json
  if (fs.existsSync(path.dirname(frontendUsersPath))) {
    fs.writeFileSync(frontendUsersPath, JSON.stringify(combinedUsers, null, 2), "utf-8");
    console.log(`--> [Frontend] Đã lưu ${combinedUsers.length} tài khoản vào: ${frontendUsersPath}`);
  }

  // 3. Đồng bộ lên MongoDB Atlas
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ Không tìm thấy MONGODB_URI trong .env");
    process.exit(1);
  }

  console.log("--> Đang kết nối tới MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  console.log("--> Kết nối MongoDB Atlas thành công! Bắt đầu lưu 60 user...");

  let syncedCount = 0;
  for (const u of new60Users) {
    await User.updateOne(
      { email: u.email },
      { $set: u },
      { upsert: true }
    );
    syncedCount++;
  }

  const finalCount = await User.countDocuments();
  console.log(`\n🎉 HOÀN THÀNH:`);
  console.log(`- Đã nạp thành công: ${syncedCount} tài khoản mới.`);
  console.log(`- Tổng số tài khoản trên MongoDB Atlas hiện tại: ${finalCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
