const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { searchCustomers, createCustomer, getList, getById, create, update, updateCollectedDate, searchFieldValues, getTopCustomers, getTopProducts } = require("../controllers/doController");

const router = express.Router();

router.get("/search-customers",      authenticateToken, searchCustomers);
router.get("/field-values",          authenticateToken, searchFieldValues);
router.get("/stats/top-customers",   authenticateToken, getTopCustomers);
router.get("/stats/top-products",    authenticateToken, getTopProducts);
router.post("/customers",            authenticateToken, createCustomer);
router.get("/",                      authenticateToken, getList);
router.post("/",                authenticateToken, create);
router.get("/:id",              authenticateToken, getById);
router.put("/:id",              authenticateToken, update);
router.patch("/:id/collected",  authenticateToken, updateCollectedDate);

module.exports = router;
