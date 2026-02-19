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

// ─── Setup Management ─────────────────────────────────────────────────────────

const getPackageList = async (req, res) => {
  try {
    res.json(await packagesService.getPackageList());
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const createPackage = async (req, res) => {
  try {
    const newId = await packagesService.createPackage(req.body, req.user.userId);
    res.status(201).json({ packageid: newId });
  } catch (err) {
    if (err.code === "VALIDATION") return res.status(400).json({ message: err.message });
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePackage = async (req, res) => {
  try {
    await packagesService.updatePackage(parseInt(req.params.id), req.body);
    res.json({ message: "Package updated" });
  } catch (err) {
    if (err.code === "VALIDATION") return res.status(400).json({ message: err.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

const addPackageDetail = async (req, res) => {
  try {
    const newId = await packagesService.addPackageDetail(parseInt(req.params.id), req.body, req.user.userId);
    res.status(201).json({ packagedetailsid: newId });
  } catch (err) {
    if (err.code === "VALIDATION") return res.status(400).json({ message: err.message });
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePackageDetail = async (req, res) => {
  try {
    await packagesService.updatePackageDetail(parseInt(req.params.detailId), req.body, req.user.userId);
    res.json({ message: "Detail updated" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deactivatePackageDetail = async (req, res) => {
  try {
    await packagesService.deactivatePackageDetail(parseInt(req.params.detailId));
    res.json({ message: "Detail removed" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCustomerPackageUsage = async (req, res) => {
  try {
    const { packageId = null, search = "" } = req.query;
    const data = await packagesService.getCustomerPackageUsage({
      packageId: packageId ? parseInt(packageId) : null,
      search,
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getPackages, postCusPackages, getCusPackages, minCusPackages,
  getPackageList, createPackage, updatePackage,
  addPackageDetail, updatePackageDetail, deactivatePackageDetail,
  getCustomerPackageUsage,
};
