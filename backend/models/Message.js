const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  emoji: String
}, { _id: false });

const readSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  readAt: { type: Date, default: Date.now }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  content: String,

  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },

  type: { type: String, default: "text" },
  reactions: [reactionSchema],
  readBy: [readSchema],

  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  expiresAt: { type: Date }
}, { timestamps: true });

messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

/* ===== METHODS ===== */
messageSchema.methods.markRead = function (userId) {
  if (!this.readBy.some(r => r.user.equals(userId))) {
    this.readBy.push({ user: userId });
    return this.save();
  }
};

/* ===== PRE SAVE ===== */
messageSchema.pre("save", function (next) {
  if (this.isModified("content")) this.isEdited = true;
  next();
});

module.exports = mongoose.model("Message", messageSchema);
