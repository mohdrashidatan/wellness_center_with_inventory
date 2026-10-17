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

const setResetToken = async (useracid, tokenHash, expiresAt) => {
  await pool.query(
    `UPDATE userac
     SET reset_password_token_hash = ?, reset_password_expires = ?
     WHERE useracid = ?`,
    [tokenHash, expiresAt, useracid]
  );
};

const findUserByResetTokenHash = async (tokenHash) => {
  const [rows] = await pool.query(
    `SELECT useracid, email, reset_password_expires
     FROM userac
     WHERE reset_password_token_hash = ? AND reset_password_expires > NOW()`,
    [tokenHash]
  );
  return rows[0];
};

const resetPasswordAndClearToken = async (useracid, hashedPassword) => {
  const [result] = await pool.query(
    `UPDATE userac
     SET password = ?, reset_password_token_hash = NULL, reset_password_expires = NULL
     WHERE useracid = ?`,
    [hashedPassword, useracid]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createUser,
  findUserByEmail,
  updateUser,
  setResetToken,
  findUserByResetTokenHash,
  resetPasswordAndClearToken,
};
