const LegalContent = require('../models/LegalContent');

exports.getLegalContent = async (req, res) => {
  try {
    const { type } = req.params;
    let content = await LegalContent.findOne({ type });
    if (!content) {
      // Create a default if it doesn't exist
      const defaultContents = {
        'privacy-policy': { 
          title: 'Privacy Policy', 
          content: 'Privacy Policy\n\nAt Go YatriGo, we take your privacy seriously. This Privacy Policy describes how we collect, use, and share your personal information when you use our platform.\n\nInformation We Collect: We collect information you provide directly to us, such as when you create an account, update your profile, or use the interactive features of the platform. This includes your name, email address, profile picture, and any posts or comments you make.\n\nHow We Use Your Information: We use the information we collect to provide, maintain, and improve our services, as well as to personalize your experience. We may also use this information to communicate with you about updates, security alerts, and support messages.\n\nSharing of Information: We do not share your personal information with third parties except as necessary to provide our services, comply with the law, or protect our rights. Your public profile and posts are visible to other users according to your privacy settings.' 
        },
        'terms': { 
          title: 'Terms & Conditions', 
          content: 'Terms & Conditions\n\nWelcome to Go YatriGo! By accessing or using our platform, you agree to be bound by these Terms and Conditions.\n\nUser Conduct: You agree to use the platform only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else\'s use and enjoyment of the platform. Harassment, abuse, or any form of harmful behavior will not be tolerated and may result in account termination.\n\nContent Ownership: You retain ownership of any content you post on the platform. By posting content, you grant Go YatriGo a non-exclusive, royalty-free license to use, reproduce, and distribute your content in connection with operating and providing the platform.\n\nTermination: We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the platform, us, or third parties, or for any other reason.' 
        },
        'community-guidelines': { title: 'Community Guidelines', content: 'Community Guidelines\n\nThese are the default community guidelines.' },
        'safety-guidelines': { title: 'Safety Guidelines', content: 'Safety Guidelines\n\nThese are the default safety guidelines.' }
      };
      if (defaultContents[type]) {
        content = await LegalContent.create({
          type,
          title: defaultContents[type].title,
          content: defaultContents[type].content
        });
      } else {
         return res.status(404).json({ success: false, message: 'Legal document not found' });
      }
    }
    res.status(200).json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
