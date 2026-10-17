const doService = require("../services/doService");
const doModel   = require("../models/doModel");

const searchCustomers = async (req, res) => {
  try {
    const rows = await doModel.searchCustomers(req.query.q || "");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    const customer = await doModel.createCustomer(name.trim());
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

const updateCollectedDate = async (req, res) => {
  try {
    const { datecollected } = req.body;
    await doService.updateCollectedDate(req.params.id, datecollected || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const searchFieldValues = async (req, res) => {
  try {
    const { field, q } = req.query;
    if (!field) return res.status(400).json({ message: "field is required" });
    const values = await doService.searchFieldValues(field, q || "");
    res.json(values);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const getTopCustomers = async (req, res) => {
  try {
    const data = await doModel.getTopCustomers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const data = await doModel.getTopProducts();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { searchCustomers, createCustomer, getList, getById, create, update, updateCollectedDate, searchFieldValues, getTopCustomers, getTopProducts };
