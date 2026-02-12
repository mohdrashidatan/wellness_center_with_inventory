const therapist = require("../models/therapistModal");

const getTherapistData = async () => {
  const response = await therapist.getData();
  return response;
};

module.exports = { getTherapistData };
