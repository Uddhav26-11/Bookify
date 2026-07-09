const express = require("express");
const router = express.Router();
const { addInventory, getInventory } = require("../controllers/inventoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/add", protect, authorizeRoles("admin"), addInventory);
router.get("/all", getInventory);

module.exports = router;