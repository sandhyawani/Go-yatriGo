const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const checkAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const allUsers = await User.find({}).sort({ createdAt: -1 });
    console.log(`Found ${allUsers.length} total users.`);
    for (const u of allUsers.slice(0, 15)) {
      console.log(`- ${u.name} (createdAt: ${u.createdAt}, govId: "${u.govId}", govIdType: "${u.govIdType}", status: ${u.verificationStatus})`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkAllUsers();
