const mongoose = require("mongoose");
const SavedPost = require("./models/SavedPost");
require("dotenv").config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/goyatrigo");
    console.log("Connected to DB");
    const result = await SavedPost.find().limit(1).lean();
    console.log("Result:", result);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
test();
