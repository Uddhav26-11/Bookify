const Inventory = require("../models/Inventory");

exports.addInventory = async (req, res) => {
  try {
    const { bookId, conditionGrade, stockQuantity, purchasePrice } = req.body;
    const sellingPrice = Math.round(purchasePrice * 1.3); // 30% margin

    const item = await Inventory.create({
      book: bookId,
      conditionGrade,
      stockQuantity,
      purchasePrice,
      sellingPrice,
    });

    return res.status(201).json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const items = await Inventory.find().populate("book");
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};