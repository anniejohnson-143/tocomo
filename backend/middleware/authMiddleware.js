const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");

/* ======================
   PROTECT ROUTES
====================== */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in.", 401)
      );
    }

    // Verify token (SYNC)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError("User belonging to token no longer exists.", 401)
      );
    }

    // Check password change
    if (
      currentUser.changedPasswordAfter &&
      currentUser.changedPasswordAfter(decoded.iat)
    ) {
      return next(
        new AppError("Password changed recently. Login again.", 401)
      );
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired token.", 401));
  }
};

/* ======================
   ROLE RESTRICTION
====================== */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission.", 403)
      );
    }
    next();
  };
};

/* ======================
   CHECK LOGIN (OPTIONAL)
====================== */
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (!req.cookies?.jwt) return next();

    const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) return next();
    if (
      currentUser.changedPasswordAfter &&
      currentUser.changedPasswordAfter(decoded.iat)
    ) {
      return next();
    }

    res.locals.user = currentUser;
    next();
  } catch {
    next();
  }
};
