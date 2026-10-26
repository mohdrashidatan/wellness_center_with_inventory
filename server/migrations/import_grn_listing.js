/**
 * Import Prife stock-in (goods received) from the "Stockin Only" Excel sheet
 * into grnhd / grndetails.
 *
 * Sheet layout: one row per receipt. Column A is "<dd/mm/yyyy> - <reference>"
 * (e.g. "09/07/2026 - SP2026-0008"); the other columns are product quantities,
 * headed by product name. Rows without a leading date (headers, the
 * "Total Consignment IN" row) are ignored.
 *
 * Rules:
 *   - every receipt is from the single supplier SUPPLIER_NAME (a contacts row)
 *   - negative quantities are dropped (e.g. SP2026-0001's Alfalfa -8); the
 *     row's positive quantities are still imported. Each drop is reported.
 *   - lines are flagged consign = 1 (the sheet is consignment stock in)
 *   - no serials: the sheet carries none, and serials are optional on a GRN
 *
 * Dry run (the default; reads the file and the DB, writes nothing to the DB):
 *   node server/migrations/import_grn_listing.js --file="C:/path/stockin.xlsx"
 *
 * Apply (the --confirm value must equal DB_HOST/DB_NAME from server/.env):
 *   node server/migrations/import_grn_listing.js --file="C:/path/stockin.xlsx" --apply --confirm=<DB_HOST>/<DB_NAME>
 *
 * Options:
 *   --sheet=<name>   worksheet to read (default: the first one)
 *
 * Additive only: nothing is deleted. The run refuses to apply if a reference it
 * would insert already exists on a Prife GRN, so it cannot double-count stock.
 * A report is written to server/migrations/backups/ (git-ignored).
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const ExcelJS = require("exceljs");
const mysql = require("mysql2/promise");

const SUPPLIER_NAME = "Prife";
const CONSIGN = 1;

// Product column header -> products.itemcode, for headers the automatic match
// cannot resolve. Example: { "Aurora Optics Sungl": "AOS-CNF" }
const COLUMN_OVERRIDES = {};

// ---------------------------------------------------------------------------
// Cell helpers (same rules as import_do_listing.js)

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const canon = (s) =>
  norm(s)
    .replace(/sunglasses/g, "sungl")
    .replace(/([^p])urple/g, "$1purple");

const raw = (v) => {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if ("result" in v) return raw(v.result);
    if (v.richText) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return raw(v.text);
    if ("error" in v) return null;
  }
  return v;
};

const str = (v) => {
  const r = raw(v);
  return r == null ? "" : String(r).replace(/\s+/g, " ").trim();
};

const num = (v) => {
  const r = raw(v);
  if (r == null || r === "") return null;
  if (typeof r === "number") return r;
  const n = Number(String(r).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

const isoDate = (d) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

/** "09/07/2026 - SP2026-0008 Wendy" -> { iso, reference: "SP2026-0008", note: "Wendy", label } */
const parseLabel = (v) => {
  const r = raw(v);
  if (r instanceof Date) return { iso: isoDate(r), reference: "", note: "", label: isoDate(r) };
  const label = str(v);
  const m = label.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*-?\s*(.*)$/);
  if (!m) return null;
  let [, d, mo, y, rest] = m;
  y = +y < 100 ? +y + 2000 : +y;
  const dt = new Date(Date.UTC(y, +mo - 1, +d));
  if (dt.getUTCMonth() !== +mo - 1 || dt.getUTCDate() !== +d) return { iso: null, reference: rest, note: "", label };
  const sp = rest.match(/^(SP\d{4}-\d{3,})\s*(.*)$/i);
  return {
    iso: isoDate(dt),
    reference: (sp ? sp[1].toUpperCase() : rest).slice(0, 50),
    note: sp ? sp[2] : "",
    label,
  };
};

// ---------------------------------------------------------------------------

const parseArgs = () =>
  Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const m = a.match(/^--([^=]+)(?:=(.*))?$/);
      return m ? [m[1], m[2] ?? true] : [a, true];
    })
  );

async function run() {
  const args = parseArgs();
  const apply = args.apply === true;
  const target = `${process.env.DB_HOST}/${process.env.DB_NAME}`;

  if (process.env.NODE_ENV === "production") {
    console.error("✗  Refusing to run with NODE_ENV=production.");
    process.exit(1);
  }
  if (!args.file || args.file === true) {
    console.error('✗  Pass --file="<path to .xlsx>".');
    process.exit(1);
  }
  if (apply && args.confirm !== target) {
    console.error(`✗  Pass --confirm=${target} with --apply to confirm the target database.`);
    process.exit(1);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(args.file));
  const ws = args.sheet ? wb.getWorksheet(args.sheet) : wb.worksheets[0];
  if (!ws) {
    console.error(`✗  Sheet "${args.sheet}" not found. Sheets: ${wb.worksheets.map((w) => w.name).join(", ")}`);
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  const errors = [];
  const warnings = [];
  const skipped = [];

  try {
    const [[supplier]] = await conn.query(
      `SELECT contactid FROM contacts WHERE display_name = ? AND contact_type IN ('Supplier','Both') AND active = 1 ORDER BY contactid LIMIT 1`,
      [SUPPLIER_NAME]
    );
    if (!supplier) errors.push(`No active supplier contact named "${SUPPLIER_NAME}"`);

    const [catalog] = await conn.query(
      `SELECT productid, itemcode, name FROM products WHERE active = 1 AND itemcode IS NOT NULL`
    );
    const byKey = new Map(catalog.map((p) => [canon(p.name), p]));
    const byCode = new Map(catalog.map((p) => [p.itemcode, p]));
    const overrides = Object.fromEntries(Object.entries(COLUMN_OVERRIDES).map(([k, v]) => [norm(k), v]));

    // Header row: the first row in which most cells name a product.
    let headerRow = null;
    let productCols = [];
    for (let r = 1; r <= Math.min(ws.rowCount, 20) && !headerRow; r++) {
      const cols = [];
      const unmatched = [];
      ws.getRow(r).eachCell((cell, col) => {
        if (col === 1) return;
        const text = str(cell.value);
        if (!text || /^-?[\d.,]+$/.test(text)) return;
        let product = overrides[norm(text)] ? byCode.get(overrides[norm(text)]) : byKey.get(canon(text));
        if (!product) {
          const hits = catalog.filter((p) => canon(p.name).startsWith(canon(text)));
          if (hits.length === 1) product = hits[0];
        }
        if (product) cols.push({ col, header: text, product });
        else unmatched.push(text);
      });
      if (cols.length >= 10) {
        headerRow = r;
        productCols = cols;
        for (const u of unmatched) errors.push(`Column "${u}" matches no product; add it to COLUMN_OVERRIDES`);
      }
    }
    if (!headerRow) throw new Error(`No header row of product names in the first 20 rows of sheet "${ws.name}"`);
    const seen = new Map();
    for (const pc of productCols) {
      if (seen.has(pc.product.itemcode)) errors.push(`Columns "${seen.get(pc.product.itemcode)}" and "${pc.header}" both map to ${pc.product.itemcode}`);
      seen.set(pc.product.itemcode, pc.header);
    }

    // ---- rows -> receipts -------------------------------------------------
    const grns = [];
    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const first = str(row.getCell(1).value);
      if (!first) continue;
      const lbl = parseLabel(row.getCell(1).value);
      if (!lbl) {
        warnings.push(`Row ${r}: "${first}" has no leading date; ignored`);
        continue;
      }
      if (!lbl.iso) {
        errors.push(`Row ${r}: "${first}" has an invalid date`);
        continue;
      }

      const lines = [];
      const negatives = [];
      for (const pc of productCols) {
        const q = num(row.getCell(pc.col).value);
        if (q == null || q === 0) continue;
        if (Number.isNaN(q) || !Number.isInteger(q)) {
          errors.push(`Row ${r} (${lbl.label}): "${pc.header}" quantity "${str(row.getCell(pc.col).value)}" is not a whole number`);
          continue;
        }
        if (q < 0) negatives.push(`${pc.product.itemcode} ${q}`);
        else lines.push({ product: pc.product, qty: q });
      }

      if (negatives.length > 0) skipped.push(`Row ${r} "${lbl.label}": negative ${negatives.join(", ")} dropped`);
      if (lines.length === 0) {
        skipped.push(`Row ${r} "${lbl.label}": no positive quantities; row skipped`);
        continue;
      }
      if (!lbl.reference) warnings.push(`Row ${r}: "${first}" has no reference after the date`);
      grns.push({ row: r, ...lbl, lines });
    }

    const refCount = new Map();
    for (const g of grns) refCount.set(g.reference.toUpperCase(), (refCount.get(g.reference.toUpperCase()) || 0) + 1);
    for (const [ref, n] of refCount) if (ref && n > 1) errors.push(`Reference "${ref}" appears on ${n} rows`);

    if (supplier && grns.length > 0) {
      const [existing] = await conn.query(
        `SELECT DISTINCT delivery_order_no FROM grnhd WHERE contactid = ? AND active = 1 AND delivery_order_no IN (?)`,
        [supplier.contactid, grns.map((g) => g.reference)]
      );
      for (const e of existing) errors.push(`GRN reference "${e.delivery_order_no}" already exists for ${SUPPLIER_NAME}; not importing it twice`);
    }

    // ---- report -----------------------------------------------------------
    const lineCount = grns.reduce((n, g) => n + g.lines.length, 0);
    const unitCount = grns.reduce((n, g) => n + g.lines.reduce((m, l) => m + l.qty, 0), 0);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outDir = path.join(__dirname, "backups", `import_grn_listing_${stamp}`);
    fs.mkdirSync(outDir, { recursive: true });
    const report = [
      `File: ${path.resolve(args.file)}  Sheet: ${ws.name}  Header row: ${headerRow}`,
      `Target: ${target}  Mode: ${apply ? "APPLY" : "dry run"}  Supplier: ${SUPPLIER_NAME}${supplier ? ` (contactid ${supplier.contactid})` : ""}`,
      `Product columns matched: ${productCols.length}`,
      "",
      `Would insert: ${grns.length} GRNs, ${lineCount} lines (${unitCount} units)`,
      ...grns.map((g) => `  ${g.iso}  ${g.reference.padEnd(24)} ${g.lines.length} lines, ${g.lines.reduce((m, l) => m + l.qty, 0)} units${g.note ? `  [${g.note}]` : ""}`),
      "",
      `Skipped (${skipped.length}):`,
      ...skipped.map((s) => `  ${s}`),
      "",
      `Errors (${errors.length}):`,
      ...errors.map((e) => `  ${e}`),
      "",
      `Warnings (${warnings.length}):`,
      ...warnings.map((w) => `  ${w}`),
    ].join("\n");
    fs.writeFileSync(path.join(outDir, "report.txt"), report + "\n");
    console.log(report);
    console.log(`\nReport: ${outDir}`);

    if (errors.length > 0) {
      console.error(`\n✗  ${errors.length} error(s). Nothing was written to the database.`);
      process.exitCode = 1;
      return;
    }
    if (!apply) {
      console.log(`\nDry run only. To write, add: --apply --confirm=${target}`);
      return;
    }

    // ---- apply ------------------------------------------------------------
    await conn.beginTransaction();
    try {
      for (const g of grns) {
        const remarks = [`Imported from stock-in sheet: ${g.label}`, g.note && `Note: ${g.note}`].filter(Boolean).join("\n");
        const [hd] = await conn.query(
          `INSERT INTO grnhd (contactid, receiptdate, delivery_order_no, remarks, enteredby, entereddate, active)
           VALUES (?, ?, ?, ?, NULL, NOW(), 1)`,
          [supplier.contactid, g.iso, g.reference || null, remarks]
        );
        for (const l of g.lines) {
          await conn.query(
            `INSERT INTO grndetails (grnid, itemid, qty, consign, enteredby, entereddate, active) VALUES (?, ?, ?, ?, NULL, NOW(), 1)`,
            [hd.insertId, l.product.productid, l.qty, CONSIGN]
          );
        }
      }
      await conn.commit();
      console.log(`✓  Inserted ${grns.length} GRNs, ${lineCount} lines (${unitCount} units)`);
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error(`✗  ${err.message}`);
  process.exit(1);
});
