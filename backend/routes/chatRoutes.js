const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getMessages } = require("../controllers/chatController");

router.get("/:id", auth, getMessages);
module.exports = router;
