const asyncHandler = require("express-async-handler");
const EmergencyContact = require("../models/EmergencyContact");
const User = require("../models/User");

// @desc    Get user's emergency contacts
// @route   GET /api/emergency/contacts
// @access  Private
const getContacts = asyncHandler(async (req, res) => {
  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ isPrimary: -1, createdAt: -1 });
  res.status(200).json({ success: true, contacts });
});

// @desc    Add new emergency contact
// @route   POST /api/emergency/contacts
// @access  Private
const addContact = asyncHandler(async (req, res) => {
  const { name, relation, phone, email, isPrimary } = req.body;

  // If new contact is primary, optionally unset others
  if (isPrimary) {
    await EmergencyContact.updateMany({ user: req.user._id }, { $set: { isPrimary: false } });
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

  res.status(201).json({ success: true, contact });
});

// @desc    Update emergency contact
// @route   PUT /api/emergency/contacts/:id
// @access  Private
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

  if (isPrimary) {
    await EmergencyContact.updateMany({ user: req.user._id }, { $set: { isPrimary: false } });
  }

  contact.name = name || contact.name;
  contact.relation = relation || contact.relation;
  contact.phone = phone || contact.phone;
  contact.email = email || contact.email;
  contact.isPrimary = isPrimary !== undefined ? isPrimary : contact.isPrimary;

  await contact.save();

  res.status(200).json({ success: true, contact });
});

// @desc    Delete emergency contact
// @route   DELETE /api/emergency/contacts/:id
// @access  Private
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

  await contact.deleteOne();

  res.status(200).json({ success: true, message: "Contact removed" });
});

// @desc    Toggle SOS Alert
// @route   POST /api/emergency/sos
// @access  Private
const toggleSOS = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.sosActive = !user.sosActive;
  await user.save();

  if (user.sosActive) {
    // Fetch primary contacts
    const primaryContacts = await EmergencyContact.find({ user: req.user._id, isPrimary: true });
    
    // TODO: Send mock SMS/Email to primary contacts
    console.log(`[MOCK SOS ALERT] Sent SOS to ${primaryContacts.length} primary contacts for User ${user.email}`);
  }

  res.status(200).json({ success: true, sosActive: user.sosActive });
});

module.exports = {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  toggleSOS,
};
