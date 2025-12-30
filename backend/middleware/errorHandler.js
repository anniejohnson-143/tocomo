const AppError = require("../utils/appError");

const handleCastErrorDB = err =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = err => {
  const value = err.keyValue
    ? JSON.stringify(err.keyValue)
    : "Duplicate field";
  return new AppError(`Duplicate field value: ${value}`, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  return new AppError(errors.join(". "), 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please login again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Token expired. Please login again.", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong!"
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = Object.assign(err);

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError")
      error = handleJWTError();
    if (error.name === "TokenExpiredError")
      error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
