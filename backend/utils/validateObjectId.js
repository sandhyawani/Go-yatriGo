const mongoose = require("mongoose");

const isValidObjectId = (id) => {
  if (!id) return false;
  if (id instanceof mongoose.Types.ObjectId) return true;
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  return /^[0-9a-fA-F]{24}$/.test(trimmed) && mongoose.Types.ObjectId.isValid(trimmed);
};

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
