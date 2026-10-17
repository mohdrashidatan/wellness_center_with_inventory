const stockAdjModel = require("../models/stockAdjModel");

const getBalance = async (req, res, next) => {
  try {
    const { cutoffDate, subcat } = req.query;
    const rows = await stockAdjModel.getBalanceForAdj({ cutoffDate, subcat });
    res.json({ rows });
  } catch (err) {
    next(err);
  }
};

const createAdj = async (req, res, next) => {
  try {
    const { stkadjasatdate, stkadjdescription, lines } = req.body;
    const enteredby = req.user.userId;
    const id = await stockAdjModel.createAdjustment({
      stkadjasatdate,
      stkadjdescription,
      enteredby,
      lines,
    });
    res.json({ success: true, stkadjhdid: id });
  } catch (err) {
    console.error("[stockAdj createAdj]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBalance, createAdj };
