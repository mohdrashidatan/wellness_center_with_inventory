const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  listSerials,
  getAvailable,
  getHistory,
  getReconciliation,
  getSerializedProducts,
  registerExisting,
} = require("../controllers/serialController");

const router = express.Router();

// Static paths first so they are not captured by /:id
router.get("/reconciliation", authenticateToken, getReconciliation);
router.get("/products", authenticateToken, getSerializedProducts);
router.get("/available/:productId", authenticateToken, getAvailable);
router.post("/register", authenticateToken, registerExisting);
router.get("/", authenticateToken, listSerials);
router.get("/:id/history", authenticateToken, getHistory);

module.exports = router;
