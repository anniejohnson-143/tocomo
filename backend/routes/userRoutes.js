//userRoutes.js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  followUser,
  acceptFollow,
  rejectFollow,
  togglePrivacy
} = require("../controllers/userController");

router.post("/follow/:id", auth, followUser);
router.post("/accept/:id", auth, acceptFollow);
router.post("/reject/:id", auth, rejectFollow);
router.post("/privacy", auth, togglePrivacy);

module.exports = router;
