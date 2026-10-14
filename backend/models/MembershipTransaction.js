import mongoose from "mongoose";

const membershipTransactionSchema = new mongoose.Schema(
  {
    id: { type: String },
    orderCode: { type: Number, required: true },
    userId: { type: String, required: true },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    userPhone: { type: String, default: "" },
    plan: { type: String, required: true }, // "Premium" | "Professional"
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "PayOS (VietQR)" },
    status: { type: String, default: "PAID" }, // "PAID" | "PENDING" | "CANCELLED"
  },
  { timestamps: true, strict: false }
);

export default mongoose.model("MembershipTransaction", membershipTransactionSchema);
