const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { deleteFile } = require('../middleware/upload');

/* Create a post (text + optional media) */
exports.createPost = async (req, res, next) => {
  try {
    const { content, media } = req.body;
    let mediaArray = [];

    // Handle media if provided in the request
    if (req.files && req.files.length > 0) {
      mediaArray = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        mediaType: file.mimetype.startsWith('image/') ? 'image' : 'video'
      }));
    }
    // Handle if media URLs are passed directly (e.g., from frontend)
    else if (media && media.length > 0) {
      mediaArray = Array.isArray(media) ? media : [media];
    }

    const post = await Post.create({
      user: req.user.id,
      content,
      media: mediaArray
    });

    // Populate user data
    await post.populate('user', 'name username avatar');
    
    res.status(201).json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

/* Like a post */
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.user.id)) {
      post.likes.push(req.user.id);
      await Notification.create({
        receiver: post.user,
        sender: req.user.id,
        type: "like",
        post: post._id
      });
    }
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Get all posts for feed (populate user & comments) */
exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name")
      .populate("comments.user", "name")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Add a comment */
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({
      user: req.user.id,
      text: req.body.text
    });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Update a post */
exports.updatePost = async (req, res, next) => {
  try {
    const { content, media } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user is the owner of the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    // Update content if provided
    if (content) post.content = content;

    // Handle media updates if provided
    if (req.files && req.files.length > 0) {
      // Delete old media files
      if (post.media && post.media.length > 0) {
        for (const media of post.media) {
          await deleteFile(media.filename);
        }
      }

      // Add new media
      post.media = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        mediaType: file.mimetype.startsWith('image/') ? 'image' : 'video'
      }));
    }
    // If media is provided in the request body (e.g., from frontend)
    else if (media !== undefined) {
      // Delete old media files that are not in the new media array
      const newMedia = Array.isArray(media) ? media : [media];
      const mediaToKeep = new Set(newMedia.map(m => m.filename || m));
      
      if (post.media && post.media.length > 0) {
        for (const mediaItem of post.media) {
          if (!mediaToKeep.has(mediaItem.filename || mediaItem)) {
            await deleteFile(mediaItem.filename);
          }
        }
      }
      
      post.media = newMedia;
    }

    const updatedPost = await post.save();
    await updatedPost.populate('user', 'name username avatar');
    
    res.json({
      success: true,
      data: updatedPost
    });
  } catch (err) {
    next(err);
  }
};

/* Delete a post */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await post.remove();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Get posts by a specific user (Profile tab) */
exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id })
      .populate("user", "name")
      .populate("comments.user", "name")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
