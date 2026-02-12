const uomModel = require("../models/uomModel");

const getAll = async () => {
  return await uomModel.getAll();
};

const getById = async (id) => {
  const item = await uomModel.getById(id);
  if (!item) throw { status: 404, message: "UOM not found" };
  return item;
};

const create = async (data) => {
  const { code, name, uom_type } = data;
  if (!code || !name) throw { status: 400, message: "Code and Name are required" };

  const existing = await uomModel.findByCode(code.toUpperCase());
  if (existing) throw { status: 409, message: `UOM code '${code.toUpperCase()}' already exists` };

  const id = await uomModel.create({ code, name, uom_type });
  return await uomModel.getById(id);
};

const update = async (id, data) => {
  const { code, name, uom_type, is_active } = data;
  if (!code || !name) throw { status: 400, message: "Code and Name are required" };

  const existing = await uomModel.findByCode(code.toUpperCase(), id);
  if (existing) throw { status: 409, message: `UOM code '${code.toUpperCase()}' already exists` };

  await uomModel.update(id, { code, name, uom_type, is_active });
  return await uomModel.getById(id);
};

const remove = async (id) => {
  const item = await uomModel.getById(id);
  if (!item) throw { status: 404, message: "UOM not found" };

  const inUse = await uomModel.isUsedInGrn(item.code);
  if (inUse) throw { status: 409, message: `Cannot delete: UOM '${item.code}' is used in GRN records` };

  await uomModel.remove(id);
};

module.exports = { getAll, getById, create, update, remove };
