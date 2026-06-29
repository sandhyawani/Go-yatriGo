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

  // Keep only one primary contact
  if (isPrimary) {
    await EmergencyContact.updateMany(
      { user: req.user._id },
      { $set: { isPrimary: false } }
    );
  }

  const contact = new EmergencyContact({
    user: req.user._id,
    name,
    relation,
    phone,
    email,
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

  // Check if contact exists
  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  // Ensure user owns this contact
  if (contact.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  // Keep only one primary contact
  if (isPrimary) {
    await EmergencyContact.updateMany(
      { user: req.user._id },
      { $set: { isPrimary: false } }
    );
  }

  contact.name = name || contact.name;
  contact.relation = relation || contact.relation;
  contact.phone = phone || contact.phone;
  contact.email = email || contact.email;
  contact.isPrimary =
    isPrimary !== undefined ? isPrimary : contact.isPrimary;

  await contact.save();

  res.status(200).json({
    success: true,
    contact,
  });
});

// Delete an emergency contact
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await EmergencyContact.findById(req.params.id);

  // Check if contact exists
  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  // Ensure user owns this contact
  if (contact.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  await contact.deleteOne();

  res.status(200).json({
    success: true,
    message: "Contact removed",
  });
});

// Activate or deactivate SOS mode
const toggleSOS = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Check if user exists
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Toggle current SOS status
  user.sosActive = !user.sosActive;

  await user.save();

  // Get primary contacts when SOS is activated
  if (user.sosActive) {
    const primaryContacts = await EmergencyContact.find({
      user: req.user._id,
      isPrimary: true,
    });

  }

  res.status(200).json({
    success: true,
    sosActive: user.sosActive,
  });
});

module.exports = {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  toggleSOS,
};