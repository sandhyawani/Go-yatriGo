const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const checkRecentUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentUsers = await User.find({ createdAt: { $gte: twoDaysAgo } }).sort({ createdAt: -1 });
    
    console.log(`Found ${recentUsers.length} users created in the last 48 hours.`);
    for (const u of recentUsers) {
      console.log(`- ${u.name} (govId: "${u.govId}", govIdType: "${u.govIdType}", status: ${u.verificationStatus})`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkRecentUsers();
