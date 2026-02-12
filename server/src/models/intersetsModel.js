const pool = require("../config/db");

const getData = async () => {
  const query = "select * from products";
  const [rows] = await pool.query(query);

  return rows;
};

module.exports = { getData };
