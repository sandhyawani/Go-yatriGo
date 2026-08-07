const asyncHandler = require("express-async-handler");
const SupportTicket = require("../models/SupportTicket");
const FAQ = require("../models/FAQ");

const createTicket = asyncHandler(async (req, res) => {
  const { issueType, subject, description, priority, attachments } = req.body;

  if (!issueType || !subject || !description) {
    return res.status(400).json({
      success: false,
      message: "Issue type, subject and description are required"
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
      message: description
    }]

  });

  await ticket.save();



  res.status(201).json({
    success: true,
    ticket
  });
});

const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({
    user: req.user._id
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    tickets
  });
});

const getFAQs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find({
    isActive: true
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    faqs
  });
});

const submitContactForm = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: "Subject and message are required"
    });
  }

  const ticket = new SupportTicket({
    user: req.user._id,
    issueType: "General Inquiry",
    subject,
    description: message,
    priority: "Low"
  });

  await ticket.save();



  res.status(200).json({
    success: true,
    message: "Message sent successfully",
    trackingId: ticket.trackingId
  });
});

const replyTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Reply message is required"
    });
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    user: req.user._id
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Ticket not found"
    });
  }

  if (ticket.status === "Closed") {
    return res.status(400).json({
      success: false,
      message: "Cannot reply to a closed ticket. Please open a new one."
    });
  }

  ticket.replies.push({
    sender: req.user._id,
    message
  });

  ticket.status = "Open";

  await ticket.save();

  res.status(200).json({
    success: true,
    ticket
  });
});

const reportProblem = asyncHandler(async (req, res) => {
  const ReportProblem = require("../models/ReportProblem");
  const { category, message, screenshot } = req.body;

  if (!category || !message) {
    return res.status(400).json({
      success: false,
      message: "Category and message are required"
    });
  }

  const report = await ReportProblem.create({
    userId: req.user._id,
    category,
    message,
    screenshot
  });

  res.status(201).json({
    success: true,
    report
  });
});

module.exports = {
  createTicket,
  getMyTickets,
  getFAQs,
  submitContactForm,
  replyTicket,
  reportProblem
};