const productsService = require("../services/productsService");

const getProducts = async (req, res) => {
  try {
    const data = await productsService.getDataProducts();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching  data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const searchSku = async (req, res) => {
  try {
    const q = req.query.q || "";
    const data = await productsService.searchSku(q);
    res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProductList = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await productsService.getProductList({ search, page, limit });
    res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = await productsService.getProductById(id);
    if (!data) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await productsService.updateProduct(id, req.body);
    const updated = await productsService.getProductById(id);
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deactivateProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await productsService.deactivateProduct(id);
    res.status(200).json({ message: "Product deactivated" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await productsService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    if (error.code === "DUPLICATE_NAME") {
      return res.status(409).json({ message: error.message });
    }
    console.error("Error creating product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProductTransactions = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { search = "", type = "", dateFrom = "", dateTo = "" } = req.query;
    const data = await productsService.getProductTransactions(id, { search, type, dateFrom, dateTo });
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching product transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Variants ─────────────────────────────────────────────────────────────────

const getProductVariants = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = await productsService.getProductVariants(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching variants:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createVariantOption = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await productsService.createVariantOption(id, req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.code === "DUPLICATE_ENTRY") return res.status(409).json({ message: error.message });
    if (error.code === "VALIDATION")     return res.status(400).json({ message: error.message });
    console.error("Error creating variant option:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateVariantOption = async (req, res) => {
  try {
    const optionId = parseInt(req.params.optionId);
    await productsService.updateVariantOption(optionId, req.body);
    res.status(200).json({ message: "Option updated" });
  } catch (error) {
    if (error.code === "VALIDATION") return res.status(400).json({ message: error.message });
    console.error("Error updating variant option:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteVariantOption = async (req, res) => {
  try {
    const optionId = parseInt(req.params.optionId);
    await productsService.deactivateVariantOption(optionId);
    res.status(200).json({ message: "Option removed" });
  } catch (error) {
    if (error.code === "IN_USE") return res.status(409).json({ message: error.message });
    console.error("Error removing variant option:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addVariantValue = async (req, res) => {
  try {
    const optionId = parseInt(req.params.optionId);
    const result = await productsService.addVariantValue(optionId, req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.code === "DUPLICATE_ENTRY") return res.status(409).json({ message: error.message });
    if (error.code === "VALIDATION")     return res.status(400).json({ message: error.message });
    console.error("Error adding variant value:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateVariantValue = async (req, res) => {
  try {
    const valueId = parseInt(req.params.valueId);
    await productsService.updateVariantValue(valueId, req.body);
    res.status(200).json({ message: "Value updated" });
  } catch (error) {
    if (error.code === "VALIDATION") return res.status(400).json({ message: error.message });
    console.error("Error updating variant value:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteVariantValue = async (req, res) => {
  try {
    const valueId = parseInt(req.params.valueId);
    await productsService.deactivateVariantValue(valueId);
    res.status(200).json({ message: "Value removed" });
  } catch (error) {
    if (error.code === "IN_USE") return res.status(409).json({ message: error.message });
    console.error("Error removing variant value:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getProducts, searchSku, getProductList, getProductById, updateProduct,
  deactivateProduct, createProduct, getProductTransactions,
  getProductVariants, createVariantOption, updateVariantOption, deleteVariantOption,
  addVariantValue, updateVariantValue, deleteVariantValue,
};
