const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { addEvaluation, getEvaluation, editEvaluation, deleteEvaluation } = require("../controllers/evaluationController");

const router = express.Router();

router.post("/:id", authenticateToken, addEvaluation); //id = id_customer
router.get("/:id", authenticateToken, getEvaluation); //id= id_customer
router.put("/:id", authenticateToken, editEvaluation); // id= evaluation_id
router.delete("/:id", authenticateToken, deleteEvaluation); // id= evaluation_id

module.exports = router;
