const pool = require("../config/db");
const getData = async () => {
  const query = `SELECT * FROM products`;
  const [row] = await pool.query(query);
  return row;
};

module.exports = { getData };
