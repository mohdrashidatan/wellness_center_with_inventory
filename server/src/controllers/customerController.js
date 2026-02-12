const customerService = require("../services/customerService");

const registration = async (req, res) => {
  const idCustomer = req.params.id;

  // make the id 0 if the customer are not login and do a regisration throught therapist
  let idUser = req.user.userId;
  const idUser2 = req.user.userId;
  if (idCustomer == 0) {
    console.log(idCustomer);
    idUser = null;
  }
  //---------------------------------------------------------------------------------
  try {
    const result = await customerService.createRegistration(req.body, idUser, idCustomer, idUser2);

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

const update = async (req, res) => {
  const idCustomer = req.params.id;

  // make the id 0 if the customer are not login and do a regisration throught therapist
  let idUser = req.user.userId;
  const idUser2 = req.user.userId;
  if (idCustomer == 0) {
    console.log(idCustomer);
    idUser = null;
  }
  try {
    const result = await customerService.updateRegistration(req.body, idUser, idCustomer, idUser2);

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

const getCustomerData = async (req, res) => {
  try {
    const data = await customerService.getData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching  data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCustomerDataByid = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await customerService.getDataByid(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching  data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getJoinInterest = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await customerService.getDataJoinInterest(id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching  data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { registration, getCustomerData, getCustomerDataByid, getJoinInterest, update };
