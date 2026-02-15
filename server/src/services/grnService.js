const grnModel = require("../models/grnModel");

const getList = async (query) => {
  const page  = Math.max(parseInt(query.page)  || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 10, 100);

  return await grnModel.getList({
    supplierName: query.supplierName || "",
    itemSearch:   query.itemSearch   || "",
    dateFrom:     query.dateFrom     || "",
    dateTo:       query.dateTo       || "",
    dateExact:    query.dateExact    || "",
    page,
    limit,
  });
};

const getById = async (id) => {
  const data = await grnModel.getById(id);
  if (!data) throw { status: 404, message: "GRN not found" };
  return data;
};

const create = async ({ header, lines }, userId) => {
  if (!header.receiptdate) throw { status: 400, message: "Received date is required" };
  if (!lines || lines.length === 0) throw { status: 400, message: "At least one item line is required" };
  for (const ln of lines) {
    if (!ln.itemid) throw { status: 400, message: "Item code is required on all lines" };
    if (!ln.qty || ln.qty <= 0) throw { status: 400, message: "Quantity must be greater than 0 on all lines" };
  }
  const grnid = await grnModel.create({ ...header, enteredby: userId }, lines);
  return await grnModel.getById(grnid);
};

module.exports = { getList, getById, create };
