const therapistService = require("../services/therapistService");

const getTherapists = async (req, res) => {
  try {
    const data = await therapistService.getTherapistData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { getTherapists };
