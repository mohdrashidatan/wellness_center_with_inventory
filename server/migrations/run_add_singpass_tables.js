/**
 * Singpass Login pilot: create the four additive tables. No existing table is altered.
 *
 * Run with (the --confirm value must equal DB_HOST/DB_NAME from server/.env):
 *   node server/migrations/run_add_singpass_tables.js --confirm=<DB_HOST>/<DB_NAME>
 *
 * Roll back with run_drop_singpass_tables.js.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mysql = require("mysql2/promise");

const target = `${process.env.DB_HOST}/${process.env.DB_NAME}`;
const confirm = (process.argv.find((a) => a.startsWith("--confirm=")) || "").slice("--confirm=".length);

if (process.env.NODE_ENV === "production") {
  console.error("✗  Refusing to run with NODE_ENV=production (pilot migration).");
  process.exit(1);
}
if (confirm !== target) {
  console.error(`✗  Pass --confirm=${target} to confirm the target database.`);
  process.exit(1);
}

const steps = [
  {
    desc: "Create user_external_identity",
    sql: `CREATE TABLE user_external_identity (
      id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      useracid      INT NOT NULL,
      provider      VARCHAR(32)  NOT NULL DEFAULT 'singpass',
      issuer        VARCHAR(255) NOT NULL,
      subject       VARCHAR(255) NOT NULL,
      is_active     TINYINT NULL DEFAULT 1 COMMENT '1 = active, NULL = revoked (NULL frees the unique keys for re-linking)',
      linked_at     DATETIME NOT NULL,
      linked_by     INT NULL,
      last_login_at DATETIME NULL,
      revoked_at    DATETIME NULL,
      revoked_by    INT NULL,
      UNIQUE KEY uq_uei_subject_active (provider, issuer, subject, is_active),
      UNIQUE KEY uq_uei_user_active (provider, useracid, is_active),
      KEY idx_uei_useracid (useracid),
      CONSTRAINT fk_uei_userac FOREIGN KEY (useracid) REFERENCES userac (useracid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
      COMMENT='Singpass (issuer, sub) linked to an existing userac row; never matched by email/name'`,
  },
  {
    desc: "Create oidc_auth_txn",
    sql: `CREATE TABLE oidc_auth_txn (
      id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      txn_hash      CHAR(64) NOT NULL,
      purpose       ENUM('login','link') NOT NULL,
      useracid      INT NULL COMMENT 'set for link transactions only',
      state         VARCHAR(255) NULL,
      nonce         VARCHAR(255) NULL,
      code_verifier VARCHAR(255) NULL,
      dpop_key_pair TEXT NULL COMMENT 'ephemeral per-login DPoP key; wiped when consumed',
      created_at    DATETIME NOT NULL,
      expires_at    DATETIME NOT NULL,
      consumed_at   DATETIME NULL,
      UNIQUE KEY uq_oat_txn_hash (txn_hash),
      KEY idx_oat_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
      COMMENT='Short-lived Singpass login/link transactions (single use)'`,
  },
  {
    desc: "Create auth_one_time_code",
    sql: `CREATE TABLE auth_one_time_code (
      id          INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code_hash   CHAR(64) NOT NULL,
      purpose     ENUM('handoff','link_ticket') NOT NULL,
      useracid    INT NOT NULL,
      identity_id INT NULL,
      created_at  DATETIME NOT NULL,
      expires_at  DATETIME NOT NULL,
      consumed_at DATETIME NULL,
      UNIQUE KEY uq_aotc_code_hash (code_hash),
      KEY idx_aotc_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
      COMMENT='Single-use, hashed, 60-second codes: login hand-off and link tickets'`,
  },
  {
    desc: "Create auth_audit_log",
    sql: `CREATE TABLE auth_audit_log (
      id         BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      event      VARCHAR(48) NOT NULL,
      outcome    VARCHAR(32) NOT NULL,
      useracid   INT NULL,
      issuer     VARCHAR(255) NULL,
      subject    VARCHAR(255) NULL,
      detail     VARCHAR(255) NULL,
      ip         VARCHAR(64) NULL,
      created_at DATETIME(3) NOT NULL,
      KEY idx_aal_created (created_at),
      KEY idx_aal_useracid (useracid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Singpass login, link and rejection events'`,
  },
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  for (const step of steps) {
    try {
      await conn.query(step.sql);
      console.log(`✓  ${step.desc}`);
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log(`⚠  ${step.desc} — table already exists, skipping`);
      } else {
        console.error(`✗  ${step.desc}: ${err.message}`);
        process.exitCode = 1;
      }
    }
  }

  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
