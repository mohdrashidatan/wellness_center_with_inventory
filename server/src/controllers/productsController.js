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

module.exports = { getProducts };
