let warnedAboutFallback = false;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || process.env.JWT;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  if (!warnedAboutFallback) {
    console.warn("JWT_SECRET is missing. Using development-only JWT secret.");
    warnedAboutFallback = true;
  }

  return "Go Go YatriGo-development-secret";
};

module.exports = {
  getJwtSecret,
};
