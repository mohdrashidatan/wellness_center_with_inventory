const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { getList, getById, create } = require("../controllers/doController");

const router = express.Router();

router.get("/",    authenticateToken, getList);
router.post("/",   authenticateToken, create);
router.get("/:id", authenticateToken, getById);

module.exports = router;
