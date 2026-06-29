const LegalContent = require("../models/LegalContent");

// Get legal document by type
exports.getLegalContent = async (req, res) => {
  try {
    const { type } = req.params;

    let content = await LegalContent.findOne({ type });

    // Create default content if document does not exist
    if (!content) {
      const defaultContents = {
        "privacy-policy": {
          title: "Privacy Policy",
          content: "Privacy Policy\n\nAt Go YatriGo, we take your privacy seriously..."
        },

        terms: {
          title: "Terms & Conditions",
          content: "Terms & Conditions\n\nWelcome to Go YatriGo..."
        },

        "community-guidelines": {
          title: "Community Guidelines",
          content: "Community Guidelines\n\nThese are the default community guidelines."
        },

        "safety-guidelines": {
          title: "Safety Guidelines",
          content: "Safety Guidelines\n\nThese are the default safety guidelines."
        }
      };

      if (defaultContents[type]) {
        content = await LegalContent.create({
          type,
          title: defaultContents[type].title,
          content: defaultContents[type].content,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Legal document not found",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};