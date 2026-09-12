const logger = require("../utils/logger");

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = "NOT_FOUND";
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let code = err.code || (statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR");
  let message = err.message || "An unexpected error occurred.";

  if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = `Invalid ${err.path || "ID"} format: ${err.value}`;
  }

  if (err.name === "ValidationError") {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors.length > 0 ? errors.join(", ") : "Validation failed";
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "UNAUTHORIZED";
    message = "Invalid or malformed authentication token. Please log in again.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Your authentication session has expired. Please log in again.";
  }

  logger.error({
    message: err.message,
    statusCode,
    code,
    requestId: req.id || "unassigned",
    userId: req.user ? (req.user._id || req.user.id) : "unauthenticated",
    method: req.method,
    url: req.originalUrl,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });

  return res.status(statusCode).json({
    success: false,
    code,
    message,
    requestId: req.id || "unassigned",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };