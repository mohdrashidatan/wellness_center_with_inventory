/**
 * One-time migration: extend `products` for flat-SKU inventory maintenance.
 *
 * Adds item code / brand / sub-category / barcode / reorder level and normalises
 * `productcat` back to its intended Product|Service meaning (brand values such as
 * 'Prife' had been stored there, which hid those rows from the POS item filter).
 *
 * Creates no new tables.
 *
 * Run with: node server/migrations/run_add_product_catalog_columns.js
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
      desc: "Add itemcode to products",
      sql: "ALTER TABLE products ADD COLUMN itemcode VARCHAR(30) NULL AFTER productid",
    },
    {
      desc: "Add brand to products",
      sql: "ALTER TABLE products ADD COLUMN brand VARCHAR(50) NULL AFTER productcat",
    },
    {
      desc: "Add subcat to products",
      sql: "ALTER TABLE products ADD COLUMN subcat VARCHAR(50) NULL AFTER brand",
    },
    {
      desc: "Add barcode to products",
      sql: "ALTER TABLE products ADD COLUMN barcode VARCHAR(50) NULL AFTER subcat",
    },
    {
      desc: "Add reorder_level to products",
      sql: "ALTER TABLE products ADD COLUMN reorder_level INT NULL DEFAULT 0 AFTER packageprice",
    },
    {
      // NULLs are exempt from UNIQUE in MySQL, so pre-existing rows need no backfill.
      desc: "Unique index on products.itemcode",
      sql: "ALTER TABLE products ADD UNIQUE KEY uq_products_itemcode (itemcode)",
    },
    {
      desc: "Index on products.subcat",
      sql: "ALTER TABLE products ADD KEY idx_products_subcat (subcat)",
    },
    {
      desc: "Index on products.barcode",
      sql: "ALTER TABLE products ADD KEY idx_products_barcode (barcode)",
    },
    {
      // 'Prife' is a brand, not a category. Rows carrying it were excluded by the
      // POS filter (Inventory.jsx matches productcat === 'Product' | 'Service').
      desc: "Move brand values out of productcat into brand",
      sql: `UPDATE products
            SET brand = productcat, productcat = 'Product'
            WHERE productcat IS NOT NULL
              AND productcat NOT IN ('Product', 'Service')`,
    },
  ];

  for (const step of steps) {
    try {
      const [res] = await conn.query(step.sql);
      const n = res && res.affectedRows !== undefined ? ` (${res.affectedRows} row(s))` : "";
      console.log(`\u2713  ${step.desc}${n}`);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME") {
        console.log(`\u26a0  ${step.desc} — already present, skipping`);
      } else {
        console.error(`\u2717  ${step.desc}: ${err.message}`);
        process.exitCode = 1;
      }
    }
  }

  await conn.end();
  console.log("Done.");
}

run();
