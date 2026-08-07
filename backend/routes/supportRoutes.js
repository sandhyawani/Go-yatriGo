const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/verifyToken");
const {
  createTicket,
  getMyTickets,
  getFAQs,
  submitContactForm,
  replyTicket,
  reportProblem
} = require("../controllers/supportController");

router.get("/faqs", getFAQs);

router.use(protect);

router.route("/tickets").
get(getMyTickets).
post(createTicket);

router.post("/contact", submitContactForm);
router.post("/tickets/:ticketId/reply", replyTicket);
router.post("/report-problem", reportProblem);

module.exports = router;