const mongoose = require("mongoose");
const User = require("./backend/models/User");
require("dotenv").config({ path: "./backend/.env" });

const fixUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

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

fixUsers();
