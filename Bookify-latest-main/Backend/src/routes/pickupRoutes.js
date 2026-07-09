const express = require("express");
const router = express.Router();
const { createPickupRequest, getMyPickups } = require("../controllers/pickupController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/request", protect, authorizeRoles("seller"), createPickupRequest);
router.get("/my-pickups", protect, authorizeRoles("seller"), getMyPickups);

module.exports = router;