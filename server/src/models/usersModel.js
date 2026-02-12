const pool = require("../config/db");

const getAll = async () => {
  const [rows] = await pool.query(
    "SELECT useracid, username, email, role, active FROM userac ORDER BY username"
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await pool.query(
    "SELECT useracid, username, email, role, active FROM userac WHERE useracid = ?",
    [id]
  );
  return rows[0];
};

const findByEmail = async (email, excludeId = null) => {
  const query = excludeId
    ? "SELECT useracid FROM userac WHERE email = ? AND useracid != ?"
    : "SELECT useracid FROM userac WHERE email = ?";
  const params = excludeId ? [email, excludeId] : [email];
  const [rows] = await pool.query(query, params);
  return rows[0];
};

const create = async ({ username, email, password, role }) => {
  const [result] = await pool.query(
    "INSERT INTO userac (username, email, password, role, active) VALUES (?, ?, ?, ?, b'1')",
    [username, email, password, role]
  );
  return result.insertId;
};

const update = async (id, { username, email, role }) => {
  const [result] = await pool.query(
    "UPDATE userac SET username = ?, email = ?, role = ? WHERE useracid = ?",
    [username, email, role, id]
  );
  return result.affectedRows;
};

const updatePassword = async (id, hashedPassword) => {
  await pool.query("UPDATE userac SET password = ? WHERE useracid = ?", [hashedPassword, id]);
};

const deactivate = async (id) => {
  const [result] = await pool.query(
    "UPDATE userac SET active = b'0' WHERE useracid = ?",
    [id]
  );
  return result.affectedRows;
};

module.exports = { getAll, getById, findByEmail, create, update, updatePassword, deactivate };
