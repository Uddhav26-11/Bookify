const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadBook, bulkUploadBooks, getBookById, getAllBooks } = require("../controllers/bookController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const upload = multer({ dest: "uploads/" });

router.post("/upload", protect, authorizeRoles("seller"), upload.array("images", 4), uploadBook);
router.post("/bulk-upload", protect, authorizeRoles("seller"), upload.any(), bulkUploadBooks);
router.get("/all", getAllBooks);
router.get("/:id", getBookById);

module.exports = router;