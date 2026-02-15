const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { search, createSupplier } = require("../controllers/contactsController");

const router = express.Router();

router.get("/search", authenticateToken, search);
router.post("/",      authenticateToken, createSupplier);

module.exports = router;
