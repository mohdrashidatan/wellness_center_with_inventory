const products = require("../models/productsModel");

const getDataProducts = async () => {
  try {
    const data = await products.getData();
    return data;
  } catch (error) {
    console.error("Failed to save consent:", error.message);

    throw new Error("Error while storing consent data");
  }
};

const searchSku = async (q) => {
  if (!q || q.trim().length < 1) return [];
  return await products.searchSku(q.trim());
};

const getProductList = async ({ search, page, limit }) => {
  return await products.getProductList({ search, page, limit });
};

const getProductById = async (id) => {
  return await products.getProductById(id);
};

const updateProduct = async (id, data) => {
  return await products.updateProduct(id, data);
};

const deactivateProduct = async (id) => {
  return await products.deactivateProduct(id);
};

const createProduct = async (data) => {
  const duplicate = await products.findByName(data.name.trim());
  if (duplicate) {
    const err = new Error("A product with this name already exists");
    err.code = "DUPLICATE_NAME";
    throw err;
  }
  const newId = await products.createProduct(data);
  return await products.getProductById(newId);
};

const getProductTransactions = async (productId, filters) => {
  return await products.getProductTransactions(productId, filters);
};

module.exports = { getDataProducts, searchSku, getProductList, getProductById, updateProduct, deactivateProduct, createProduct, getProductTransactions };
