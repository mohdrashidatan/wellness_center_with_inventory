const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { getProducts } = require("../controllers/productsController");

const router = express.Router();

// Registration route

router.get("/", authenticateToken, getProducts);

module.exports = router;
