const User = require("../models/User");
const Inventory = require("../models/Inventory");

exports.getCustomerProfile = async (req, res) => {
  try {
    const customer = await User.findById(req.user.id).select("-password");
    return res.status(200).json({ success: true, customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.browseBooks = async (req, res) => {
  try {
    const { className, subject, board, condition, search } = req.query;
    const filter = { availability: true };

    const books = await Inventory.find(filter).populate("book");
    return res.status(200).json({ success: true, books });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};