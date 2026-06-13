const { cloudinary } = require('../utils/cloudinary');

// Multipart/form-data upload (via multer-cloudinary middleware)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }
    res.status(200).json({
      success: true,
      url: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Base64 upload — accepts { data: "data:image/..." } in JSON body
// Returns Cloudinary URL. Falls back to the data URL itself if Cloudinary is unconfigured.
exports.uploadBase64Image = async (req, res) => {
  try {
    const { data, folder = "Go Go YatriGo_uploads" } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: "No image data provided" });
    }

    // If Cloudinary is not configured, return the data URL as-is (graceful fallback)
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(200).json({ success: true, url: data, fallback: true });
    }

    const result = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: "image",
      quality: "auto:good",
      fetch_format: "auto"
    });

    res.status(200).json({ success: true, url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    // If Cloudinary upload fails, fall back to the raw data URL
    if (req.body && req.body.data) {
      return res.status(200).json({ success: true, url: req.body.data, fallback: true });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
