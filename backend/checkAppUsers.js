const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const checkAppUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "goyatrigo",
    });
    
    const allUsers = await User.find({}).sort({ createdAt: -1 });
    console.log(`Found ${allUsers.length} total users in app DB.`);
    for (const u of allUsers.slice(0, 15)) {
      console.log(`- ${u.name} (govId: "${u.govId}", status: ${u.verificationStatus})`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkAppUsers();
