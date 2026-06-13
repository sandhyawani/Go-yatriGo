const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/verifyToken");
const {
  createTicket,
  getMyTickets,
  getFAQs,
  submitContactForm,
  replyTicket,
  reportProblem,
} = require("../controllers/supportController");

// Public routes
router.get("/faqs", getFAQs);

// Protected routes
router.use(protect);

router.route("/tickets")
  .get(getMyTickets)
  .post(createTicket);

router.post("/contact", submitContactForm);
router.post("/tickets/:ticketId/reply", replyTicket);
router.post("/report-problem", reportProblem);

module.exports = router;
