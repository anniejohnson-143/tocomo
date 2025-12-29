const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createPost,
  getFeed,
  likePost,
  addComment,
  updatePost,
  deletePost,
  getUserPosts
} = require("../controllers/postController");

/* Create a post with optional image */
router.post("/", auth, upload.single("image"), createPost);

/* Get all posts for feed */
router.get("/", auth, getFeed);

/* Get posts by a specific user (Profile page) */
router.get("/user/:id", auth, getUserPosts);

/* Like a post */
router.post("/like/:id", auth, likePost);

/* Add comment */
router.post("/comment/:id", auth, addComment);

/* Edit post */
router.put("/:id", auth, updatePost);

/* Delete post */
router.delete("/:id", auth, deletePost);

module.exports = router;
