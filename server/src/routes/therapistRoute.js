const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { getTherapists } = require("../controllers/therapistController");

const router = express.Router();

router.get("/", authenticateToken, getTherapists);

module.exports = router;
