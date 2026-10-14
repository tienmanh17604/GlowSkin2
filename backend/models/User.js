import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    preferredName: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    membership: {
      type: String,
      enum: ["Free", "VIP", "Premium"],
      default: "Free",
    },
    addresses: {
      type: [String],
      default: [],
    },
    latestScan: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true, strict: false }
);

const User = mongoose.model("User", UserSchema);
export default User;
