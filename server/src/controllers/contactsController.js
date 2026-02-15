const contactsService = require("../services/contactsService");

const search = async (req, res) => {
  try {
    const data = await contactsService.search(req.query.q || "");
    res.status(200).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

const createSupplier = async (req, res) => {
  try {
    const data = await contactsService.createSupplier(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};

module.exports = { search, createSupplier };
