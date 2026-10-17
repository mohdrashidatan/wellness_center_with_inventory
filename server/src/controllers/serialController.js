const serialModel = require("../models/serialModel");

const listSerials = async (req, res) => {
  try {
    const { search = "", productId = "", status = "", page = 1, limit = 20 } = req.query;
    const data = await serialModel.listSerials({
      search,
      productId: productId ? parseInt(productId, 10) : null,
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error listing serials:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Feeds the stock-out picker: units currently sellable for one product.
const getAvailable = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const data = await serialModel.getAvailableByProduct(productId);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching available serials:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getHistory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = await serialModel.getSerialHistory(id);
    if (!data) return res.status(404).json({ message: "Serial not found" });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching serial history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getReconciliation = async (req, res) => {
  try {
    const rows = await serialModel.getReconciliation();
    res.status(200).json({ rows });
  } catch (error) {
    console.error("Error building serial reconciliation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSerializedProducts = async (req, res) => {
  try {
    const rows = await serialModel.getSerializedProducts();
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching serialized products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Register serials for stock already on hand, so opening balances get unit
 * records without a back-dated GRN. Without this the reconciliation report
 * flags every pre-existing unit as missing.
 */
const registerExisting = async (req, res) => {
  try {
    const { productid, serials, remarks } = req.body;
    if (!productid) return res.status(400).json({ message: "productid is required" });
    if (!serials || serials.length === 0) {
      return res.status(400).json({ message: "At least one serial is required" });
    }
    const created = await serialModel.receiveOnGrnLine({
      productid: parseInt(productid, 10),
      grnlineid: null,
      serials,
      enteredby: req.user?.userId,
      remarks: remarks || "Opening balance registration",
    });
    res.status(201).json({ created });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "One or more serials are already registered" });
    }
    console.error("Error registering serials:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  listSerials,
  getAvailable,
  getHistory,
  getReconciliation,
  getSerializedProducts,
  registerExisting,
};
