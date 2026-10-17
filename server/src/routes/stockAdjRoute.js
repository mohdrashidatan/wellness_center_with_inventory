const express = require("express");
const { getBalance, createAdj } = require("../controllers/stockAdjController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/balance", authenticateToken, getBalance);
router.post("/",       authenticateToken, createAdj);

module.exports = router;
