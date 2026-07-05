import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    readByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index to search and sort messages efficiently
MessageSchema.index({ phone: 1, createdAt: 1 });

const Message = mongoose.model("Message", MessageSchema);
export default Message;
