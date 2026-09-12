const mongoose = require("mongoose");

/**
 * Validates whether a value is a valid 24-character hexadecimal MongoDB ObjectId.
 * @param {any} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  if (id instanceof mongoose.Types.ObjectId) return true;
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  return /^[0-9a-fA-F]{24}$/.test(trimmed) && mongoose.Types.ObjectId.isValid(trimmed);
};

/**
 * Express middleware to validate an ObjectId parameter in req.params.
 * Returns 400 Bad Request with standardized error code if invalid.
 * @param {string} paramName - Parameter name in req.params (defaults to 'id')
 */
const validateObjectIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_ID",
        message: `Invalid ${paramName} format: must be a 24-character hexadecimal ObjectId.`
      });
    }
    next();
  };
};

module.exports = {
  isValidObjectId,
  validateObjectIdParam
};
