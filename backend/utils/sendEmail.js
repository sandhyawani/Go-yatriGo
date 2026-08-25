const nodemailer = require("nodemailer");

const sendEmail = async (options) => {

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS not set in environment variables.");
    return;
  }

  let transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: "SSLv3"
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || "Go YatriGo"} <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;