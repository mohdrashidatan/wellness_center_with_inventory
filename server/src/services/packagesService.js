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

// ─── Setup Management ─────────────────────────────────────────────────────────

const getPackageList = async () => await packages.getPackageList();

const createPackage = async (data, userId) => {
  if (!data.packagedesc || !data.packagedesc.trim()) {
    const err = new Error("Package description is required");
    err.code = "VALIDATION";
    throw err;
  }
  const newId = await packages.createPackage(data, userId);
  return newId;
};

const updatePackage = async (id, data) => {
  if (!data.packagedesc || !data.packagedesc.trim()) {
    const err = new Error("Package description is required");
    err.code = "VALIDATION";
    throw err;
  }
  return await packages.updatePackage(id, data);
};

const addPackageDetail = async (packageId, data, userId) => {
  if (!data.productid) {
    const err = new Error("Product is required");
    err.code = "VALIDATION";
    throw err;
  }
  const newId = await packages.addPackageDetail(packageId, data, userId);
  return newId;
};

const updatePackageDetail = async (detailId, data, userId) =>
  await packages.updatePackageDetail(detailId, data, userId);

const deactivatePackageDetail = async (detailId) =>
  await packages.deactivatePackageDetail(detailId);

const getCustomerPackageUsage = async (filters) =>
  await packages.getCustomerPackageUsage(filters);

module.exports = {
  getPackagesData, storeCusPackages, getCusPackagesData, minusCusPackages,
  getPackageList, createPackage, updatePackage,
  addPackageDetail, updatePackageDetail, deactivatePackageDetail,
  getCustomerPackageUsage,
};
