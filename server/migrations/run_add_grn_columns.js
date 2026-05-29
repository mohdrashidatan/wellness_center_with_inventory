/**
 * One-time migration: add delivery_order_no to grnd and batch_no/expiry_date to grndetails
 * Run with: node server/migrations/run_add_grn_columns.js
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
      desc: "Add delivery_order_no to grnd",
      sql: "ALTER TABLE grnd ADD COLUMN delivery_order_no VARCHAR(50) NULL AFTER remarks",
    },
    {
      desc: "Add batch_no to grndetails",
      sql: "ALTER TABLE grndetails ADD COLUMN batch_no VARCHAR(50) NULL AFTER remarks",
    },
    {
      desc: "Add expiry_date to grndetails",
      sql: "ALTER TABLE grndetails ADD COLUMN expiry_date DATE NULL AFTER batch_no",
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
