const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  type: { type: String, required: true },

  reference: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId,
    preview: String
  },

  data: Object,
  isRead: { type: Boolean, default: false, index: true },

  threadId: mongoose.Schema.Types.ObjectId,
  expiresAt: { type: Date }
}, { timestamps: true });

notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ===== STATIC ===== */
notificationSchema.statics.createNotification = function (payload) {
  return this.create({
    ...payload,
    threadId: payload.threadId || new mongoose.Types.ObjectId(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
};

notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany({ recipient: userId }, { isRead: true });
};

module.exports = mongoose.model("Notification", notificationSchema);
