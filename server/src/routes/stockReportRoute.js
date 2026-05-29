const express = require("express");
const { getSummary, getMovements } = require("../controllers/stockReportController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/summary", authenticateToken, getSummary);
router.get("/movements", authenticateToken, getMovements);

module.exports = router;
