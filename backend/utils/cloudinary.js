const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "GoGoYatriGo_uploads",
    allowedFormats: ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "mp4", "mov", "avi", "pdf"],
    resource_type: "auto"
  }
});

const uploadCloud = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { cloudinary, uploadCloud };