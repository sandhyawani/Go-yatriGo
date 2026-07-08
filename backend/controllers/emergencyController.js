const asyncHandler = require("express-async-handler");
const EmergencyContact = require("../models/EmergencyContact");
const User = require("../models/User");

// Get all emergency contacts of logged-in user
const getContacts = asyncHandler(async (req, res) => {
  const contacts = await EmergencyContact.find({
    user: req.user._id,
  }).sort({ isPrimary: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    contacts,
  });
});

// Add a new emergency contact
const addContact = asyncHandler(async (req, res) => {
  const { name, relation, phone, email, isPrimary } = req.body;

  if (!name || !phone) {
    res.status(400);
    throw new Error("Name and phone number are required.");
  }

  // Handle primary isolation cleanly using a bulk write or sequential block before document instantiation
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
    isPrimary: isPrimary || false,
  });

  await contact.save();

  res.status(201).json({
    success: true,
    contact,
  });
});

// Update an existing emergency contact
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

  // Atomic correction swap: Only run reset operations if flag state shifts to true explicitly
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
    contact,
  });
});

// Delete an emergency contact
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

  // Automatic Fallback Strategy: If primary contact is deleted, promote the next newest contact
  if (wasPrimary) {
    const nextContact = await EmergencyContact.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextContact) {
      nextContact.isPrimary = true;
      await nextContact.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "Contact removed",
  });
});

// Activate or deactivate SOS mode
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
    
    primaryContacts = await EmergencyContact.find({ user: req.user._id }).sort({ isPrimary: -1 });
    
    
    // e.g., await SMSNotificationEngine.dispatchSOS(primaryContacts, user);
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
  toggleSOS,
};