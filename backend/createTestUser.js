const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Check if test user exists
    const existing = await User.findOne({ email: "testgov@goyatrigo.com" });
    if (existing) {
      await User.deleteOne({ email: "testgov@goyatrigo.com" });
    }

    const testUser = new User({
      name: "Test GovID User",
      fullname: "Test GovID User",
      email: "testgov@goyatrigo.com",
      username: "testgoviduser",
      password: "hashedpassword", // dummy password
      mobile: "9876543210",
      govId: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      govIdType: "Aadhaar Card",
      city: "Mumbai",
      state: "Maharashtra",
      isAdmin: false,
      isVerified: false,
      verificationStatus: "pending"
    });

    await testUser.save();
    console.log("Test user created successfully!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createTestUser();
