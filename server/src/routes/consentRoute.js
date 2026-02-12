const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { createConsents, getConsents, deleteById, getConsentsById, updateConsents } = require("../controllers/consentsController");

const router = express.Router();

// Registration route
router.post("/:id", authenticateToken, createConsents);
router.get("/", authenticateToken, getConsents);
router.get("/:id", authenticateToken, getConsentsById);
router.put("/:id", authenticateToken, updateConsents);
router.delete("/:id", authenticateToken, deleteById);

module.exports = router;
