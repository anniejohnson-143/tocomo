const mongoose = require('mongoose');

const storyViewerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  reaction: {
    type: String,
    enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry', null],
    default: null
  }
}, { _id: false });

const storyMediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  duration: {
    type: Number,
    default: 5
  },
  order: {
    type: Number,
    default: 0
  },
  thumbnail: String,
  text: {
    content: String,
    position: {
      x: { type: Number, default: 0.5 },
      y: { type: Number, default: 0.5 }
    },
    style: {
      font: String,
      size: Number,
      color: String,
      background: String
    }
  },
  link: {
    url: String,
    title: String
  },
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }
  }],
  hashtags: [{
    tag: String,
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }
  }],
  stickers: [{
    id: String,
    url: String,
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      rotation: { type: Number, default: 0 },
      scale: { type: Number, default: 1 }
    }
  }],
  music: {
    id: String,
    title: String,
    artist: String
  },
  location: {
    name: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  }
}, { _id: false });

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  media: [storyMediaSchema],
  viewers: [storyViewerSchema],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  privacy: {
    type: String,
    enum: ['public', 'friends', 'close_friends', 'private'],
    default: 'friends'
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  replyCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  highlight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoryHighlight'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 24*60*60*1000),
    index: { expires: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ 'mentions.user': 1 });
storySchema.index({ 'hashtags.tag': 1 });
storySchema.index({ location: '2dsphere' });

// Virtual for story preview
storySchema.virtual('preview').get(function() {
  if (this.media && this.media.length > 0) {
    const firstMedia = this.media[0];
    if (firstMedia.type === 'image') return '📷 Photo';
    if (firstMedia.type === 'video') return '🎥 Video';
  }
  return 'New Story';
});

// Method to add a viewer
storySchema.methods.addViewer = function(userId) {
  if (!this.viewers.some(v => v.user.toString() === userId.toString())) {
    this.viewers.push({ user: userId });
    this.viewCount += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add a reply
storySchema.methods.addReply = function(userId, text) {
  this.replies.push({ user: userId, text });
  this.replyCount += 1;
  return this.save();
};

// Static method to get user stories
storySchema.statics.getUserStories = function(userId, viewerId) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        isArchived: false,
        $or: [
          { privacy: 'public' },
          { 
            privacy: 'friends',
            $or: [
              { 'user.followers': mongoose.Types.ObjectId(viewerId) },
              { user: mongoose.Types.ObjectId(viewerId) }
            ]
          },
          { 
            privacy: 'close_friends',
            'user.closeFriends': mongoose.Types.ObjectId(viewerId)
          },
          { 
            privacy: 'private',
            allowedUsers: mongoose.Types.ObjectId(viewerId)
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        'user.password': 0,
        'user.email': 0,
        'user.__v': 0
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);
};

// Pre-save hook to update view count
storySchema.pre('save', function(next) {
  if (this.isModified('viewers')) {
    this.viewCount = this.viewers.length;
  }
  if (this.isModified('replies')) {
    this.replyCount = this.replies.length;
  }
  next();
});

module.exports = mongoose.model('Story', storySchema);
