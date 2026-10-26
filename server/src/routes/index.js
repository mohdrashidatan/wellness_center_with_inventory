const express = require("express");
const authRoute = require("./authRoutes");
const profileRoute = require("./profileRoutes");
const customerRoute = require("./customerRoutes");
const interestsRoute = require("./interestsRoutes");
const consentRoute = require("./consentRoute");
const therapistRoute = require("./therapistRoute");
const evaluationRoute = require("./evaluationRoute");
const productsRoute = require("./productsRoute");
const posRoute = require("./posRoute");
const packagesRoute = require("./packagesRoute");
const receiptRoute = require("./receiptRoute");
const uomRoute = require("./uomRoute");
const usersRoute = require("./usersRoute");
const grnRoute = require("./grnRoute");
const doRoute = require("./doRoute");
const contactsRoute = require("./contactsRoute");
const possetupRoute = require("./possetupRoute");
const stockReportRoute = require("./stockReportRoute");
const stockAdjRoute = require("./stockAdjRoute");
const serialRoute = require("./serialRoute");
const { loadSingpassConfig } = require("../config/singpass");

// Throws on invalid Singpass settings, so a misconfigured server fails to start.
const singpassConfig = loadSingpassConfig();

const Router = express.Router();

// Auth Route
if (singpassConfig.enabled) {
  const { createDefaultSingpassRouter } = require("./singpassRoutes");
  Router.use("/auth/singpass", createDefaultSingpassRouter(singpassConfig));
  console.log(`[singpass] Login with Singpass enabled (${singpassConfig.environment}: ${singpassConfig.issuerUrl})`);
}
Router.use("/auth", authRoute);
Router.use("/profile", profileRoute);
Router.use("/customer", customerRoute);
Router.use("/interests", interestsRoute);
Router.use("/consent", consentRoute);
Router.use("/therapist", therapistRoute);
Router.use("/evaluation", evaluationRoute);
Router.use("/products", productsRoute);
Router.use("/pos", posRoute);
Router.use("/package", packagesRoute);
Router.use("/receipt", receiptRoute);
Router.use("/uom", uomRoute);
Router.use("/users", usersRoute);
Router.use("/grn", grnRoute);
Router.use("/do", doRoute);
Router.use("/contacts", contactsRoute);
Router.use("/possetup", possetupRoute);
Router.use("/stock-report", stockReportRoute);
Router.use("/stock-adj",    stockAdjRoute);
Router.use("/serial",       serialRoute);

module.exports = Router;
