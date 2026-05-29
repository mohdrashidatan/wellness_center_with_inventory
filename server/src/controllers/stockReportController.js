const stockReportModel = require("../models/stockReportModel");

const getSummary = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const [topSold, topTransferred, topCustomers] = await Promise.all([
      stockReportModel.getTopProductsSold({ dateFrom, dateTo }),
      stockReportModel.getTopProductsTransferred({ dateFrom, dateTo }),
      stockReportModel.getTopCustomersSold({ dateFrom, dateTo }),
    ]);
    res.json({ topSold, topTransferred, topCustomers });
  } catch (err) {
    next(err);
  }
};

const getMovements = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, movType, productSearch, page = 1, limit = 20 } = req.query;
    const result = await stockReportModel.getStockMovements({
      dateFrom,
      dateTo,
      movType,
      productSearch,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getMovements };
