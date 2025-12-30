const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      maxlength: 2200,
      trim: true
    },

    hashtags: {
      type: [String],
      index: true
    },

    media: [
      {
        url: String,
        type: { type: String, enum: ["image", "video"] }
      }
    ],

    likes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],

    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        createdAt: { type: Date, default: Date.now }
      }
    ],

    audience: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public"
    },

    isArchived: { type: Boolean, default: false },

    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Indexes
postSchema.index({ user: 1, createdAt: -1 });

// Virtuals
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

module.exports = mongoose.model("Post", postSchema);
