const usersService = require("../services/usersService");

const getAll = async (req, res) => {
  try {
    const data = await usersService.getAll();
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const getById = async (req, res) => {
  try {
    const data = await usersService.getById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const create = async (req, res) => {
  try {
    const data = await usersService.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const update = async (req, res) => {
  try {
    const data = await usersService.update(req.params.id, req.body);
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const deactivate = async (req, res) => {
  try {
    await usersService.deactivate(req.params.id);
    res.status(200).json({ message: "User deactivated successfully" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

module.exports = { getAll, getById, create, update, deactivate };
