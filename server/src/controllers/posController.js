const posService = require("../services/posService");
const { getSalesHeaders, getSalesDetails } = require("../models/posModel");

const insertPosHd = async (req, res) => {
  try {
    console.log("pos hd data", req.body);
    const result = await posService.posInsertHd(req.body, req.user.userId);
    console.log("serres", result);

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

const insertPosLine = async (req, res) => {
  try {
    const result = await posService.posInsertLine(req.body.idResult, req.body.selectedData, req.user.userId);

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

const getCusPosHd = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await posService.getCustomerPosHd(id);

    res.status(200).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    console.error("Error Get Data:", error);

    res.status(500).json({
      success: false,
      message: "Evaluation Error",
      error: error.message,
    });
  }
};

const getCusPosLine = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await posService.getCustomerPosLine(id);

    res.status(200).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    console.error("Error Get Data:", error);

    res.status(500).json({
      success: false,
      message: "Evaluation Error",
      error: error.message,
    });
  }
};

const getSalesHeadersCtrl = async (req, res) => {
  try {
    const { search = "", dateFrom = "", dateTo = "", page = 1, limit = 20 } = req.query;
    const data = await getSalesHeaders({ search, dateFrom, dateTo, page: Number(page), limit: Number(limit) });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch sales headers" });
  }
};

const getSalesDetailsCtrl = async (req, res) => {
  try {
    const { search = "", dateFrom = "", dateTo = "", posid = "", page = 1, limit = 20 } = req.query;
    const data = await getSalesDetails({ search, dateFrom, dateTo, posid, page: Number(page), limit: Number(limit) });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch sales details" });
  }
};

module.exports = { insertPosHd, insertPosLine, getCusPosHd, getCusPosLine, getSalesHeadersCtrl, getSalesDetailsCtrl };
