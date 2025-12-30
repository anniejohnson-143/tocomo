const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["admin", "moderator", "member"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
  lastReadAt: { type: Date, default: Date.now },
  isMuted: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false }
}, { _id: false });

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  type: { type: String, enum: ["direct", "group", "channel"], required: true },
  avatar: { url: String },
  description: String,
  participants: [participantSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  settings: {
    isPublic: { type: Boolean, default: false },
    allowInvites: { type: Boolean, default: true }
  },

  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  // Prevent DM duplication
  directMessageKey: { type: String, unique: true, sparse: true }
}, { timestamps: true });

chatRoomSchema.index({ "participants.user": 1 });
chatRoomSchema.index({ type: 1, updatedAt: -1 });

/* ===== STATIC: DM ROOM ===== */
chatRoomSchema.statics.findOrCreateDM = async function (u1, u2) {
  const key = [u1.toString(), u2.toString()].sort().join("_");

  let room = await this.findOne({ directMessageKey: key });
  if (!room) {
    room = await this.create({
      type: "direct",
      participants: [{ user: u1 }, { user: u2 }],
      createdBy: u1,
      directMessageKey: key
    });
  }
  return room;
};

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
