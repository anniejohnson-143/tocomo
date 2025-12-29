const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // User who triggered the notification
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Type of notification
  type: {
    type: String,
    required: true,
    enum: [
      'like',           // When someone likes a post
      'comment',        // When someone comments on a post
      'reply',          // When someone replies to a comment
      'follow',         // When someone follows the user
      'follow_request', // When someone requests to follow (for private accounts)
      'mention',        // When someone mentions the user in a post/comment
      'message',        // When someone sends a direct message
      'post_share',     // When someone shares the user's post
      'tag',            // When someone tags the user in a post
      'reaction',       // When someone reacts to a message (if implementing message reactions)
      'group_invite',   // When someone invites the user to a group
      'event_reminder', // For event reminders
      'story_reply',    // When someone replies to a story
      'story_mention',  // When someone mentions in a story
      'story_reaction', // When someone reacts to a story
      'new_follower',   // When someone new follows the user
      'accepted_request' // When a follow request is accepted
    ]
  },
  
  // Reference to the related content
  reference: {
    type: {
      type: String,
      required: true,
      enum: ['post', 'comment', 'user', 'message', 'story', 'group', 'event']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    // Additional context about the reference
    preview: String
  },
  
  // Additional data for the notification
  data: {
    // For comments and replies: preview of the text
    text: {
      type: String,
      maxlength: 200
    },
    
    // For reactions: the emoji used
    reaction: {
      type: String,
      maxlength: 10
    },
    
    // For group invites: group name
    groupName: String,
    
    // For follow requests: status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    
    // For event reminders: event details
    event: {
      title: String,
      startTime: Date,
      location: String
    },
    
    // For story replies: media type
    mediaType: {
      type: String,
      enum: ['photo', 'video', null],
      default: null
    }
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Whether to send email for this notification
  emailSent: {
    type: Boolean,
    default: false
  },
  
  // Whether to send push notification
  pushSent: {
    type: Boolean,
    default: false
  },
  
  // For grouping related notifications
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  // For expiring notifications
  expiresAt: {
    type: Date,
    index: { expires: '30d' } // Auto-delete after 30 days
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for common queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ 'reference.id': 1, 'reference.type': 1 });
notificationSchema.index({ createdAt: 1 });

// Virtual for notification message
notificationSchema.virtual('message').get(function() {
  const senderName = this.sender ? this.sender.username : 'Someone';
  
  switch (this.type) {
    case 'like':
      return `${senderName} liked your ${this.reference.type}`;
    case 'comment':
      return `${senderName} commented on your ${this.reference.type}`;
    case 'reply':
      return `${senderName} replied to your comment`;
    case 'follow':
      return `${senderName} started following you`;
    case 'follow_request':
      return `${senderName} wants to follow you`;
    case 'mention':
      return `${senderName} mentioned you in a ${this.reference.type}`;
    case 'message':
      return this.data.text 
        ? `${senderName}: ${this.data.text.substring(0, 30)}${this.data.text.length > 30 ? '...' : ''}`
        : `${senderName} sent you a message`;
    case 'post_share':
      return `${senderName} shared your post`;
    case 'tag':
      return `${senderName} tagged you in a post`;
    case 'reaction':
      return `${senderName} reacted with ${this.data.reaction || '👍'} to your ${this.reference.type}`;
    case 'group_invite':
      return `${senderName} invited you to join ${this.data.groupName || 'a group'}`;
    case 'event_reminder':
      return `Reminder: ${this.data.event?.title || 'Event'} is starting soon`;
    case 'story_reply':
      return `${senderName} replied to your story`;
    case 'story_mention':
      return `${senderName} mentioned you in their story`;
    case 'story_reaction':
      return `${senderName} reacted to your story`;
    case 'new_follower':
      return `${senderName} started following you`;
    case 'accepted_request':
      return `${senderName} accepted your follow request`;
    default:
      return 'New notification';
  }
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    recipient: userId, 
    isRead: false 
  });
};

// Pre-save hook to set expiration
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set default expiration to 30 days from now
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + thirtyDays);
  }
  
  // Set threadId for grouping related notifications
  if (!this.threadId) {
    this.threadId = this._id;
  }
  
  next();
});

// Static method to create a notification
notificationSchema.statics.createNotification = async function(data) {
  const {
    recipient,
    sender,
    type,
    referenceType,
    referenceId,
    referencePreview,
    data: notificationData,
    threadId
  } = data;

  // Check if a similar notification already exists recently
  const recentNotification = await this.findOne({
    recipient,
    sender,
    type,
    'reference.type': referenceType,
    'reference.id': referenceId,
    createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
  });

  if (recentNotification) {
    // Update existing notification instead of creating a new one
    recentNotification.createdAt = new Date();
    recentNotification.isRead = false;
    if (notificationData) {
      recentNotification.data = { ...recentNotification.data, ...notificationData };
    }
    return recentNotification.save();
  }

  // Create new notification
  return this.create({
    recipient,
    sender,
    type,
    reference: {
      type: referenceType,
      id: referenceId,
      preview: referencePreview
    },
    data: notificationData,
    threadId
  });
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

// Static method to get notifications for a user with pagination
notificationSchema.statics.getUserNotifications = function(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  
  return this.aggregate([
    { $match: { recipient: mongoose.Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'sender'
      }
    },
    { $unwind: '$sender' },
    {
      $project: {
        'sender.password': 0,
        'sender.email': 0,
        'sender.__v': 0
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: '%Y-%m-%d', 
            date: '$createdAt' 
          }
        },
        notifications: { $push: '$$ROOT' }
      }
    },
    { $sort: { '_id': -1 } }
  ]);
};

module.exports = mongoose.model('Notification', notificationSchema);
