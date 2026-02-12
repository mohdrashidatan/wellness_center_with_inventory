const pool = require("../config/db");

const createUser = async (userData) => {
  const { email, password } = userData;
  console.log(userData);
  const [result] = await pool.query(
    `INSERT INTO userac (email, password, role) 
     VALUES (?, ?, 'Therapist')`,
    [email, password]
  );
  return result.insertId;
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT useracid, email, password, role 
     FROM userac WHERE email = ? `,
    [email]
  );
  return rows[0];
};

const updateUser = async (userid, updateData) => {
  const { editedby } = updateData;
  const [result] = await pool.query(
    `UPDATE users 
     SET editedby = ?, editeddate = NOW()
     WHERE userid = ?`,
    [editedby, userid]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createUser,
  findUserByEmail,
  updateUser,
};
