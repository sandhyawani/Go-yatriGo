const logger = require("../utils/logger");

const validateEnv = () => {
  const required = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"];


  const missing = [];

  required.forEach((variable) => {
    if (!process.env[variable] || process.env[variable].trim() === "") {
      missing.push(variable);
    }
  });

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (!process.env.CLIENT_URL) {
    logger.warn("CLIENT_URL is not set. CORS will fallback to default configurations.");
  }
};

module.exports = validateEnv;