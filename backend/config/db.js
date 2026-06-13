const mongoose = require("mongoose");

// mongoose.set("bufferCommands", false); // Enable buffering to prevent immediate errors during connection

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;
  const isDbRequired =
    process.env.MONGO_REQUIRED === "true" || process.env.NODE_ENV === "production";

  if (!mongoUri) {
    const message = "MongoDB connection skipped: MONGO_URI is missing in .env";

    if (isDbRequired) {
      console.error(message);
    }

    console.warn(`${message}. Starting API without database.`);
    mongoose.set('bufferCommands', false);
    return null;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 30000,
      tls: true,
      tlsInsecure: true, // Fixes local SSL internal errors with MongoDB Atlas
    };
    const networkFamily = Number(process.env.MONGO_NETWORK_FAMILY);

    if (dbName) {
      options.dbName = dbName;
    }

    if (networkFamily === 4 || networkFamily === 6) {
      options.family = networkFamily;
    }

    const conn = await mongoose.connect(mongoUri, options);
    console.log(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`.green.bold
    );
    return conn;
  } catch (error) {
    const message = `MongoDB connection failed: ${error.message}`;

    if (isDbRequired) {
      console.error(message);
      // process.exit(1);
    }

    console.warn(`${message}. Starting API without database.`);
    mongoose.set('bufferCommands', false);
    return null;
  }
};

module.exports = connectDB;
