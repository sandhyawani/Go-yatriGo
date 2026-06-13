const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // If email credentials are not set, just log to console (useful for development)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS not set in environment variables.");
    console.warn("Email Details:");
    console.warn(`To: ${options.to}`);
    console.warn(`Subject: ${options.subject}`);
    console.warn(`Text: ${options.text}`);
    return;
  }

  // Create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.office365.com", // You can change this to your preferred provider
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || "Go Go YatriGo"} <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;
