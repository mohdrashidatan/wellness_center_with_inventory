const pool = require("../config/db");

const insertConsent = async (data, customer_id, user_id) => {
  console.log(data);
  const now = new Date();
  const {
    date,
    therapist,
    walkin,
    voucherNo,
    gender,
    age,
    selectedDevices,
    breastImplant,
    pacemakerImplant,
    electronicMonitorImplant,
    metalImplant,
    eyeLensImplant,
    historyOfHeartBypass,
    nonWalkinContact,
    nonWalkinName,
    nonWalkin,
    otherCondition,
    issuecoheartdisease,
    issuelungdisease,
    issuediabetes,
    issuestrokehistory,
    issuehypertension,
    issuepregnant,
    issuecancer,
    issuemenstruating,
    issuesurgery,
    issuehospitalninetydays,
    issueseizure,
  } = data;

  const query = `INSERT INTO consentfrm 
  (customerid, therapistid,  voucherno, device_used, gender, age, walkin, implantelecmon, 
  implantmetal, implanteyslens, issueheartbypass, implantbreast, implantpacemaker,nonwalkin, nonwalkincontact, 
  nonwalkinname,  consentfrmdate, entereddate, enteredby, issueothers,issuecoheartdisease, issuelungdisease, issuediabetes, issuestrokehistory, issuehypertension, issuepregnant, issuecancer, issuemenstruating, issuesurgery, issuehospitalninetydays,
  issueseizure ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  const [result] = await pool.query(query, [
    customer_id,
    therapist,
    voucherNo,
    selectedDevices,
    gender,
    age,
    walkin,
    electronicMonitorImplant,
    metalImplant,
    eyeLensImplant,
    historyOfHeartBypass,
    breastImplant,
    pacemakerImplant,
    nonWalkin,
    nonWalkinContact,
    nonWalkinName,
    date,
    now,
    user_id,
    otherCondition,
    issuecoheartdisease,
    issuelungdisease,
    issuediabetes,
    issuestrokehistory,
    issuehypertension,
    issuepregnant,
    issuecancer,
    issuemenstruating,
    issuesurgery,
    issuehospitalninetydays,
    issueseizure,
  ]);

  return result.affectedRows > 0;
};

const getConsentById = async (customer_id) => {
  const query = `
    SELECT * 
    FROM consentfrm 
    JOIN customers ON consentfrm.customerid = customers.customerid JOIN therapists ON consentfrm.therapistid=therapists.therapistsid
    WHERE consentfrm.customerid = ?`;
  const [rows] = await pool.query(query, [customer_id]);
  return rows;
};

const updateConsent = async (data, customer_id, user_id) => {
  const now = new Date();
  const {
    date,
    therapist,
    voucherNo,
    gender,
    age,
    selectedDevices,
    breastImplant,
    pacemakerImplant,
    electronicMonitorImplant,
    metalImplant,
    eyeLensImplant,
    historyOfHeartBypass,
    nonWalkinContact,
    nonWalkinName,
    otherCondition,
    issuecoheartdisease,
    issuelungdisease,
    issuediabetes,
    issuestrokehistory,
    issuehypertension,
    issuepregnant,
    issuecancer,
    issuemenstruating,
    issuesurgery,
    issuehospitalninetydays,
    issueseizure,
  } = data;

  console.log(data);

  const query = `
  UPDATE consentfrm SET
    therapistid = ?,
    voucherno = ?,
    device_used = ?,
    gender = ?,
    age = ?,
    walkin = ?,
    implantelecmon = ?,
    implantmetal = ?,
    implanteyslens = ?,
    issueheartbypass = ?,
    implantbreast = ?,
    implantpacemaker = ?,
    nonwalkinname = ?,
    nonwalkincontact = ?,
    consentfrmdate = ?,
    editeddate = ?,
    editedby = ?,
    issueothers=?,
    issuecoheartdisease=?,
    issuelungdisease=?,
    issuediabetes=?,
    issuestrokehistory=?,
    issuehypertension=?,
    issuepregnant=?,
    issuecancer=?,
    issuemenstruating=?,
    issuesurgery=?,
    issuehospitalninetydays=?,
    issueseizure=?
  WHERE customerid = ?
`;

  const [result] = await pool.query(query, [
    therapist,
    voucherNo,
    selectedDevices,
    gender,
    age,
    1, // walkin
    electronicMonitorImplant,
    metalImplant,
    eyeLensImplant,
    historyOfHeartBypass,
    breastImplant,
    pacemakerImplant,
    nonWalkinName,
    nonWalkinContact,
    date,
    now,
    user_id,
    otherCondition,
    issuecoheartdisease,
    issuelungdisease,
    issuediabetes,
    issuestrokehistory,
    issuehypertension,
    issuepregnant,
    issuecancer,
    issuemenstruating,
    issuesurgery,
    issuehospitalninetydays,
    issueseizure,
    customer_id, // untuk WHERE
  ]);

  return result.affectedRows > 0;
};

const getData = async () => {
  const query = `SELECT * FROM consentfrm JOIN customers ON consentfrm.customerid = customers.customerid`;
  const [row] = await pool.query(query);
  return row;
};

const deleteDataById = async (customer_id) => {
  const query = `DELETE FROM consentfrm WHERE customerid = ?;`;
  const [result] = await pool.query(query, [customer_id]);
  return result;
};
module.exports = { insertConsent, getConsentById, updateConsent, getData, deleteDataById };
