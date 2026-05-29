const doService = require("../services/doService");

const update = async (req, res) => {
  try {
    const data = await doService.update(req.params.id, req.body);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const getList = async (req, res) => {
  try {
    const data = await doService.getList(req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const getById = async (req, res) => {
  try {
    const data = await doService.getById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const create = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const data = await doService.create(req.body, userId);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

module.exports = { getList, getById, create, update };
