const pool = require("../config/db");

const getData = async () => {
  const query = "select * from therapists";
  const [rows] = await pool.query(query);
  return rows;
};

const getDataByEmail = async (email) => {
  const query = `SELECT * FROM therapists JOIN userac ON therapists.account_id = userac.useracid WHERE userac.email = ?`;
  const [rows] = await pool.query(query, [email]);
  return rows[0];
};

module.exports = { getData, getDataByEmail };
