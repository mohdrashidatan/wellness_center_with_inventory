const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { getAll, getById, create, update, deactivate } = require("../controllers/usersController");

const router = express.Router();

router.get("/", authenticateToken, getAll);
router.get("/:id", authenticateToken, getById);
router.post("/", authenticateToken, create);
router.put("/:id", authenticateToken, update);
router.delete("/:id", authenticateToken, deactivate);

module.exports = router;
