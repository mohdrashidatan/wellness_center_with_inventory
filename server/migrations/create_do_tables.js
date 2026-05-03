/**
 * One-time migration: create dohd and dodetails tables
 * Run with: node server/migrations/create_do_tables.js
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
      desc: "Create dohd table",
      sql: `
        CREATE TABLE IF NOT EXISTS dohd (
          doid             INT AUTO_INCREMENT PRIMARY KEY,
          contactid        INT NULL,
          transferdate     DATE NOT NULL,
          delivery_order_no VARCHAR(50) NULL,
          remarks          TEXT NULL,
          enteredby        INT NULL,
          entereddate      DATETIME NULL,
          active           TINYINT NOT NULL DEFAULT 1
        )
      `,
    },
    {
      desc: "Create dodetails table",
      sql: `
        CREATE TABLE IF NOT EXISTS dodetails (
          dolineid      INT AUTO_INCREMENT PRIMARY KEY,
          doid          INT NOT NULL,
          itemid        INT NULL,
          qty           DECIMAL(10,2) NOT NULL DEFAULT 0,
          uom           VARCHAR(20) NULL,
          batch_no      VARCHAR(50) NULL,
          expiry_date   DATE NULL,
          remarks       TEXT NULL,
          enteredby     INT NULL,
          entereddate   DATETIME NULL,
          active        TINYINT NOT NULL DEFAULT 1
        )
      `,
    },
  ];

  for (const step of steps) {
    try {
      await conn.query(step.sql);
      console.log(`✓  ${step.desc}`);
    } catch (err) {
      console.error(`✗  ${step.desc}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  await conn.end();
  console.log("Done.");
}

run();
