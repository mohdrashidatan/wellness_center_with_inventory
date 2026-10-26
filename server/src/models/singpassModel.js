// Data access for Singpass login. Tables are created by
// migrations/run_add_singpass_tables.js. Timestamps are passed in from the
// service (one clock for checks and writes) rather than taken from NOW().
const pool = require("../config/db");

const PROVIDER = "singpass";

// Claim a single-use row: exactly one caller can flip consumed_at from NULL.
const claim = async (table, hashColumn, hash, now, extraWhere = "", extraParams = []) => {
  const [result] = await pool.query(
    `UPDATE ${table} SET consumed_at = ? WHERE ${hashColumn} = ? AND consumed_at IS NULL ${extraWhere}`,
    [now, hash, ...extraParams]
  );
  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE ${hashColumn} = ? ${extraWhere}`, [hash, ...extraParams]);
  const row = rows[0];
  if (!row) return { status: "not_found" };
  if (result.affectedRows !== 1) return { status: "consumed", row };
  if (new Date(row.expires_at) <= now) return { status: "expired", row };
  return { status: "ok", row };
};

// ---- login / link transactions -------------------------------------------

const createTxn = async ({ txnHash, purpose, useracid, state, nonce, codeVerifier, dpopKeyPair, now, expiresAt }) => {
  await pool.query(
    `INSERT INTO oidc_auth_txn
       (txn_hash, purpose, useracid, state, nonce, code_verifier, dpop_key_pair, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [txnHash, purpose, useracid ?? null, state, nonce, codeVerifier, JSON.stringify(dpopKeyPair), now, expiresAt]
  );
};

const consumeTxn = async (txnHash, now) => {
  const result = await claim("oidc_auth_txn", "txn_hash", txnHash, now);
  if (result.status === "ok" || result.status === "expired") {
    // The PKCE verifier, nonce and DPoP key are only needed once; drop them.
    await pool.query(
      `UPDATE oidc_auth_txn SET state = NULL, nonce = NULL, code_verifier = NULL, dpop_key_pair = NULL WHERE id = ?`,
      [result.row.id]
    );
  }
  if (result.row && result.status === "ok") {
    const r = result.row;
    result.txn = {
      id: r.id,
      purpose: r.purpose,
      useracid: r.useracid,
      state: r.state,
      nonce: r.nonce,
      codeVerifier: r.code_verifier,
      dpopKeyPair: JSON.parse(r.dpop_key_pair),
    };
  } else if (result.row) {
    result.txn = { id: result.row.id, purpose: result.row.purpose, useracid: result.row.useracid };
  }
  delete result.row;
  return result;
};

// ---- one-time codes (login hand-off, link ticket) --------------------------

const createOneTimeCode = async ({ codeHash, purpose, useracid, identityId, now, expiresAt }) => {
  await pool.query(
    `INSERT INTO auth_one_time_code (code_hash, purpose, useracid, identity_id, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [codeHash, purpose, useracid, identityId ?? null, now, expiresAt]
  );
};

const consumeOneTimeCode = async (codeHash, purpose, now) => {
  const result = await claim("auth_one_time_code", "code_hash", codeHash, now, "AND purpose = ?", [purpose]);
  if (result.row) {
    result.code = { id: result.row.id, useracid: result.row.useracid, identityId: result.row.identity_id };
    delete result.row;
  }
  return result;
};

const purgeExpired = async (before) => {
  await pool.query(`DELETE FROM oidc_auth_txn WHERE expires_at < ?`, [before]);
  await pool.query(`DELETE FROM auth_one_time_code WHERE expires_at < ?`, [before]);
};

// ---- identity links --------------------------------------------------------

const mapIdentity = (r) =>
  r && {
    id: r.id,
    useracid: r.useracid,
    issuer: r.issuer,
    subject: r.subject,
    active: r.is_active === 1,
    linkedAt: r.linked_at,
    lastLoginAt: r.last_login_at,
  };

const findActiveIdentityBySubject = async (issuer, subject) => {
  const [rows] = await pool.query(
    `SELECT * FROM user_external_identity
     WHERE provider = ? AND issuer = ? AND subject = ? AND is_active = 1`,
    [PROVIDER, issuer, subject]
  );
  return mapIdentity(rows[0]);
};

const findActiveIdentityForUser = async (useracid) => {
  const [rows] = await pool.query(
    `SELECT * FROM user_external_identity WHERE provider = ? AND useracid = ? AND is_active = 1`,
    [PROVIDER, useracid]
  );
  return mapIdentity(rows[0]);
};

const findIdentityById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM user_external_identity WHERE id = ? AND provider = ?`, [id, PROVIDER]);
  return mapIdentity(rows[0]);
};

/** @returns {Promise<{status: 'ok', id: number} | {status: 'conflict'}>} */
const insertIdentity = async ({ useracid, issuer, subject, linkedBy, now }) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO user_external_identity (useracid, provider, issuer, subject, is_active, linked_at, linked_by)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [useracid, PROVIDER, issuer, subject, now, linkedBy]
    );
    return { status: "ok", id: result.insertId };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return { status: "conflict" };
    throw err;
  }
};

const touchIdentityLogin = async (id, now) => {
  await pool.query(`UPDATE user_external_identity SET last_login_at = ? WHERE id = ?`, [now, id]);
};

// is_active becomes NULL (not 0) so the unique keys allow a later re-link.
const revokeIdentity = async (id, revokedBy, now) => {
  const [result] = await pool.query(
    `UPDATE user_external_identity SET is_active = NULL, revoked_at = ?, revoked_by = ?
     WHERE id = ? AND provider = ? AND is_active = 1`,
    [now, revokedBy, id, PROVIDER]
  );
  return result.affectedRows === 1;
};

const listActiveIdentities = async () => {
  const [rows] = await pool.query(
    `SELECT i.id, i.useracid, i.issuer, i.subject, i.linked_at, i.last_login_at, i.is_active,
            u.username, u.email, u.role
     FROM user_external_identity i
     JOIN userac u ON u.useracid = i.useracid
     WHERE i.provider = ? AND i.is_active = 1
     ORDER BY i.linked_at DESC`,
    [PROVIDER]
  );
  return rows.map((r) => ({ ...mapIdentity(r), username: r.username, email: r.email, role: r.role }));
};

// ---- audit -----------------------------------------------------------------

const audit = async ({ event, outcome, useracid, issuer, subject, detail, ip, now }) => {
  await pool.query(
    `INSERT INTO auth_audit_log (event, outcome, useracid, issuer, subject, detail, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [event, outcome, useracid ?? null, issuer ?? null, subject ?? null, detail ?? null, ip ?? null, now]
  );
};

module.exports = {
  createTxn,
  consumeTxn,
  createOneTimeCode,
  consumeOneTimeCode,
  purgeExpired,
  findActiveIdentityBySubject,
  findActiveIdentityForUser,
  findIdentityById,
  insertIdentity,
  touchIdentityLogin,
  revokeIdentity,
  listActiveIdentities,
  audit,
};
