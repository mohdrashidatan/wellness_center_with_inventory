const uomService = require("../services/uomService");

const getAll = async (req, res) => {
  try {
    const data = await uomService.getAll();
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const getById = async (req, res) => {
  try {
    const data = await uomService.getById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const create = async (req, res) => {
  try {
    const data = await uomService.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const update = async (req, res) => {
  try {
    const data = await uomService.update(req.params.id, req.body);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const remove = async (req, res) => {
  try {
    await uomService.remove(req.params.id);
    res.status(200).json({ message: "UOM deleted successfully" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

module.exports = { getAll, getById, create, update, remove };
