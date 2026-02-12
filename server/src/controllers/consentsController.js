const consentsService = require("../services/consentsService");

const createConsents = async (req, res) => {
  try {
    let customerId = req.params.id;
    let userId = req.user.userId;
    if (customerId == 0) {
      console.log(customerId);
      userId = null;
      customerId = null;
    }
    const result = await consentsService.storeConsents(req.body, customerId, userId);

    res.status(200).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

const updateConsents = async (req, res) => {
  try {
    const customerId = req.params.id;
    const result = await consentsService.updatesConsent(req.body, customerId, req.user.userId);

    res.status(200).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

const getConsents = async (req, res) => {
  try {
    const data = await consentsService.getData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching  data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getConsentsById = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await consentsService.getDataById(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching  data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteById = async (req, res) => {
  const id = req.params.id;
  console.log("hore");
  console.log(id);
  try {
    const result = await consentsService.deleteDataByIds(id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error Delete data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createConsents, getConsents, deleteById, getConsentsById, updateConsents };
