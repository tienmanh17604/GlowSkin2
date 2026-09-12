import mongoose from "mongoose";

const skinDiseaseKnowledgeSchema = new mongoose.Schema(
  {
    diseaseId: { type: String, required: true, unique: true, index: true },
    category_vi: { type: String, required: true, index: true },
    name_vi: { type: String, required: true, index: true },
    name_source: { type: String },
    english_alias: { type: String, index: true },
    source_page: { type: Number },
    clinical_visual_features: { type: String, default: "" },
    ai_note: { type: String },
    lesion_features: [{ type: String, index: true }],
    sourceInfo: {
      title: { type: String },
      publisher: { type: String },
      year: { type: Number },
      source_file: { type: String }
    },
    purpose: { type: String }
  },
  { timestamps: true }
);

// Compound text index for MongoDB Atlas full-text search across multiple fields
skinDiseaseKnowledgeSchema.index({
  name_vi: "text",
  english_alias: "text",
  clinical_visual_features: "text",
  category_vi: "text",
  lesion_features: "text"
});

const SkinDiseaseKnowledge =
  mongoose.models.SkinDiseaseKnowledge ||
  mongoose.model("SkinDiseaseKnowledge", skinDiseaseKnowledgeSchema);

export default SkinDiseaseKnowledge;
