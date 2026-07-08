const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error("MongoDB connection URI is missing from environment variables.");
    }

    const conn = await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || "goyatrigo",
      // Modern Mongoose versions handle useNewUrlParser and useUnifiedTopology automatically,
      // but you can add pooling configurations if your traffic scales up:
      maxPoolSize: 10, 
    });

    console.log(
      `MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

// Monitor ongoing connection events
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB warning: Connection lost. Attempting to reconnect...");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});

module.exports = connectDB;