const mongoose = require("mongoose");

// Audit trail of every AI price estimate generated, so admins can later see
// what the model predicted vs what the seller asked for / what was settled.
const aiPricePredictionSchema = new mongoose.Schema(
  {
    bookName: { type: String },
    condition: { type: String },
    images: [{ type: String }],
    conditionScore: { type: Number },
    estimatedPrice: { type: Number },
    confidenceScore: { type: Number },
    source: { type: String, enum: ["gemini-vision", "heuristic"], default: "heuristic" },
    sellerProposedPrice: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIPricePrediction", aiPricePredictionSchema);
