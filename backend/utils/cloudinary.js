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
    allowedFormats: ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "mp4", "mov", "avi", "pdf"],
    resource_type: "auto",
  },
});

// Create multer upload instance with a 10MB file size limit
const uploadCloud = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = { cloudinary, uploadCloud };