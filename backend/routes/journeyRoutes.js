const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/verifyToken");
const {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  toggleSOS,
} = require("../controllers/emergencyController");

router.use(protect);

router.route("/contacts")
  .get(getContacts)
  .post(addContact);

router.route("/contacts/:id")
  .put(updateContact)
  .delete(deleteContact);

router.post("/sos", toggleSOS);

module.exports = router;