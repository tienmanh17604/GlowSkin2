import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");

// Helper to safely read JSON file
function readJson(filename, defaultValue = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error(`Lỗi đọc file ${filename}:`, err.message);
    return defaultValue;
  }
}

// Helper to safely write JSON file
function writeJson(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`Lỗi ghi file ${filename}:`, err.message);
    return false;
  }
}

const DEFAULT_USERS = [
  {
    id: "u1",
    name: "Nguyễn Văn Admin",
    preferredName: "",
    email: "admin@glowskin.com",
    password: "admin123",
    role: "admin",
    membership: "VIP",
    addresses: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "u2",
    name: "Nguyễn Khánh Nhi",
    preferredName: "",
    email: "user@glowskin.com",
    password: "user123",
    role: "user",
    membership: "Free",
    addresses: [],
    createdAt: new Date().toISOString()
  }
];

export const localDb = {
  // Users
  getUsers: () => {
    return readJson("users.json", DEFAULT_USERS);
  },

  findUserByEmail: (email) => {
    if (!email) return null;
    const users = localDb.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    return users.find((u) => u.email && u.email.toLowerCase() === cleanEmail) || null;
  },

  findUserById: (id) => {
    if (!id) return null;
    const cleanId = String(id).trim();
    const users = localDb.getUsers();
    return users.find((u) => String(u.id) === cleanId || String(u._id) === cleanId) || null;
  },

  createUser: (userData) => {
    const users = localDb.getUsers();
    const newUser = {
      id: userData.id || "u_" + Date.now(),
      name: userData.name,
      preferredName: userData.preferredName || "",
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      role: userData.role || "user",
      membership: userData.membership || "Free",
      addresses: userData.addresses || [],
      latestScan: userData.latestScan || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    writeJson("users.json", users);
    return newUser;
  },

  updateUser: (id, updateFields) => {
    const users = localDb.getUsers();
    const cleanId = String(id).trim();
    const index = users.findIndex(
      (u) =>
        String(u.id) === cleanId ||
        String(u._id) === cleanId ||
        (updateFields.email && u.email && u.email.toLowerCase() === updateFields.email.toLowerCase())
    );

    if (index === -1) {
      const created = {
        id: cleanId,
        name: updateFields.name || "User",
        preferredName: updateFields.preferredName || "",
        email: updateFields.email || "",
        ...updateFields,
        updatedAt: new Date().toISOString()
      };
      users.push(created);
      writeJson("users.json", users);
      return created;
    }

    users[index] = {
      ...users[index],
      ...updateFields,
      updatedAt: new Date().toISOString()
    };
    writeJson("users.json", users);
    return users[index];
  },

  deleteUser: (id) => {
    const users = localDb.getUsers();
    const cleanId = String(id).trim();
    const target = users.find(
      (u) => String(u.id) === cleanId || String(u._id) === cleanId || (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
    );
    if (!target) return null;

    const filtered = users.filter(
      (u) => String(u.id) !== cleanId && String(u._id) !== cleanId && (!u.email || u.email.toLowerCase() !== cleanId.toLowerCase())
    );
    writeJson("users.json", filtered);
    return target;
  },

  // Products
  getProducts: () => {
    return readJson("products.json", []);
  },

  findProductById: (id) => {
    const products = localDb.getProducts();
    return products.find((p) => String(p.id) === String(id) || String(p._id) === String(id)) || null;
  },

  saveProduct: (productData) => {
    const products = localDb.getProducts();
    const newProduct = {
      id: productData.id || "p_" + Date.now(),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    writeJson("products.json", products);
    return newProduct;
  },

  updateProduct: (id, updateData) => {
    const products = localDb.getProducts();
    const cleanId = String(id).trim();
    const index = products.findIndex((p) => String(p.id) === cleanId || String(p._id) === cleanId);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    writeJson("products.json", products);
    return products[index];
  },

  deleteProduct: (id) => {
    const products = localDb.getProducts();
    const cleanId = String(id).trim();
    const target = products.find((p) => String(p.id) === cleanId || String(p._id) === cleanId);
    if (!target) return null;

    const filtered = products.filter((p) => String(p.id) !== cleanId && String(p._id) !== cleanId);
    writeJson("products.json", filtered);
    return target;
  },

  // Orders
  getOrders: () => {
    return readJson("orders.json", []);
  },

  saveOrder: (orderData) => {
    const orders = localDb.getOrders();
    orders.unshift(orderData);
    writeJson("orders.json", orders);
    return orderData;
  },

  updateOrderStatus: (id, status) => {
    const orders = localDb.getOrders();
    const index = orders.findIndex((o) => String(o.id) === String(id) || String(o._id) === String(id));
    if (index === -1) return null;
    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    writeJson("orders.json", orders);
    return orders[index];
  },

  // Reviews
  getReviews: () => {
    return readJson("reviews.json", []);
  },

  saveReview: (reviewData) => {
    const reviews = localDb.getReviews();
    const newReview = {
      _id: "rev_" + Date.now(),
      ...reviewData,
      createdAt: new Date().toISOString()
    };
    reviews.unshift(newReview);
    writeJson("reviews.json", reviews);
    return newReview;
  },

  deleteReview: (id) => {
    const reviews = localDb.getReviews();
    const target = reviews.find((r) => String(r._id) === String(id) || String(r.id) === String(id));
    if (!target) return null;
    const filtered = reviews.filter((r) => String(r._id) !== String(id) && String(r.id) !== String(id));
    writeJson("reviews.json", filtered);
    return target;
  }
};
