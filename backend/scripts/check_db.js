import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const p = await Product.findOne({ id: 'lrp-anthelios-fluid' });
    if (p) {
      console.log('--- RAW DB VALUE ---');
      console.log(JSON.stringify(p.description));
    } else {
      console.log('Product not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
};

run();
