const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    conditionGrade: { type: String },
    stockQuantity: { type: Number, default: 1 },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    availability: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);