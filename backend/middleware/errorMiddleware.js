const logger = require("../utils/logger");

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  logger.error({
    message: err.message,
    stack: err.stack,
    requestId: req.id,
    userId: req.user ? req.user._id : "unauthenticated",
    method: req.method,
    url: req.originalUrl
  });

  res.status(statusCode).json({
    success: false,
    code: err.code || (statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR"),
    message: err.message || "An unexpected error occurred.",
    requestId: req.id || "unassigned",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };