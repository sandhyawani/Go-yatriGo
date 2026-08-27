const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(10);
    console.log("Recent users:");
    for (const u of recentUsers) {
      console.log(`- ${u.name} (govId: "${u.govId}", status: ${u.verificationStatus})`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkUsers();
