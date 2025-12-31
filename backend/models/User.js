const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    // Auth
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },

    // Profile
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    fullName: String,
    bio: { type: String, default: "", maxlength: 150 },

    profilePicture: {
      url: String,
      publicId: String
    },
    coverPhoto: {
      url: String,
      publicId: String
    },

    // Privacy
    isPrivate: { type: Boolean, default: false },

    // Social
    followers: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
    following: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
    followRequests: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
    blockedUsers: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],

    // Security
    emailVerified: { type: Boolean, default: true },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ "followers.user": 1 });
userSchema.index({ "following.user": 1 });

// Hash password
// Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Methods
userSchema.methods.correctPassword = function (password, userPassword) {
  return bcrypt.compare(password, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

module.exports = mongoose.model("User", userSchema);
