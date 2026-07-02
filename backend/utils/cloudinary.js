const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // always return https:// URLs (avoids Mixed Content warnings)
});

// Configure storage for uploaded files
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "GoGoYatriGo_uploads",
    allowedFormats: ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "mp4", "mov", "avi"],
    resource_type: "auto",
  },
});

// Create multer upload instance
const uploadCloud = multer({ storage });

module.exports = { cloudinary, uploadCloud };