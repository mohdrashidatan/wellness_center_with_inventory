const interestsService = require("../services/interestsService");

const getIterests = async (req, res) => {
  try {
    const data = await interestsService.getIterestsData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getIterests };
