const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { deleteFile } = require("../middleware/upload");

/* CREATE POST */
exports.createPost = async (req, res) => {
  let media = [];
  if (req.file) {
    media = [{
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      mediaType: req.file.mimetype.startsWith("image") ? "image" : "video"
    }];
  } else if (req.files && req.files.length > 0) {
    media = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mediaType: file.mimetype.startsWith("image") ? "image" : "video"
    }));
  }

  const hashtags = req.body.content.match(/#(\w+)/g)?.map(tag => tag.substring(1).toLowerCase()) || [];

  const post = await Post.create({
    user: req.user.id,
    content: req.body.content,
    hashtags,
    media
  });

  await post.populate("user", "name username avatar");
  res.status(201).json(post);
};

/* GET FEED */
exports.getFeed = async (req, res) => {
  const posts = await Post.find()
    .populate("user", "name username avatar")
    .populate("comments.user", "name username avatar")
    .sort("-createdAt");

  res.json(posts);
};

/* LIKE / UNLIKE POST */
exports.likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const liked = post.likes.some(id => id.toString() === req.user.id);

  if (liked) {
    post.likes = post.likes.filter(id => id.toString() !== req.user.id);
  } else {
    post.likes.push(req.user.id);

    await Notification.findOneAndUpdate(
      { sender: req.user.id, receiver: post.user, post: post._id, type: "like" },
      {},
      { upsert: true }
    );
  }

  await post.save();
  res.json(post);
};

/* COMMENT */
exports.addComment = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  post.comments.push({
    user: req.user.id,
    text: req.body.text
  });

  await post.save();
  res.json(post);
};

/* DELETE POST */
exports.deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  if (post.user.toString() !== req.user.id)
    return res.status(403).json({ message: "Unauthorized" });

  for (const media of post.media || []) {
    await deleteFile(media.filename);
  }

  await post.deleteOne();
  res.json({ message: "Post deleted" });
};

/* SINGLE POST */
exports.getPost = async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("user", "name username avatar")
    .populate("comments.user", "name username avatar");

  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json(post);
};

/* UPDATE POST */
exports.updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  if (post.user.toString() !== req.user.id)
    return res.status(403).json({ message: "Unauthorized" });

  post.content = req.body.content;
  post.hashtags = req.body.content.match(/#(\w+)/g)?.map(tag => tag.substring(1).toLowerCase()) || [];

  await post.save();
  res.json(post);
};

/* SAVE / UNSAVE */
exports.savePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const saved = post.savedBy.some(
    s => s.user.toString() === req.user.id
  );

  post.savedBy = saved
    ? post.savedBy.filter(s => s.user.toString() !== req.user.id)
    : [...post.savedBy, { user: req.user.id }];

  await post.save();
  res.json({ saved: !saved });
};

/* GET SAVED POSTS */
exports.getSavedPosts = async (req, res) => {
  const posts = await Post.find({ "savedBy.user": req.user.id })
    .populate("user", "name username avatar")
    .sort("-createdAt");
  res.json(posts);
};

/* GET USER POSTS */
exports.getUserPosts = async (req, res) => {
  const posts = await Post.find({ user: req.params.userId })
    .populate("user", "name username avatar")
    .sort("-createdAt");
  res.json(posts);
};

/* GET POSTS BY HASHTAG */
exports.getPostsByHashtag = async (req, res) => {
  const posts = await Post.find({ hashtags: req.params.tag.toLowerCase() })
    .populate("user", "name username avatar")
    .sort("-createdAt");
  res.json(posts);
};

/* REPORT POST */
exports.reportPost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const alreadyReported = post.reports.some(
    report => report.user.toString() === req.user.id
  );

  if (alreadyReported) {
    return res.status(400).json({ message: "You have already reported this post" });
  }

  post.reports.push({
    user: req.user.id,
    reason: req.body.reason
  });

  await post.save();

  res.json({ message: "Post reported successfully" });
};

/* GET COMMENTS */
exports.getComments = async (req, res) => {
  const post = await Post.findById(req.params.id).populate("comments.user", "name username avatar");
  if (!post) return res.status(404).json({ message: "Post not found" });

  res.json(post.comments);
};

/* DELETE COMMENT */
exports.deleteComment = async (req, res) => {
  const post = await Post.findOne({ "comments._id": req.params.id });
  if (!post) return res.status(404).json({ message: "Comment not found" });

  const comment = post.comments.find(c => c._id.toString() === req.params.id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  // Allow post owner or comment owner to delete
  if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "You are not authorized to delete this comment" });
  }

  await Post.findByIdAndUpdate(post._id, {
    $pull: { comments: { _id: req.params.id } }
  });

  res.json({ message: "Comment deleted successfully" });
};

/* LIKE COMMENT */
exports.likeComment = async (req, res) => {
  const post = await Post.findOne({ "comments._id": req.params.id });
  if (!post) return res.status(404).json({ message: "Comment not found" });

  const comment = post.comments.id(req.params.id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const liked = comment.likes.some(like => like.toString() === req.user.id);

  if (liked) {
    comment.likes = comment.likes.filter(like => like.toString() !== req.user.id);
  } else {
    comment.likes.push(req.user.id);
  }

  await post.save();

  res.json(comment);
};
