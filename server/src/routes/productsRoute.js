const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { getProducts, searchSku, getProductList, getProductById, updateProduct, deactivateProduct, createProduct, getProductTransactions } = require("../controllers/productsController");

const router = express.Router();

router.get("/", authenticateToken, getProducts);
router.post("/", authenticateToken, createProduct);
router.get("/list", authenticateToken, getProductList);
router.get("/sku/search", authenticateToken, searchSku);
router.get("/:id/transactions", authenticateToken, getProductTransactions);
router.get("/:id", authenticateToken, getProductById);
router.put("/:id", authenticateToken, updateProduct);
router.delete("/:id", authenticateToken, deactivateProduct);

module.exports = router;
