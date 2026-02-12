const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { sentEmail } = require("../controllers/receiptController");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

const router = express.Router();

// Registration route

router.post("/sentemail", authenticateToken, upload.single("file"), sentEmail);

module.exports = router;
