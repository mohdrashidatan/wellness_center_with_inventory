const pos = require("../models/posModel");

const posInsertHd = async (data, userId) => {
  try {
    const result = await pos.addPosHd(data, userId);
    return result;
  } catch (error) {
    console.error("Failed to save consent:", error.message);
    throw new Error("Error while storing consent data");
  }
};

const posInsertLine = async (idPosHd, data, userId) => {
  try {
    let result;
    data.forEach((item) => {
      if (item.packageid) {
        result = pos.addPosLine(idPosHd, item, userId, item.packageid, 1);
      } else {
        result = pos.addPosLine(idPosHd, item, userId, item.id, 0);
      }
    });

    return result;
  } catch (error) {
    console.error("Failed to save consent:", error.message);
    throw new Error("Error while storing consent data");
  }
};

const getCustomerPosHd = async (id) => {
  try {
    const result = await pos.getPosHdCusData(id);
    return result;
  } catch (error) {
    console.error("Failed to save consent:", error.message);
    throw new Error("Error while storing consent data");
  }
};

const getCustomerPosLine = async (id) => {
  try {
    const result = await pos.getPosLineCusData(id);
    return result;
  } catch (error) {
    console.error("Failed to save consent:", error.message);
    throw new Error("Error while storing consent data");
  }
};

module.exports = { posInsertHd, posInsertLine, getCustomerPosHd, getCustomerPosLine };
