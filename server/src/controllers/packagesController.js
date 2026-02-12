const packagesService = require("../services/packagesService");

const getPackages = async (req, res) => {
  try {
    const data = await packagesService.getPackagesData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCusPackages = async (req, res) => {
  try {
    const id = req.params.customerId;
    const data = await packagesService.getCusPackagesData(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const postCusPackages = async (req, res) => {
  try {
    const id = req.params.customerId;

    const data = await packagesService.storeCusPackages(req.body, id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const minCusPackages = async (req, res) => {
  try {
    const data = await packagesService.minusCusPackages(req.body);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getPackages, postCusPackages, getCusPackages, minCusPackages };
