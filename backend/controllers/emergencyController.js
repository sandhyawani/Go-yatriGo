const asyncHandler = require("express-async-handler");
const EmergencyContact = require("../models/EmergencyContact");
const User = require("../models/User");
const Journey = require("../models/Journey");
const { createAndSendNotification } = require("../utils/notificationHelper");

const getContacts = asyncHandler(async (req, res) => {
  const contacts = await EmergencyContact.find({
    user: req.user._id
  }).sort({ isPrimary: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    contacts
  });
});

const addContact = asyncHandler(async (req, res) => {
  const { name, relation, phone, email, isPrimary } = req.body;

  if (!name || !phone) {
    res.status(400);
    throw new Error("Name and phone number are required.");
  }

  if (isPrimary) {
    await EmergencyContact.updateMany(
    { user: req.user._id },
    { $set: { isPrimary: false } }
    );
  }

  const contact = new EmergencyContact({
    user: req.user._id,
    name: name.trim(),
    relation: relation ? relation.trim() : undefined,
    phone: phone.trim(),
    email: email ? email.trim().toLowerCase() : undefined,
    isPrimary: isPrimary || false
  });

  await contact.save();

  res.status(201).json({
    success: true,
    contact
  });
});

const updateContact = asyncHandler(async (req, res) => {
  const { name, relation, phone, email, isPrimary } = req.body;

  const contact = await EmergencyContact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  if (contact.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (isPrimary && !contact.isPrimary) {
    await EmergencyContact.updateMany(
    { user: req.user._id, _id: { $ne: contact._id } },
    { $set: { isPrimary: false } }
    );
  }

  contact.name = name !== undefined ? name.trim() : contact.name;
  contact.relation = relation !== undefined ? relation.trim() : contact.relation;
  contact.phone = phone !== undefined ? phone.trim() : contact.phone;
  contact.email = email !== undefined ? email.trim().toLowerCase() : contact.email;
  contact.isPrimary = isPrimary !== undefined ? isPrimary : contact.isPrimary;

  await contact.save();

  res.status(200).json({
    success: true,
    contact
  });
});

const deleteContact = asyncHandler(async (req, res) => {
  const contact = await EmergencyContact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  if (contact.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const wasPrimary = contact.isPrimary;
  await contact.deleteOne();

  if (wasPrimary) {
    const nextContact = await EmergencyContact.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextContact) {
      nextContact.isPrimary = true;
      await nextContact.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "Contact removed"
  });
});

const toggleSOS = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.sosActive = !user.sosActive;
  await user.save();

  let primaryContacts = [];
  if (user.sosActive) {
    const contactsColl = await EmergencyContact.find({ user: req.user._id }).sort({ isPrimary: -1 });
    const contactsSub = user.emergencyContacts || [];

    const merged = [...contactsColl];
    contactsSub.forEach((sub) => {
      const exists = merged.some((c) => c.phone === sub.phone || c.name === sub.name);
      if (!exists) {
        merged.push({
          _id: sub._id,
          user: req.user._id,
          name: sub.name,
          relation: sub.relation,
          phone: sub.phone,
          email: sub.email,
          isPrimary: sub.isPrimary,
          createdAt: sub.createdAt || new Date()
        });
      }
    });

    primaryContacts = merged.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

    // Send in-app Safety notifications to members of active journeys
    try {
      const io = req.app.get("io");
      const activeJourneys = await Journey.find({
        "members.user": req.user._id,
        status: { $in: ["Ongoing", "Active", "upcoming", "Upcoming"] }
      });

      const notifiedMemberIds = new Set();
      activeJourneys.forEach((j) => {
        (j.members || []).forEach((m) => {
          const mId = (m.user?._id || m.user).toString();
          if (mId !== req.user._id.toString()) {
            notifiedMemberIds.add(mId);
          }
        });
      });

      for (const memberId of notifiedMemberIds) {
        await createAndSendNotification(io, {
          sender: req.user._id,
          receiver: memberId,
          type: "sos_alert",
          category: "Safety",
          message: `🚨 EMERGENCY ALERT: ${user.name || "A traveler"} has triggered Emergency SOS!`
        });
      }
    } catch (notifErr) {
      console.error("[EmergencyController] SOS notification dispatch error:", notifErr.message);
    }
  }

  res.status(200).json({
    success: true,
    sosActive: user.sosActive,
    alertedContacts: user.sosActive ? primaryContacts : []
  });
});

module.exports = {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  toggleSOS
};