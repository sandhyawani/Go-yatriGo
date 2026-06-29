const { cloudinary } = require("../utils/cloudinary");

// Upload image using Cloudinary and Multer
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: req.file.path,
      public_id: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload Base64 image
exports.uploadBase64Image = async (req, res) => {
  try {
    const {
      data,
      folder = "Go YatriGo_uploads",
    } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "No image data provided",
      });
    }

    // Return Base64 image if Cloudinary is not configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(200).json({
        success: true,
        message: "Image uploaded using fallback mode",
        url: data,
        fallback: true,
      });
    }

    const result = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: "image",
      quality: "auto:good",
      fetch_format: "auto",
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    // Return Base64 image if Cloudinary upload fails
    if (req.body?.data) {
      return res.status(200).json({
        success: true,
        message: "Image uploaded using fallback mode",
        url: req.body.data,
        fallback: true,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};