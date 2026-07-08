let hasWarnedAboutFallback = false;

/**
 * Retrieves the JWT signing secret from environment variables.
 * Falls back to a hardcoded string only in non-production environments.
 * @returns {string} The JWT secret key.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || process.env.JWT;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL: JWT_SECRET is missing in production environment variables.");
  }

  if (!hasWarnedAboutFallback) {
    console.warn("WARNING: JWT_SECRET is missing. Using insecure development fallback secret.");
    hasWarnedAboutFallback = true;
  }

  return "Go Go YatriGo-development-secret";
};

module.exports = {
  getJwtSecret,
};