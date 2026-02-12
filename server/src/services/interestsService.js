const interests = require("../models/intersetsModel");

const getIterestsData = async () => {
  const response = await interests.getData();
  return response;
};

module.exports = { getIterestsData };
