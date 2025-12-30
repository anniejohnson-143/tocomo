const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getMessages } = require("../controllers/chatController");

router.get("/:id", protect, getMessages);

module.exports = router;
