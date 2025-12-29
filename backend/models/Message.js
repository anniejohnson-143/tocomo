const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['image', 'video', 'audio', 'file'],
    required: true 
  },
  name: String,
  size: Number,
  duration: Number,
  thumbnail: String,
  width: Number,
  height: Number
}, { _id: false });

const reactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  emoji: { 
    type: String, 
    
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const readReceiptSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  readAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  // Message content
  content: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  
  // Sender and receiver
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  
  // For direct messages
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true,
    // For group chats, this can be null
    required: function() {
      return !this.chatRoom;
    }
  },
  
  // For group chats
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    index: true
  },
  
  // Message type
  type: {
    type: String,
    enum: [
      'text', 
      'image', 
      'video', 
      'audio', 
      'file', 
      'location', 
      'contact',
      'sticker',
      'gif',
      'system'
    ],
    default: 'text'
  },
  
  // Media files
  media: [mediaSchema],
  
  // Location data
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: function() {
        return this.type === 'location';
      }
    },
    name: String,
    address: String
  },
  
  // Contact sharing
  contact: {
    name: String,
    phone: String,
    email: String
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },
  
  // Read receipts
  readBy: [readReceiptSchema],
  
  // Message reactions
  reactions: [reactionSchema],
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Forwarded message
  isForwarded: {
    type: Boolean,
    default: false
  },
  
  // Message metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Expiration for temporary messages
  expiresAt: {
    type: Date,
    index: { expires: 0 }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual for unread messages count
messageSchema.virtual('isUnread').get(function() {
  return this.status !== 'read';
});

// Virtual for message preview
messageSchema.virtual('preview').get(function() {
  if (this.content) {
    return this.content.length > 50 
      ? this.content.substring(0, 50) + '...' 
      : this.content;
  }
  
  switch (this.type) {
    case 'image':
      return '📷 Photo';
    case 'video':
      return '🎥 Video';
    case 'audio':
      return '🔊 Audio';
    case 'file':
      return '📄 File';
    case 'location':
      return '📍 Location';
    case 'contact':
      return '👤 Contact';
    case 'sticker':
      return '🎭 Sticker';
    case 'gif':
      return 'GIF';
    default:
      return 'New message';
  }
});

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(receipt => receipt.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId });
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add a reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user if it exists
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
  
  return this.save();
};

// Method to remove a reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1, user2, limit = 50, before = null) {
  const query = {
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 }
    ],
    isDeleted: false,
    'deletedFor': { $ne: user1 }
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'username fullName profilePicture')
    .populate('receiver', 'username fullName profilePicture')
    .populate('replyTo', 'content type sender')
    .populate('replyTo.sender', 'username fullName')
    .lean();
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiver: userId,
    'readBy.user': { $ne: userId },
    isDeleted: false,
    'deletedFor': { $ne: userId }
  });
};

// Pre-save hook to update status
messageSchema.pre('save', function(next) {
  if (this.isNew && !this.status) {
    this.status = 'sent';
  }
  
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
  }
  
  next();
});

module.exports = mongoose.model('Message', messageSchema);
