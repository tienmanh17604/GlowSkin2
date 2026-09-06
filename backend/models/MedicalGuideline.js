import mongoose from "mongoose";

const medicalGuidelineSchema = new mongoose.Schema(
  {
    guidelineId: { type: String, required: true, unique: true },
    source: { type: String, required: true },
    title: { type: String, required: true, index: true },
    categories: [{ type: String, index: true }],
    content: { type: String, required: true },
    keywords: [{ type: String, index: true }]
  },
  { timestamps: true }
);

// Create compound text index for fast MongoDB full-text search
medicalGuidelineSchema.index({
  title: "text",
  content: "text",
  keywords: "text",
  categories: "text"
});

const MedicalGuideline = mongoose.models.MedicalGuideline || mongoose.model("MedicalGuideline", medicalGuidelineSchema);
export default MedicalGuideline;
