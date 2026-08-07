const { cloudinary } = require("../utils/cloudinary");

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document or image file provided"
      });
    }

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      url: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.uploadBase64Image = async (req, res) => {
  try {
    const { data, folder = "Go YatriGo_uploads" } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "No data string provided"
      });
    }

    if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET)
    {
      return res.status(500).json({
        success: false,
        message: "Cloudinary credentials are not configured on the server. Upload blocked to prevent data loss."
      });
    }

    const isPdf = data.startsWith("data:application/pdf");

    const uploadOptions = {
      folder,
      resource_type: isPdf ? "raw" : "auto"
    };

    if (!isPdf) {
      uploadOptions.quality = "auto:good";
      uploadOptions.fetch_format = "auto";
    }

    const result = await cloudinary.uploader.upload(data, uploadOptions);

    res.status(200).json({
      success: true,
      message: "Document uploaded to Cloudinary successfully",
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error("Cloudinary Upload Failure:", error);
    res.status(500).json({
      success: false,
      message: `Cloudinary upload failed: ${error.message}`
    });
  }
};