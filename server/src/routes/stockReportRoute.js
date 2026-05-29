const express = require("express");
const { getSummary, getBalance, getMovements } = require("../controllers/stockReportController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/summary",   authenticateToken, getSummary);
router.get("/balance",   authenticateToken, getBalance);
router.get("/movements", authenticateToken, getMovements);

module.exports = router;
