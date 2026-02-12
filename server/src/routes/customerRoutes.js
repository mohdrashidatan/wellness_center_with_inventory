const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { registration, getCustomerData, getCustomerDataByid, getJoinInterest, update } = require("../controllers/customerController");

const router = express.Router();

// Registration route
router.post("/:id", authenticateToken, registration);
router.get("/", authenticateToken, getCustomerData);
router.get("/:id", authenticateToken, getCustomerDataByid);
router.get("/joininterest/:id", authenticateToken, getJoinInterest);
router.put("/:id", authenticateToken, update);

module.exports = router;
