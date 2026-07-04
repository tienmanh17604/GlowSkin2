import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
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
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    skinTypes: {
      type: [String],
      default: [],
    },
    concerns: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      required: true,
    },
    hoverImage: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
    },
    stock: {
      type: Number,
      default: 50,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);
export default Product;
