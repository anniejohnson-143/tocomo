const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const postController = require("../controllers/postController");
const { protect, restrictTo } = require("../controllers/authController");

const { upload } = require("../middleware/upload");

// =========================
// Public Auth Routes
// =========================
router.post("/auth/register", upload.single("profilePicture"), authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/logout", authController.logout);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password/:token", authController.resetPassword);

// Verify Token (Protected)
router.get("/auth/verify", authController.protect, authController.verify);

// =========================
// Protected Routes
// =========================
router.use(authController.protect);

// -------- User Routes --------
router.get("/users/me", authController.getMe);
router.put("/users/update-me", authController.updateMe);
router.put("/users/update-password", authController.updatePassword);
router.delete("/users/delete-me", authController.deleteMe);

// -------- Post Routes --------
// -------- Post Routes --------
router.route("/posts")
  .get(postController.getFeed)
  .post(upload.single("image"), postController.createPost);

router.route("/posts/:id")
  .get(postController.getPost)
  .put(postController.updatePost)
  .delete(postController.deletePost);

router.post("/posts/:id/like", postController.likePost);

router.route("/posts/:id/comments")
  .get(postController.getComments)
  .post(postController.addComment);

router.delete("/comments/:id", postController.deleteComment);
router.post("/comments/:id/like", postController.likeComment);

router.get("/posts/saved", postController.getSavedPosts);
router.post("/posts/:id/save", postController.savePost);

router.get("/users/:userId/posts", postController.getUserPosts);
router.get("/hashtags/:tag", postController.getPostsByHashtag);
router.post("/posts/:id/report", postController.reportPost);

// =========================
// Admin Routes
// =========================
router.use(authController.restrictTo("admin"));
router.get("/admin/users", authController.getAllUsers);

router.route("/admin/users/:id")
  .get(authController.getUser)
  .put(authController.updateUser)
  .delete(authController.deleteUser);

module.exports = router;
