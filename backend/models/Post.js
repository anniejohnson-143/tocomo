const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  width: Number,
  height: Number,
  duration: { type: Number, default: 0 },
  thumbnail: String,
  publicId: String,
  format: String,
  size: Number,
  aspectRatio: Number
}, { _id: false });

const mentionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  position: { type: [Number], required: true } // [start, end] indices in the content
}, { _id: false });

const hashtagSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  position: { type: [Number], required: true } // [start, end] indices in the content
}, { _id: false });

const locationSchema = new mongoose.Schema({
  type: { type: String, default: 'Point' },
  coordinates: { type: [Number], index: '2dsphere' },
  name: String,
  address: String,
  city: String,
  country: String
}, { _id: false });

const postSchema = new mongoose.Schema({
  // Core Fields
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    maxlength: 2200,
    trim: true
  },
  
  // Media
  media: [mediaSchema],
  
  // Location
  location: locationSchema,
  
  // Mentions and Hashtags
  mentions: [mentionSchema],
  hashtags: [hashtagSchema],
  
  // Engagement
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Comments
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true, maxlength: 1000 },
    likes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }],
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true, maxlength: 1000 },
      likes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }],
      timestamp: { type: Date, default: Date.now }
    }],
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Saves/Bookmarks
  savedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Sharing
  shareCount: { type: Number, default: 0 },
  sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  isShared: { type: Boolean, default: false },
  
  // Privacy
  audience: { 
    type: String, 
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  
  // Moderation
  isArchived: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  
  // Analytics
  viewCount: { type: Number, default: 0 },
  impressionCount: { type: Number, default: 0 },
  
  // Metadata
  type: { 
    type: String, 
    enum: ['post', 'reel', 'story', 'live', 'guide', 'album'],
    default: 'post'
  },
  
  // Expiration for stories
  expiresAt: {
    type: Date,
    index: { expires: 0 } // TTL index for auto-deletion
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ 'hashtags.tag': 1 });
postSchema.index({ 'mentions.user': 1 });
postSchema.index({ location: '2dsphere' });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'media.type': 1 });

// Virtuals
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

postSchema.virtual('saveCount').get(function() {
  return this.savedBy.length;
});

// Pre-save hook to extract mentions and hashtags
postSchema.pre('save', function(next) {
  if (this.isModified('content') && this.content) {
    // Extract mentions (@username)
    const mentionRegex = /@(\w+)/g;
    let mentionMatch;
    this.mentions = [];
    
    while ((mentionMatch = mentionRegex.exec(this.content)) !== null) {
      this.mentions.push({
        username: mentionMatch[1],
        position: [mentionMatch.index, mentionMatch.index + mentionMatch[0].length]
      });
    }
    
    // Extract hashtags (#tag)
    const hashtagRegex = /#(\w+)/g;
    let hashtagMatch;
    this.hashtags = [];
    
    while ((hashtagMatch = hashtagRegex.exec(this.content)) !== null) {
      this.hashtags.push({
        tag: hashtagMatch[1].toLowerCase(),
        position: [hashtagMatch.index, hashtagMatch.index + hashtagMatch[0].length]
      });
    }
  }
  next();
});

// Method to check if user has liked the post
postSchema.methods.hasLiked = function(userId) {
  return this.likes.some(like => 
    like.user.toString() === userId.toString()
  );
};

// Method to check if user has saved the post
postSchema.methods.hasSaved = function(userId) {
  return this.savedBy.some(save => 
    save.user.toString() === userId.toString()
  );
};

// Static method to get feed posts for a user
postSchema.statics.getFeed = async function(userId, page = 1, limit = 10) {
  // In a real app, this would get posts from users the current user follows
  // and apply pagination
  const skip = (page - 1) * limit;
  
  return this.find({
    $or: [
      { user: userId },
      { audience: 'public' },
      { 
        audience: 'followers',
        user: { 
          $in: await mongoose.model('User').distinct('_id', { 
            'followers.user': userId 
          }) 
        }
      }
    ],
    isArchived: false,
    isHidden: false
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('user', 'username fullName profilePicture')
  .lean();
};

module.exports = mongoose.model('Post', postSchema);
