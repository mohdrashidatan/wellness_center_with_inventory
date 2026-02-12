const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { getIterests } = require("../controllers/iterestsController");

const router = express.Router();

router.get("/", authenticateToken, getIterests);

module.exports = router;
