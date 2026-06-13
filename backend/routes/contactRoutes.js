const express = require("express");
const router = express.Router();
const { submitContact, getContacts, updateContact, replyContact } = require("../controllers/contactController");
const { verifyAdmin } = require("../middleware/verifyToken");

router.post("/", submitContact);
router.get("/", verifyAdmin, getContacts);
router.put("/:id", verifyAdmin, updateContact);
router.post("/:id/reply", verifyAdmin, replyContact);

module.exports = router;
