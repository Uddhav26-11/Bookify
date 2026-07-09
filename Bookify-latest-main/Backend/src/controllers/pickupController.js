const PickupRequest = require("../models/PickupRequest");
const Book = require("../models/Book");

exports.createPickupRequest = async (req, res) => {
  try {
    const { bookIds, scheduledDate, paymentMethod } = req.body;

    const pickup = await PickupRequest.create({
      seller: req.user.id,
      books: bookIds,
      scheduledDate,
      paymentMethod,
      status: "Requested",
    });

    await Book.updateMany({ _id: { $in: bookIds } }, { status: "Requested" });

    return res.status(201).json({ success: true, message: "Pickup requested", pickup });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ seller: req.user.id }).populate("books");
    return res.status(200).json({ success: true, pickups });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};