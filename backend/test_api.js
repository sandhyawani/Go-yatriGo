const mongoose = require("mongoose");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("./config/jwt");
const axios = require("axios");

require("dotenv").config();

async function testApi() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/goyatrigo");
    
    let user = await User.findOne();
    if (!user) {
      console.log("No user found");
      process.exit(1);
    }
    
    const token = jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: "1h" });
    console.log("Generated token for user:", user._id);
    
    try {
      const res = await axios.get("http://localhost:5000/api/social/memory/save?idsOnly=true", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Status:", res.status);
      console.log("Data:", res.data);
    } catch (err) {
      console.log("HTTP Error:", err.response ? err.response.status : err.message);
      if (err.response) {
        console.log("Response Data:", err.response.data);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Script Error:", err);
    process.exit(1);
  }
}

testApi();
