const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    media: [
      {
        url: String,
        type: { type: String, enum: ["image", "video"] }
      }
    ],

    viewers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        viewedAt: { type: Date, default: Date.now }
      }
    ],

    replies: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

// Index
storySchema.index({ user: 1, createdAt: -1 });

// Methods
storySchema.methods.addViewer = function (userId) {
  if (!this.viewers.some(v => v.user.toString() === userId.toString())) {
    this.viewers.push({ user: userId });
  }
  return this.save();
};

module.exports = mongoose.model("Story", storySchema);
