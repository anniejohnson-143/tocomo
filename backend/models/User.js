const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 
  },
  
  // Profile Information
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  fullName: { 
    type: String, 
    trim: true,
    maxlength: 50 
  },
  bio: { 
    type: String, 
    maxlength: 150,
    default: ''
  },
  profilePicture: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  coverPhoto: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  website: { 
    type: String, 
    default: ''
  },
  
  // Privacy Settings
  isPrivate: { 
    type: Boolean, 
    default: false 
  },
  showActivityStatus: { 
    type: Boolean, 
    default: true 
  },
  
  // Social Connections
  followers: [
    { 
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  following: [
    { 
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  followRequests: [
    { 
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  blockedUsers: [
    { 
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  
  // Metadata
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Timestamps
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

userSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

userSchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user',
  count: true
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'followers.user': 1 });
userSchema.index({ 'following.user': 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate username from email
userSchema.methods.generateUsername = function() {
  return this.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + 
         Math.floor(1000 + Math.random() * 9000);
};

// Method to check if user is following another user
userSchema.methods.isFollowing = function(userId) {
  return this.following.some(follow => follow.user.toString() === userId.toString());
};

// Method to check if user has a pending follow request
userSchema.methods.hasPendingRequest = function(userId) {
  return this.followRequests.some(request => 
    request.user.toString() === userId.toString()
  );
};

// Method to check if user is blocked
userSchema.methods.isBlocked = function(userId) {
  return this.blockedUsers.some(blocked => 
    blocked.user.toString() === userId.toString()
  );
};

module.exports = mongoose.model('User', userSchema);
