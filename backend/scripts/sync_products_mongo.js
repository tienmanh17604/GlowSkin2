import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import Product from "../models/Product.js";
import { localDb } from "../services/localDbService.js";

dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
dotenv.config();

async function sync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB Atlas!");

    const localProducts = localDb.getProducts();
    console.log(`Local products to sync: ${localProducts.length}`);

    const validIds = localProducts.map((p) => p.id);
    await Product.deleteMany({ id: { $nin: validIds } });

    let count = 0;
    for (const prod of localProducts) {
      await Product.findOneAndUpdate(
        { id: prod.id },
        { $set: prod },
        { upsert: true }
      );
      count++;
    }
    console.log(`--> Đã đồng bộ thành công ${count} sản phẩm lên MongoDB Atlas! ✅`);

    const totalInMongo = await Product.countDocuments();
    console.log(`Tổng sản phẩm trong MongoDB: ${totalInMongo}`);
  } catch (err) {
    console.error("Lỗi đồng bộ:", err);
  } finally {
    await mongoose.disconnect();
  }
}

sync();
