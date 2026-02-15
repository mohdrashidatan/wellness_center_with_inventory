const pool = require("../config/db");

const search = async (q) => {
  const [rows] = await pool.query(
    `SELECT contactid, display_name, code, phone, email, contact_person, contact_type
     FROM contacts
     WHERE active = 1
       AND (display_name LIKE ? OR code LIKE ?)
     ORDER BY display_name
     LIMIT 20`,
    [`%${q}%`, `%${q}%`]
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await pool.query(
    `SELECT contactid, display_name, code, phone, email, contact_person, contact_type,
            billing_address1, billing_address2, billing_city, billing_postal_code, billing_country
     FROM contacts WHERE contactid = ?`,
    [id]
  );
  return rows[0];
};

const create = async ({ display_name, phone, email, contact_person }) => {
  const [result] = await pool.query(
    `INSERT INTO contacts (display_name, phone, email, contact_person, contact_type, is_company, active)
     VALUES (?, ?, ?, ?, 'Supplier', 1, 1)`,
    [display_name, phone || null, email || null, contact_person || null]
  );
  return result.insertId;
};

module.exports = { search, getById, create };
