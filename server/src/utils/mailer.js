const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendPasswordResetEmail = async (to, resetUrl) => {
  await getTransporter().sendMail({
    from: `"Therapy Centre" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your password",
    text: `We received a request to reset your password. This link expires in ${process.env.RESET_PASSWORD_TOKEN_EXP_MIN || 30} minutes:\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `<p>We received a request to reset your password. This link expires in ${process.env.RESET_PASSWORD_TOKEN_EXP_MIN || 30} minutes.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
};

module.exports = {
  getTransporter,
  sendPasswordResetEmail,
};
