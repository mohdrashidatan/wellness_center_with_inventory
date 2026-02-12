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

module.exports = { getDataProducts };
