const customer = require("../models/customerModel");

const createRegistration = async (data, idAccount, idCustomer, idUser2) => {
  try {
    await customer.deleteCustomerInterests(idCustomer);
    // const isCustomerExist = await customer.getCustomerByAccountId(idAccount);
    // if (isCustomerExist) {
    //   console.log(idCustomer);
    // await customer.updateCustomer(data.data1, idCustomer);
    // } else {
    const result = await customer.insertCustomer(data.data1, idAccount, idUser2);
    // }
    if (data.data2 && data.data2.length > 0) {
      for (const idInterests of data.data2) {
        const intId = parseInt(idInterests); // cause idInterest came as char
        await customer.customerInterests(idCustomer, intId);
      }
    }
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed to register customer");
  }
};

const updateRegistration = async (data, idAccount, idCustomer, idUser2) => {
  try {
    await customer.deleteCustomerInterests(idCustomer);

    await customer.updateCustomer(data.data1, idCustomer, idUser2);
    if (data.data2 && data.data2.length > 0) {
      for (const idInterests of data.data2) {
        const intId = parseInt(idInterests); // cause idInterest came as char
        await customer.customerInterests(idCustomer, intId);
      }
    }
    return true;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed to register customer");
  }
};

const getData = async () => {
  const response = await customer.getData();
  return response;
};

const getDataByid = async (id) => {
  const response = await customer.getDataById(id);
  return response;
};

const getDataJoinInterest = async (id) => {
  const response = await customer.getDataJoinInterest(id);

  return response;
};

module.exports = { createRegistration, getData, getDataByid, getDataJoinInterest, updateRegistration };
