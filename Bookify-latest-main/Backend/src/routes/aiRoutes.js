const express = require("express");
const router = express.Router();
const multer = require("multer");
const { estimatePrice } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const upload = multer({ dest: "uploads/" });

router.post("/estimate", protect, authorizeRoles("seller"), upload.array("images", 4), estimatePrice);

module.exports = router;
