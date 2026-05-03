const doModel = require("../models/doModel");

const getList = async (query) => {
  const page  = Math.max(parseInt(query.page)  || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 10, 100);

  return await doModel.getList({
    recipientName: query.recipientName || "",
    itemSearch:    query.itemSearch    || "",
    dateFrom:      query.dateFrom      || "",
    dateTo:        query.dateTo        || "",
    dateExact:     query.dateExact     || "",
    page,
    limit,
  });
};

const getById = async (id) => {
  const data = await doModel.getById(id);
  if (!data) throw { status: 404, message: "Delivery Order not found" };
  return data;
};

const create = async ({ header, lines }, userId) => {
  if (!header.txn_type)          throw { status: 400, message: "Transaction type is required" };
  if (!header.transferdate)      throw { status: 400, message: "Transfer date is required" };
  if (!header.delivery_order_no) throw { status: 400, message: "DO Reference No. is required" };
  if (!lines || lines.length === 0) throw { status: 400, message: "At least one item line is required" };
  for (const ln of lines) {
    if (!ln.itemid)         throw { status: 400, message: "Item is required on all lines" };
    if (!ln.qty || ln.qty <= 0) throw { status: 400, message: "Quantity must be greater than 0 on all lines" };
  }
  const doid = await doModel.create({ ...header, enteredby: userId }, lines);
  return await doModel.getById(doid);
};

const update = async (id, { header, lines }) => {
  if (!header.txn_type)          throw { status: 400, message: "Transaction type is required" };
  if (!header.transferdate)      throw { status: 400, message: "Transfer date is required" };
  if (!header.delivery_order_no) throw { status: 400, message: "DO Reference No. is required" };
  if (!lines || lines.length === 0) throw { status: 400, message: "At least one item line is required" };
  for (const ln of lines) {
    if (!ln.itemid)              throw { status: 400, message: "Item is required on all lines" };
    if (!ln.qty || ln.qty <= 0)  throw { status: 400, message: "Quantity must be greater than 0 on all lines" };
  }
  await doModel.update(id, header, lines);
  return await doModel.getById(id);
};

module.exports = { getList, getById, create, update };
