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

const searchProducts = async (q) => {
  if (!q || q.trim().length < 1) return [];
  return await products.searchProducts(q.trim());
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

const getProductSkus = async (productId) => {
  return await products.getProductSkus(productId);
};

// ─── Variants ─────────────────────────────────────────────────────────────────

const getProductVariants = async (productId) => {
  return await products.getVariantsByProduct(productId);
};

const createVariantOption = async (productId, data) => {
  if (!data.option_name || !data.option_name.trim()) {
    const err = new Error("Option name is required");
    err.code = "VALIDATION";
    throw err;
  }
  const newId = await products.createVariantOption(productId, data);
  return { option_id: newId };
};

const updateVariantOption = async (optionId, data) => {
  if (!data.option_name || !data.option_name.trim()) {
    const err = new Error("Option name is required");
    err.code = "VALIDATION";
    throw err;
  }
  return await products.updateVariantOption(optionId, data);
};

const deactivateVariantOption = async (optionId) => {
  return await products.deactivateVariantOption(optionId);
};

const addVariantValue = async (optionId, data) => {
  if (!data.value_name || !data.value_name.trim()) {
    const err = new Error("Value name is required");
    err.code = "VALIDATION";
    throw err;
  }
  const newId = await products.addVariantValue(optionId, data);
  return { value_id: newId };
};

const updateVariantValue = async (valueId, data) => {
  if (!data.value_name || !data.value_name.trim()) {
    const err = new Error("Value name is required");
    err.code = "VALIDATION";
    throw err;
  }
  return await products.updateVariantValue(valueId, data);
};

const deactivateVariantValue = async (valueId) => {
  return await products.deactivateVariantValue(valueId);
};

module.exports = {
  getDataProducts, searchSku, searchProducts, getProductList, getProductById, updateProduct,
  deactivateProduct, createProduct, getProductTransactions,
  getProductSkus,
  getProductVariants, createVariantOption, updateVariantOption, deactivateVariantOption,
  addVariantValue, updateVariantValue, deactivateVariantValue,
};
