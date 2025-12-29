const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Authentication Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected Routes (require authentication)
router.use(protect);

// User Routes
router.get('/me', authController.getMe);
router.put('/update-me', authController.updateMe);
router.delete('/delete-me', authController.deleteMe);
router.put('/update-password', authController.updatePassword);

// Post Routes
router.route('/posts')
  .get(postController.getFeed)  // Get feed with pagination
  .post(postController.createPost);  // Create new post

router.route('/posts/:id')
  .get(postController.getPost)  // Get single post
  .put(postController.updatePost)  // Update post
  .delete(postController.deletePost);  // Delete post

// Like/Unlike Post
router.post('/posts/:id/like', postController.likePost);

// Comments
router.route('/posts/:id/comments')
  .post(postController.addComment)  // Add comment
  .get(postController.getComments);  // Get comments with pagination

// Comment interactions
router.delete('/comments/:id', postController.deleteComment);
router.post('/comments/:id/like', postController.likeComment);

// Saved Posts
router.route('/saved-posts')
  .get(postController.getSavedPosts)  // Get saved posts
  .post(postController.savePost);  // Save/unsave post

// User Posts
router.get('/users/:userId/posts', postController.getUserPosts);

// Hashtag Search
router.get('/hashtags/:hashtag', postController.getPostsByHashtag);

// Report Post
router.post('/posts/:id/report', postController.reportPost);

// Admin Routes (protected by admin role)
router.use(authController.restrictTo('admin'));

router.route('/admin/users')
  .get(authController.getAllUsers);

router.route('/admin/users/:id')
  .get(authController.getUser)
  .put(authController.updateUser)
  .delete(authController.deleteUser);

module.exports = router;
