const packages = require("../models/packagesModel");

const getPackagesData = async () => {
  const response = await packages.getData();
  return response;
};

const getCusPackagesData = async (id) => {
  const response = await packages.getCusPackageData(id);
  return response;
};

const storeCusPackages = async (data, idCustomer) => {
  try {
    for (const item of data) {
      if (item.packageid && item.packageCusFlag === false) {
        const exists = await packages.getCusPackageByPackageId(item.packageid, idCustomer);

        if (exists.length > 0 || !exists) {
          packages.updateCusPackagesRemainSession(exists, item);
        } else {
          packages.insertCusPackages(item, idCustomer);
        }
      }
    }
  } catch (error) {
    console.error("Failed to save consent:", error.message);

    throw new Error("Error while storing consent data");
  }
};

const minusCusPackages = async (data, idCustomer) => {
  try {
    data.forEach((item) => {
      if (item.cusPackageId) {
        packages.minDataCusPackages(item.cusPackageId, item.remainSessions - item.amount);
      }
    });
  } catch (error) {
    console.error("Failed to save consent:", error.message);

    throw new Error("Error while storing consent data");
  }
};

module.exports = { getPackagesData, storeCusPackages, getCusPackagesData, minusCusPackages };
