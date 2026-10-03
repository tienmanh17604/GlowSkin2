import mongoose from "mongoose";

const skinTrainingKnowledgeSchema = new mongoose.Schema(
  {
    conditionId: {
      type: String,
      unique: true,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    condition: {
      type: String,
      required: true,
      index: true
    },
    description: {
      type: String,
      default: ""
    },
    visualSigns: {
      type: String,
      default: ""
    },
    color: {
      type: String,
      default: ""
    },
    texture: {
      type: String,
      default: ""
    },
    elevation: {
      type: String,
      default: ""
    },
    typicalSize: {
      type: String,
      default: ""
    },
    distribution: {
      type: String,
      default: ""
    },
    inflammation: {
      type: String,
      default: ""
    },
    distinctiveFeatures: {
      type: String,
      default: ""
    },
    lookalikes: {
      type: String,
      default: ""
    },
    causes: {
      type: String,
      default: ""
    },
    recommendedIngredients: {
      type: [String],
      default: []
    },
    recommendedIngredientsRaw: {
      type: String,
      default: ""
    },
    careTips: {
      type: String,
      default: ""
    },
    whenToSeekHelp: {
      type: String,
      default: ""
    },
    sourceUrl: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

skinTrainingKnowledgeSchema.index({
  condition: "text",
  category: "text",
  description: "text",
  visualSigns: "text",
  distinctiveFeatures: "text"
});

const SkinTrainingKnowledge =
  mongoose.models.SkinTrainingKnowledge ||
  mongoose.model("SkinTrainingKnowledge", skinTrainingKnowledgeSchema);

export default SkinTrainingKnowledge;
