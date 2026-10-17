/**
 * One-time migration: add password reset token columns to userac
 * Run with: node server/migrations/run_add_password_reset_columns.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mysql = require("mysql2/promise");

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const steps = [
    {
      desc: "Add reset_password_token_hash to userac",
      sql: "ALTER TABLE userac ADD COLUMN reset_password_token_hash VARCHAR(64) NULL AFTER password",
    },
    {
      desc: "Add reset_password_expires to userac",
      sql: "ALTER TABLE userac ADD COLUMN reset_password_expires DATETIME NULL AFTER reset_password_token_hash",
    },
  ];

  for (const step of steps) {
    try {
      await conn.query(step.sql);
      console.log(`✓  ${step.desc}`);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log(`⚠  ${step.desc} — column already exists, skipping`);
      } else {
        console.error(`✗  ${step.desc}: ${err.message}`);
        process.exitCode = 1;
      }
    }
  }

  await conn.end();
  console.log("Done.");
}

run();
