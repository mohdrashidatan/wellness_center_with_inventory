/**
 * One-off HARD DELETE of the leftover test products "Product D" (4) and
 * "Product E" (5) and every row that references them.
 *
 * IRREVERSIBLE. Every deleted row is first written out as INSERT statements to
 * server/migrations/backups/ so the data can be restored by hand if needed.
 *
 * The live DB declares no foreign keys on these tables, so deletion order is
 * handled explicitly here. Knock-on effects are repaired rather than left behind:
 *   - GRN / DO headers whose only lines were these products are deleted too,
 *     instead of being left as empty documents.
 *   - poshd.total_amount is recomputed for receipts that keep other lines,
 *     so header totals still match their remaining lines.
 *
 * Run with: node server/migrations/delete_test_products_4_5.js
 *
 * Pass --backup-only (or BACKUP_ONLY=1) to survey and write the backup file
 * without deleting anything.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const PRODUCT_IDS = [4, 5];
const BACKUP_ONLY = process.argv.includes("--backup-only") || process.env.BACKUP_ONLY === "1";

// table -> column holding the product reference
const LINE_TABLES = [
  { table: "poslines", col: "itemid" },
  { table: "grndetails", col: "itemid" },
  { table: "dodetails", col: "itemid" },
  { table: "stkadjlines", col: "itemid" },
  { table: "packagedetails", col: "productid" },
  { table: "customer_interests", col: "product_id" },
  { table: "product_sku", col: "productid" },
  { table: "product_uom", col: "productid" },
  { table: "variant_option", col: "productid" },
  { table: "product_master", col: "productid" },
  { table: "products", col: "productid" },
];

const toInserts = (conn, table, rows) =>
  rows.map((row) => {
    const cols = Object.keys(row);
    const vals = cols.map((c) => conn.escape(row[c])).join(", ");
    return `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${vals});`;
  });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const ids = PRODUCT_IDS.join(",");
  const backup = [
    `-- Hard delete backup for products ${ids}`,
    `-- Generated ${new Date().toISOString()}`,
    "",
  ];

  // ── Survey, and capture backups, before touching anything ──────────────────
  const affectedPos = new Set();
  const emptyGrn = [];
  const emptyDo = [];

  for (const { table, col } of LINE_TABLES) {
    const [rows] = await conn.query(`SELECT * FROM \`${table}\` WHERE \`${col}\` IN (${ids})`);
    if (rows.length === 0) continue;
    backup.push(`-- ${table} (${rows.length} row(s))`, ...toInserts(conn, table, rows), "");
    if (table === "poslines") rows.forEach((r) => affectedPos.add(r.posid));
    console.log(`  ${table}: ${rows.length} row(s) to delete`);
  }

  // GRN / DO headers that will have no lines left once these are gone.
  const [grnHeads] = await conn.query(
    `SELECT g.* FROM grnhd g
     WHERE EXISTS (SELECT 1 FROM grndetails d WHERE d.grnid = g.grnid AND d.itemid IN (${ids}))
       AND NOT EXISTS (SELECT 1 FROM grndetails d WHERE d.grnid = g.grnid AND (d.itemid NOT IN (${ids}) OR d.itemid IS NULL))`
  );
  const [doHeads] = await conn.query(
    `SELECT h.* FROM dohd h
     WHERE EXISTS (SELECT 1 FROM dodetails d WHERE d.doid = h.doid AND d.itemid IN (${ids}))
       AND NOT EXISTS (SELECT 1 FROM dodetails d WHERE d.doid = h.doid AND (d.itemid NOT IN (${ids}) OR d.itemid IS NULL))`
  );
  grnHeads.forEach((r) => emptyGrn.push(r.grnid));
  doHeads.forEach((r) => emptyDo.push(r.doid));

  if (grnHeads.length) {
    backup.push(`-- grnhd (${grnHeads.length} header(s) left empty)`, ...toInserts(conn, "grnhd", grnHeads), "");
    console.log(`  grnhd: ${emptyGrn.join(", ")} would be left empty -> deleting`);
  }
  if (doHeads.length) {
    backup.push(`-- dohd (${doHeads.length} header(s) left empty)`, ...toInserts(conn, "dohd", doHeads), "");
    console.log(`  dohd: ${emptyDo.join(", ")} would be left empty -> deleting`);
  }

  // POS headers that survive — record their pre-change totals.
  if (affectedPos.size) {
    const list = [...affectedPos].join(",");
    const [posHeads] = await conn.query(`SELECT * FROM poshd WHERE posid IN (${list})`);
    backup.push("-- poshd (totals recomputed, not deleted)", ...toInserts(conn, "poshd", posHeads), "");
  }

  const dir = path.join(__dirname, "backups");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `deleted_products_${PRODUCT_IDS.join("_")}_${stamp}.sql`);
  fs.writeFileSync(file, backup.join("\n"), "utf8");
  console.log(`\nBackup written: ${file}\n`);

  if (BACKUP_ONLY) {
    console.log("--backup-only: nothing deleted.");
    await conn.end();
    return;
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  await conn.beginTransaction();
  try {
    let deleted = 0;
    for (const { table, col } of LINE_TABLES) {
      const [res] = await conn.query(`DELETE FROM \`${table}\` WHERE \`${col}\` IN (${ids})`);
      if (res.affectedRows) {
        console.log(`✓  deleted ${res.affectedRows} from ${table}`);
        deleted += res.affectedRows;
      }
    }

    if (emptyGrn.length) {
      const [res] = await conn.query(`DELETE FROM grnhd WHERE grnid IN (${emptyGrn.join(",")})`);
      console.log(`✓  deleted ${res.affectedRows} empty GRN header(s): ${emptyGrn.join(", ")}`);
      deleted += res.affectedRows;
    }
    if (emptyDo.length) {
      const [res] = await conn.query(`DELETE FROM dohd WHERE doid IN (${emptyDo.join(",")})`);
      console.log(`✓  deleted ${res.affectedRows} empty DO header(s): ${emptyDo.join(", ")}`);
      deleted += res.affectedRows;
    }

    // Re-sync surviving receipt totals with their remaining lines.
    for (const posid of affectedPos) {
      const [[{ n }]] = await conn.query(
        "SELECT COUNT(*) AS n FROM poslines WHERE posid = ?", [posid]
      );
      if (n === 0) continue; // header emptied entirely; left alone deliberately
      const [res] = await conn.query(
        `UPDATE poshd ph
         SET ph.total_amount = (
               SELECT COALESCE(SUM(pl.total_price), 0) FROM poslines pl
               WHERE pl.posid = ph.posid AND pl.active = 1
             ),
             ph.editeddate = NOW()
         WHERE ph.posid = ?`,
        [posid]
      );
      if (res.affectedRows) console.log(`✓  recomputed total_amount for POS-${posid}`);
    }

    await conn.commit();
    console.log(`\nCommitted. ${deleted} row(s) deleted.`);
  } catch (err) {
    await conn.rollback();
    console.error(`✗  rolled back: ${err.message}`);
    process.exitCode = 1;
  }

  const [[{ left }]] = await conn.query(
    `SELECT COUNT(*) AS left FROM products WHERE productid IN (${ids})`
  );
  console.log(`products ${ids} remaining: ${left}`);

  await conn.end();
}

run().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
