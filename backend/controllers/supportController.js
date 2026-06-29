const asyncHandler = require("express-async-handler");
const SupportTicket = require("../models/SupportTicket");
const FAQ = require("../models/FAQ");

// Create a new support ticket
const createTicket = asyncHandler(async (req, res) => {
  const { issueType, subject, description, priority, attachments } = req.body;

  if (!issueType || !subject || !description) {
    return res.status(400).json({
      success: false,
      message: "Issue type, subject and description are required",
    });
  }

  const ticket = new SupportTicket({
    user: req.user._id,
    issueType,
    subject,
    description,
    priority: priority || "Medium",
    attachments: attachments || [],
    replies: [
      {
        sender: req.user._id,
        message: description,
      },
    ],
  });

  await ticket.save();

  // Mock email notification
  console.info(
    `[MOCK EMAIL] New support ticket created: ${ticket.trackingId} by User ${req.user._id}`
  );

  res.status(201).json({
    success: true,
    ticket,
  });
});

// Get all support tickets of the logged-in user
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    tickets,
  });
});

// Get all active FAQs
const getFAQs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find({
    isActive: true,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    faqs,
  });
});

// Submit a contact form
const submitContactForm = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: "Subject and message are required",
    });
  }

  const ticket = new SupportTicket({
    user: req.user._id,
    issueType: "General Inquiry",
    subject,
    description: message,
    priority: "Low",
  });

  await ticket.save();

  // Mock confirmation email
  console.info(
    `[MOCK EMAIL] Contact form received from ${req.user.email}. Tracking ID: ${ticket.trackingId}`
  );

  res.status(200).json({
    success: true,
    message: "Message sent successfully",
    trackingId: ticket.trackingId,
  });
});

// Reply to a support ticket
const replyTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Reply message is required",
    });
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    user: req.user._id,
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Ticket not found",
    });
  }

  ticket.replies.push({
    sender: req.user._id,
    message,
  });

  await ticket.save();

  res.status(200).json({
    success: true,
    ticket,
  });
});

// Report an application issue
const reportProblem = asyncHandler(async (req, res) => {
  const ReportProblem = require("../models/ReportProblem");
  const { category, message, screenshot } = req.body;

  if (!category || !message) {
    return res.status(400).json({
      success: false,
      message: "Category and message are required",
    });
  }

  const report = await ReportProblem.create({
    userId: req.user._id,
    category,
    message,
    screenshot,
  });

  res.status(201).json({
    success: true,
    report,
  });
});

module.exports = {
  createTicket,
  getMyTickets,
  getFAQs,
  submitContactForm,
  replyTicket,
  reportProblem,
};