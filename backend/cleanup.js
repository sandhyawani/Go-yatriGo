const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'yatrigo';

async function cleanup() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log("Connected.");
    
    const db = mongoose.connection.db;
    const journeys = db.collection('journeys');
    const travelgroups = db.collection('travelgroups');
    
    // Delete trips that don't have a valid 'from' field (starting point)
    const badQuery = {
      $or: [
        { from: { $exists: false } },
        { from: "" },
        { from: null },
        { from: { $regex: /unk/i } },
        { from: { $regex: /unknown/i } }
      ]
    };
    
    const badJ = await journeys.deleteMany(badQuery);
    const badTG = await travelgroups.deleteMany(badQuery);
    
    console.log(`Deleted ${badJ.deletedCount} journeys missing 'from' data.`);
    console.log(`Deleted ${badTG.deletedCount} travel groups missing 'from' data.`);

    console.log("Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanup();
