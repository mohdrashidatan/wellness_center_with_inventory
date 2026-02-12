const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { createConsents, getConsents, deleteById, getConsentsById, updateConsents } = require("../controllers/consentsController");
const { getPackages, postCusPackages, getCusPackages, minCusPackages } = require("../controllers/packagesController");

const router = express.Router();

// Registration route
router.get("/", authenticateToken, getPackages);
router.get("/:customerId", authenticateToken, getCusPackages);
router.post("/:customerId", authenticateToken, postCusPackages);
router.put("/mincuspackage", authenticateToken, minCusPackages);

module.exports = router;
