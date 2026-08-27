const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const fixAppUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "goyatrigo",
    });
    console.log("Connected to MongoDB App DB.");

    const result = await User.updateMany(
      { govId: { $ne: "" }, verificationStatus: "unverified" },
      { $set: { verificationStatus: "pending" } }
    );
    console.log(`Fixed ${result.modifiedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

fixAppUsers();
