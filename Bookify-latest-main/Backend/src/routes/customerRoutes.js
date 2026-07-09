const express = require("express");
const router = express.Router();
const { getCustomerProfile, browseBooks } = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/profile", protect, authorizeRoles("customer"), getCustomerProfile);
router.get("/browse", browseBooks); // public browsing allowed

module.exports = router;