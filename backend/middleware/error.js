/**
 * Create a custom error object with attached HTTP status tracking.
 *
 * @param {number} status - HTTP status code.
 * @param {string} message - Error message.
 * @returns {Error}
 */
const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status; // Map both to ensure full middleware compatibility
  return error;
};

module.exports = {
  createError,
};