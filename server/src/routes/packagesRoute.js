const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { createConsents, getConsents, deleteById, getConsentsById, updateConsents } = require("../controllers/consentsController");
const {
  getPackages, postCusPackages, getCusPackages, minCusPackages,
  getPackageList, createPackage, updatePackage,
  addPackageDetail, updatePackageDetail, deactivatePackageDetail,
  getCustomerPackageUsage,
} = require("../controllers/packagesController");

const router = express.Router();

// Existing POS routes
router.get("/", authenticateToken, getPackages);
router.put("/mincuspackage", authenticateToken, minCusPackages);
router.get("/:customerId", authenticateToken, getCusPackages);
router.post("/:customerId", authenticateToken, postCusPackages);

// ─── Setup Management routes ──────────────────────────────────────────────────
router.get("/setup/list",                          authenticateToken, getPackageList);
router.post("/setup",                              authenticateToken, createPackage);
router.put("/setup/:id",                           authenticateToken, updatePackage);
router.post("/setup/:id/details",                  authenticateToken, addPackageDetail);
router.put("/setup/details/:detailId",             authenticateToken, updatePackageDetail);
router.delete("/setup/details/:detailId",          authenticateToken, deactivatePackageDetail);
router.get("/setup/customer-usage",                authenticateToken, getCustomerPackageUsage);

module.exports = router;
