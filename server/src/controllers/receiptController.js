const productsService = require("../services/productsService");
require("dotenv").config();
nodemailer = require("nodemailer");
const fs = require("fs").promises;

const sentEmail = async (req, res) => {
  try {
    console.log("in here");

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path; // from multer
    const { email } = req.body; // fronent email
    // if (!email) {
    //   return res.status(400).json({ error: "Email tujuan wajib diisi" });
    // }

    // setup transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // sent email with attachment
    await transporter.sendMail({
      from: '"Therapy Centre" ',
      to: email, // dari req.body.email
      subject: "Your Receipt",
      text: "Here is your receipt in PDF format",
      attachments: [
        {
          filename: "receipt.pdf",
          path: filePath,
        },
      ],
    });

    // delete file
    fs.unlink(filePath);

    res.status(200).json({ sent: true, message: "Success Sent Email" });
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ sent: false, message: "Failed Sent Email" });
  }
};

module.exports = { sentEmail };
