const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  getProducts, searchSku, searchProductsHandler, getProductList, getProductById, updateProduct,
  deactivateProduct, createProduct, getProductTransactions,
  getProductSkus,
  getProductVariants, createVariantOption, updateVariantOption, deleteVariantOption,
  addVariantValue, updateVariantValue, deleteVariantValue,
} = require("../controllers/productsController");

const router = express.Router();

router.get("/", authenticateToken, getProducts);
router.post("/", authenticateToken, createProduct);
router.get("/list", authenticateToken, getProductList);
router.get("/search", authenticateToken, searchProductsHandler);
router.get("/sku/search", authenticateToken, searchSku);
router.get("/:id/transactions", authenticateToken, getProductTransactions);
router.get("/:id", authenticateToken, getProductById);
router.put("/:id", authenticateToken, updateProduct);
router.delete("/:id", authenticateToken, deactivateProduct);

router.get("/:id/skus", authenticateToken, getProductSkus);

// Variant option & value routes (must come before /:id to avoid param conflicts)
router.get("/:id/variants",                           authenticateToken, getProductVariants);
router.post("/:id/variants/options",                  authenticateToken, createVariantOption);
router.put("/:id/variants/options/:optionId",         authenticateToken, updateVariantOption);
router.delete("/:id/variants/options/:optionId",      authenticateToken, deleteVariantOption);
router.post("/:id/variants/options/:optionId/values", authenticateToken, addVariantValue);
router.put("/:id/variants/values/:valueId",           authenticateToken, updateVariantValue);
router.delete("/:id/variants/values/:valueId",        authenticateToken, deleteVariantValue);

module.exports = router;
