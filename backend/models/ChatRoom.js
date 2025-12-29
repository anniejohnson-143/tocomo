const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastRead: {
    type: Date,
    default: Date.now
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  customTitle: String
}, { _id: false });

const chatRoomSchema = new mongoose.Schema({
  // Room identification
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Room type
  type: {
    type: String,
    enum: ['direct', 'group', 'channel'],
    required: true,
    default: 'direct'
  },
  
  // Room avatar
  avatar: {
    url: String,
    publicId: String
  },
  
  // Room description
  description: {
    type: String,
    maxlength: 500
  },
  
  // Participants
  participants: [participantSchema],
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Room settings
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    approvalRequired: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    allowMedia: {
      type: Boolean,
      default: true
    },
    slowMode: {
      enabled: {
        type: Boolean,
        default: false
      },
      delay: {
        type: Number, // in seconds
        default: 30
      }
    },
    profanityFilter: {
      type: Boolean,
      default: true
    },
    linkPreview: {
      type: Boolean,
      default: true
    }
  },
  
  // Last message reference
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Pinned messages
  pinnedMessages: [{
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  
  // Custom emojis
  customEmojis: [{
    name: String,
    url: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Banned users
  bannedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    bannedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  
  // Metadata
  isArchived: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // For direct messages, to prevent duplicates
  directMessageKey: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
chatRoomSchema.index({ 'participants.user': 1 });
chatRoomSchema.index({ directMessageKey: 1 }, { unique: true, sparse: true });
chatRoomSchema.index({ type: 1, updatedAt: -1 });

// Virtual for unread message count
chatRoomSchema.virtual('unreadCount').get(function() {
  return 0; // This would be populated in the controller
});

// Virtual for last message preview
chatRoomSchema.virtual('lastMessagePreview').get(function() {
  return this.lastMessage ? this.lastMessage.preview : 'No messages yet';
});

// Method to add a participant
chatRoomSchema.methods.addParticipant = function(userId, role = 'member') {
  if (!this.participants.some(p => p.user.toString() === userId.toString())) {
    this.participants.push({
      user: userId,
      role: role
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove a participant
chatRoomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    p => p.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to update participant role
chatRoomSchema.methods.updateParticipantRole = function(userId, role) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.role = role;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to find or create direct message room
chatRoomSchema.statics.findOrCreateDirectMessage = async function(user1, user2) {
  // Create a consistent key for the pair
  const key = [user1, user2].sort().join('_');
  
  let room = await this.findOne({ 
    type: 'direct',
    directMessageKey: key
  })
  .populate('participants.user', 'username fullName profilePicture')
  .populate('lastMessage');
  
  if (!room) {
    room = new this({
      type: 'direct',
      participants: [
        { user: user1, role: 'member' },
        { user: user2, role: 'member' }
      ],
      createdBy: user1,
      directMessageKey: key
    });
    
    await room.save();
  }
  
  return room;
};

// Pre-save hook to handle direct message room names
chatRoomSchema.pre('save', async function(next) {
  if (this.type === 'direct' && !this.name) {
    // For direct messages, we can set the name to the other user's name
    // This would be populated when querying
    this.name = 'Direct Message';
  }
  
  next();
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
