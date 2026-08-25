const mongoose = require("mongoose");
const User = require("../models/User");
const Block = require("../models/Block");
const { unblockUserAction } = require("../utils/blockHelper");

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId).select("blockedUsers").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const blockDocs = await Block.find({ blocker: userId }).select("blocked").lean();
    const blockedIdSet = new Set();

    if (Array.isArray(user.blockedUsers)) {
      user.blockedUsers.forEach((id) => {
        const idStr = (id._id || id)?.toString();
        if (idStr) blockedIdSet.add(idStr);
      });
    }

    if (Array.isArray(blockDocs)) {
      blockDocs.forEach((b) => {
        const idStr = b.blocked?.toString();
        if (idStr) blockedIdSet.add(idStr);
      });
    }

    const blockedObjectIds = Array.from(blockedIdSet)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const blockedUsers = await User.find({ _id: { $in: blockedObjectIds } }).select(
      "name username pic img avatar profilePic profilePicture userPic isVerified"
    ).lean();

    res.status(200).json({
      success: true,
      blockedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const targetUserId = req.params.userId || req.params.id;

    await unblockUserAction(userId, targetUserId);

    res.status(200).json({
      success: true,
      message: "User unblocked"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      contacts: user.emergencyContacts || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.body.isPrimary && Array.isArray(user.emergencyContacts)) {
      user.emergencyContacts.forEach((contact) => {
        contact.isPrimary = false;
      });
    }

    if (!user.emergencyContacts) user.emergencyContacts = [];
    user.emergencyContacts.push(req.body);

    await user.save();

    res.status(201).json({
      success: true,
      contacts: user.emergencyContacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const contactId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const contact = user.emergencyContacts ? user.emergencyContacts.id(contactId) : null;

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    if (req.body.isPrimary && Array.isArray(user.emergencyContacts)) {
      user.emergencyContacts.forEach((item) => {
        item.isPrimary = false;
      });
    }

    Object.assign(contact, req.body);

    await user.save();

    res.status(200).json({
      success: true,
      contacts: user.emergencyContacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const contactId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.emergencyContacts = (user.emergencyContacts || []).filter(
      (contact) => contact._id.toString() !== contactId.toString()
    );

    await user.save();

    res.status(200).json({
      success: true,
      contacts: user.emergencyContacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
