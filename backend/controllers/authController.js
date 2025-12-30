const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const nodemailer = require("nodemailer");

// Mail transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// JWT helper
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const user = await User.create(req.body);

    // Optional email verification token
    if (typeof user.createEmailVerificationToken === "function") {
      const token = user.createEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      const url = `${req.protocol}://${req.get(
        "host"
      )}/api/auth/verify-email/${token}`;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Verify Email",
        text: `Verify here: ${url}`,
      });
    }

    res.status(201).json({
      status: "success",
      message: "User created successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  if (!user.active)
    return res.status(401).json({ message: "Verify email first" });

  createSendToken(user, 200, res);
};

// ================= LOGOUT =================
const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    httpOnly: true,
    maxAge: 10 * 1000,
  });
  res.status(200).json({ status: "success", message: "Logged out" });
};

// ================= PROTECT =================
const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not logged in" });

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ message: "User no longer exists" });

  req.user = user;
  next();
};

// ================= ROLE =================
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: "Access denied" });
  next();
};

// ================= GET ME =================
const getMe = async (req, res) => {
  res.status(200).json({ status: "success", user: req.user });
};

// ================= UPDATE ME =================
const updateMe = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ status: "success", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ================= UPDATE PASSWORD =================
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({ message: "Current password is wrong" });
    }

    user.password = newPassword;
    await user.save();
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ================= DELETE ME =================
const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ================= FORGOT PASSWORD =================
const forgotPassword = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "forgotPassword placeholder — implement email logic",
  });
};

// ================= RESET PASSWORD =================
const resetPassword = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "resetPassword placeholder — implement reset logic",
  });
};

// ================= ADMIN USER ROUTES =================
const getAllUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).json({ status: "success", users });
};

const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  res.status(200).json({ status: "success", user });
};

const updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ status: "success", user });
};

const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).json({ status: "success", data: null });
};

// Export all functions
module.exports = {
  register,
  login,
  logout,
  protect,
  restrictTo,
  getMe,
  updateMe,
  updatePassword,
  deleteMe,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
};
