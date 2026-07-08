const Contact = require("../models/Contact");

// Save a new contact message from user
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Direct structural validation
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email, and message are required." });
    }

    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : "No Subject",
      message: message.trim(),
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: "Message sent",
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all contact messages for admin (Paginated to optimize memory)
const getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalContacts = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      contacts,
      page,
      totalPages: Math.ceil(totalContacts / limit),
      totalContacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update contact request status
const updateContact = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status state value is required." });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.status(200).json({ success: true, contact });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add admin reply and mark issue as resolved
const replyContact = async (req, res) => {
  try {
    const { message } = req.body;
    // Safely extract admin ID if an authentication middleware populates req.user
    const adminId = req.user ? (req.user._id || req.user.id) : null; 

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Reply message text cannot be empty." });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Capture context details inside subdocuments
    contact.replies.push({
      message: message.trim(),
      repliedBy: adminId,
      createdAt: new Date()
    });
    
    contact.status = "RESOLVED";
    await contact.save();

    res.status(200).json({
      success: true,
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  submitContact,
  getContacts,
  updateContact,
  replyContact,
};