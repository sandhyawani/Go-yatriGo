const express = require("express");
const router = express.Router();
const { uploadImage, uploadBase64Image } = require("../controllers/uploadController");
const { uploadCloud } = require("../utils/cloudinary");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/", uploadCloud.single("image"), uploadImage);
router.post("/base64", verifyToken, uploadBase64Image);

router.post("/multiple", uploadCloud.array("images", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }
    const urls = req.files.map((file) => file.path);
    res.status(200).json({ success: true, urls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;