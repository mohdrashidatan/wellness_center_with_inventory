/**
 * Serial number tracking: one row per physical unit, plus a movement log.
 *
 * Serials are MANDATORY-CAPABLE on stock out (POS sale / DO transfer) and
 * OPTIONAL on stock in (GRN). A unit may therefore be born either way:
 *   - at GRN, when the supplier serial is printed on the box  -> status 'In Stock'
 *   - at stock out, when the serial is applied on sale        -> status 'Sold' etc.
 *
 * `product_serial.serial_no` is nullable so a sale can be completed with the
 * serial still outstanding ('Pending Serial') rather than blocking the counter;
 * MySQL allows many NULLs under a UNIQUE index.
 *
 * No foreign keys: the live schema declares none on these tables, and FKs here
 * would block the product clean-ups that are done by hand. Indexes instead.
 *
 * Run with: node server/migrations/run_add_serial_tables.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mysql = require("mysql2/promise");

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const steps = [
    {
      desc: "Create product_serial",
      sql: `CREATE TABLE IF NOT EXISTS product_serial (
              serial_id   INT NOT NULL AUTO_INCREMENT,
              productid   INT NOT NULL,
              serial_no   VARCHAR(64) NULL,
              status      ENUM('In Stock','Sold','Transferred','Consigned',
                               'Loaned Out','Returned','Pending Serial','Void')
                          NOT NULL DEFAULT 'In Stock',
              grnlineid   INT NULL,
              remarks     VARCHAR(255) NULL,
              enteredby   INT NULL,
              entereddate DATETIME NULL,
              editedby    INT NULL,
              editeddate  DATETIME NULL,
              active      TINYINT(1) NOT NULL DEFAULT 1,
              PRIMARY KEY (serial_id),
              UNIQUE KEY uq_product_serial_no (serial_no),
              KEY idx_ps_product (productid),
              KEY idx_ps_status (status),
              KEY idx_ps_grnline (grnlineid)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
      desc: "Create product_serial_mov",
      sql: `CREATE TABLE IF NOT EXISTS product_serial_mov (
              mov_id        INT NOT NULL AUTO_INCREMENT,
              serial_id     INT NOT NULL,
              mov_type      ENUM('GRN In','POS Sale','DO Out','Return In',
                                 'Adjustment','Void') NOT NULL,
              mov_date      DATETIME NOT NULL,
              grnlineid     INT NULL,
              poslinesid    INT NULL,
              dolineid      INT NULL,
              stkadjlinesid INT NULL,
              remarks       VARCHAR(255) NULL,
              enteredby     INT NULL,
              entereddate   DATETIME NULL,
              PRIMARY KEY (mov_id),
              KEY idx_psm_serial (serial_id),
              KEY idx_psm_type (mov_type),
              KEY idx_psm_date (mov_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
      // Drives WHEN the serial is expected, not whether it is stored:
      //   'Receipt' -> supplier serial, enter at GRN (optional), pick at sale
      //   'Sale'    -> no serial until sold, enter at stock out
      desc: "Add product_master.serial_capture_at",
      sql: `ALTER TABLE product_master
            ADD COLUMN serial_capture_at ENUM('Receipt','Sale') NULL AFTER is_serialized`,
    },
  ];

  for (const step of steps) {
    try {
      await conn.query(step.sql);
      console.log(`✓  ${step.desc}`);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log(`⚠  ${step.desc} — already present, skipping`);
      } else {
        console.error(`✗  ${step.desc}: ${err.message}`);
        process.exitCode = 1;
      }
    }
  }

  await conn.end();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
