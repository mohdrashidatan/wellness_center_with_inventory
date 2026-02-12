const pool = require("../config/db");

const getAll = async () => {
  const [rows] = await pool.query("SELECT * FROM uom ORDER BY code");
  return rows;
};

const getById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM uom WHERE uom_id = ?", [id]);
  return rows[0];
};

const findByCode = async (code, excludeId = null) => {
  const query = excludeId
    ? "SELECT * FROM uom WHERE code = ? AND uom_id != ?"
    : "SELECT * FROM uom WHERE code = ?";
  const params = excludeId ? [code, excludeId] : [code];
  const [rows] = await pool.query(query, params);
  return rows[0];
};

const isUsedInGrn = async (code) => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM grndetails WHERE uom = ?",
    [code]
  );
  return rows[0].cnt > 0;
};

const create = async ({ code, name, uom_type }) => {
  const [result] = await pool.query(
    "INSERT INTO uom (code, name, uom_type) VALUES (?, ?, ?)",
    [code.toUpperCase(), name, uom_type || "quantity"]
  );
  return result.insertId;
};

const update = async (id, { code, name, uom_type, is_active }) => {
  const [result] = await pool.query(
    "UPDATE uom SET code = ?, name = ?, uom_type = ?, is_active = ? WHERE uom_id = ?",
    [code.toUpperCase(), name, uom_type, is_active, id]
  );
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await pool.query("DELETE FROM uom WHERE uom_id = ?", [id]);
  return result.affectedRows;
};

module.exports = { getAll, getById, findByCode, isUsedInGrn, create, update, remove };
