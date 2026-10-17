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

const getBalance = async (req, res, next) => {
  try {
    const { cutoffDate, subcat } = req.query;
    const rows = await stockReportModel.getStockBalance({ cutoffDate, subcat });
    res.json({ rows });
  } catch (err) {
    next(err);
  }
};

const getMovements = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, movType, productSearch, productId, subcat, page = 1, limit = 20 } = req.query;
    const result = await stockReportModel.getStockMovements({
      dateFrom,
      dateTo,
      movType,
      productSearch,
      subcat,
      productId: productId ? parseInt(productId, 10) : null,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getBalance, getMovements };
