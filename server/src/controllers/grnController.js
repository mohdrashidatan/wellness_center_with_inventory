const grnService = require("../services/grnService");

const getList = async (req, res) => {
  try {
    const data = await grnService.getList(req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const getById = async (req, res) => {
  try {
    const data = await grnService.getById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const create = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const data = await grnService.create(req.body, userId);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

module.exports = { getList, getById, create };
