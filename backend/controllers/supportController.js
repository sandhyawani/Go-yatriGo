const asyncHandler = require("express-async-handler");
const SupportTicket = require("../models/SupportTicket");
const FAQ = require("../models/FAQ");
const User = require("../models/User");

// @desc    Create new support ticket
// @route   POST /api/support/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const { issueType, subject, description, priority, attachments } = req.body;

  const ticket = new SupportTicket({
    user: req.user._id,
    issueType,
    subject,
    description,
    priority: priority || "Medium",
    attachments: attachments || [],
    replies: [{
      sender: req.user._id,
      message: description
    }]
  });

  await ticket.save();

  // TODO: Send mock email to support team
  console.log(`[MOCK EMAIL] New support ticket created: ${ticket.trackingId} by User ${req.user._id}`);

  res.status(201).json({ success: true, ticket });
});

// @desc    Get user's support tickets
// @route   GET /api/support/tickets
// @access  Private
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, tickets });
});

// @desc    Get all active FAQs
// @route   GET /api/support/faqs
// @access  Public
const getFAQs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find({ isActive: true }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, faqs });
});

// @desc    Submit general contact form (Contact Us page)
// @route   POST /api/support/contact
// @access  Private
const submitContactForm = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  
  const ticket = new SupportTicket({
    user: req.user._id,
    issueType: "General Inquiry",
    subject,
    description: message,
    priority: "Low",
  });

  await ticket.save();

  // TODO: Mock send confirmation email to user
  console.log(`[MOCK EMAIL] Contact form received from ${req.user.email}. Tracking ID: ${ticket.trackingId}`);

  res.status(200).json({ success: true, message: "Message sent successfully", trackingId: ticket.trackingId });
});

// @desc    Reply to a support ticket
// @route   POST /api/support/tickets/:ticketId/reply
// @access  Private
const replyTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  
  const ticket = await SupportTicket.findOne({ _id: ticketId, user: req.user._id });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  ticket.replies.push({
    sender: req.user._id,
    message
  });
  await ticket.save();

  res.status(200).json({ success: true, ticket });
});

// @desc    Report a problem
// @route   POST /api/support/report-problem
// @access  Private
const reportProblem = asyncHandler(async (req, res) => {
  const ReportProblemModel = require("../models/ReportProblem");
  const { category, message, screenshot } = req.body;
  const report = await ReportProblemModel.create({
    userId: req.user._id,
    category,
    message,
    screenshot
  });
  res.status(201).json({ success: true, report });
});

module.exports = {
  createTicket,
  getMyTickets,
  getFAQs,
  submitContactForm,
  replyTicket,
  reportProblem,
};
