require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.E2E_MONGODB_URI;

if (!uri) {
  throw new Error("E2E_MONGODB_URI is not defined in .env");
}

let isConnected = false;

const connectE2eDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("Connected to go-yatrigo-e2e DB");
  } catch (error) {
    console.error("DB connection error:", error);
  }
};

const disconnectE2eDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
  }
};

// Require schemas directly from backend folder to ensure exact match
const User = require('../backend/models/User');
const Journey = require('../backend/models/Journey');
const JourneyInvitation = require('../backend/models/JourneyInvitation');
const JourneyJoinRequest = require('../backend/models/JourneyJoinRequest');
const ChatRoom = require('../backend/models/ChatRoom');
const Message = require('../backend/models/Message');

module.exports = {
  connectE2eDB,
  disconnectE2eDB,
  User,
  Journey,
  JourneyInvitation,
  JourneyJoinRequest,
  ChatRoom,
  Message
};
