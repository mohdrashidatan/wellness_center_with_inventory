const contactsModel = require("../models/contactsModel");

const search = async (q) => {
  if (!q || q.trim().length < 1) return [];
  return await contactsModel.search(q.trim());
};

const getById = async (id) => {
  const c = await contactsModel.getById(id);
  if (!c) throw { status: 404, message: "Contact not found" };
  return c;
};

const createSupplier = async (data) => {
  if (!data.display_name || !data.display_name.trim()) {
    throw { status: 400, message: "Supplier name is required" };
  }
  const id = await contactsModel.create(data);
  return await contactsModel.getById(id);
};

module.exports = { search, getById, createSupplier };
