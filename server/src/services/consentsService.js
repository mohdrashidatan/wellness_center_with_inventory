const consent = require("../models/consentsModel");

const storeConsents = async (data, idCustomer, idUser) => {
  try {
    await consent.insertConsent(data, idCustomer, idUser);
  } catch (error) {
    console.error("Failed to save consent:", error.message);

    throw new Error("Error while storing consent data");
  }
};

const updatesConsent = async (data, idCustomer, idUser) => {
  try {
    await consent.updateConsent(data, idCustomer, idUser);
  } catch (error) {
    console.error("Failed to save consent:", error.message);
    throw new Error("Error while storing consent data");
  }
};

const getData = async () => {
  try {
    const data = await consent.getData();
    return data;
  } catch (error) {
    console.error("Failed to save consent:", error.message);

    throw new Error("Error while storing consent data");
  }
};

const getDataById = async (id) => {
  try {
    const data = await consent.getConsentById(id);
    return data;
  } catch (error) {
    console.error("Failed to save consent:", error.message);

    throw new Error("Error while storing consent data");
  }
};

const deleteDataByIds = async (id) => {
  const result = await consent.deleteDataById(id);
  return result;
};

module.exports = { storeConsents, getData, deleteDataByIds, getDataById, updatesConsent };
