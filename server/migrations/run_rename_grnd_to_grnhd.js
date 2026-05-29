/**
 * One-time migration: rename table grnd → grnhd
 * Run with: node server/migrations/run_rename_grnd_to_grnhd.js
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

  try {
    await conn.query("RENAME TABLE grnd TO grnhd");
    console.log("✓  Renamed grnd → grnhd");
  } catch (err) {
    if (err.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("⚠  grnhd already exists — skipping rename");
    } else {
      console.error("✗  " + err.message);
      process.exitCode = 1;
    }
  }

  await conn.end();
  console.log("Done.");
}

run();
