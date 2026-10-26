/**
 * Import the Prife delivery-order / consignment-sales listing (Excel) into
 * customers, dohd, dodetails and the serial register, after wiping all
 * transaction data.
 *
 * Dry run (the default; reads the file and the DB, writes nothing to the DB):
 *   node server/migrations/import_do_listing.js --file="C:/path/listing.xlsx"
 *
 * Apply (the --confirm value must equal DB_HOST/DB_NAME from server/.env):
 *   node server/migrations/import_do_listing.js --file="C:/path/listing.xlsx" --apply --confirm=<DB_HOST>/<DB_NAME>
 *
 * Options:
 *   --sheet=<name>   worksheet to read (default: the first one)
 *
 * What --apply does, in one transaction:
 *   1. Backs up every table in WIPE_TABLES to server/migrations/backups/ (JSON).
 *   2. Deletes all rows from WIPE_TABLES: DO, POS, GRN, stock adjustments,
 *      serials, customer packages, and customers with their consent forms,
 *      evaluations, session notes, feedback and interests.
 *      Products, user logins, therapists and packages are not touched.
 *   3. Inserts one customer per Prife ID (customers.username = Prife ID).
 *   4. Inserts one dohd per spreadsheet row (transtype "Consign Sales"), with a
 *      dodetails line per non-zero product quantity column.
 *   5. Issues serials parsed from the "[SN: ...]" text in the Product column
 *      through serialModel.issueOnStockOut, the same path DO entry uses.
 *
 * Lines come from the per-product quantity columns, not from the free-text
 * Product description. The description is kept in dohd.remarks.
 *
 * The run refuses to apply while the file has errors. Every run writes a report
 * (warnings, errors, the serial list) to server/migrations/backups/, which is
 * git-ignored because it contains customer data.
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const ExcelJS = require("exceljs");
const mysql = require("mysql2/promise");

const TXN_TYPE = "Consign Sales";

// Children before parents. Keep in step with any new transaction table.
const WIPE_TABLES = [
  "product_serial_mov",
  "product_serial",
  "dodetails",
  "dohd",
  "poslines",
  "poshd",
  "grndetails",
  "grnhd",
  "stkadjlines",
  "stkadjhd",
  "custpackages",
  "session_notes",
  "evalannotate",
  "evaluation_pain_areas",
  "evaluations",
  "consent_health_conditions",
  "consentfrm",
  "feedbacks",
  "customer_interests",
  "customers",
];

// Header text (any case/spacing) -> field. The first matching column wins, so a
// repeated "Product" column further right is ignored.
const FIELDS = {
  date: ["prifedodate", "dodate", "date"],
  so_no: ["pgsso", "pgssono", "sono"],
  do_no: ["prifedo", "prifedono", "dono"],
  prife_id: ["prifeid"],
  customer: ["customer", "customername"],
  description: ["product", "products", "description"],
  collected_on: ["collectedon"],
  collection_method: ["collectionmethod"],
  wallet: ["walletused", "wallet"],
  comment: ["comment", "comments"],
  sales_usd: ["prifesalesusd", "salesusd"],
  fee_pct: ["feeasofpp"], // derived (Fee / Sales); recognised so it is not read as a product, not stored
  pv: ["totaldopv", "totalpv", "pv"],
  fee: ["feeus", "feeusd", "fee"],
};

// Product quantity column header -> products.itemcode, for headers the
// automatic match cannot resolve (e.g. a truncated "Vitality Bracelet").
// Example: { "Aurora Optics Sungl": "AOS-CNF" }
const COLUMN_OVERRIDES = {};

const LIMITS = { username: 15, name: 150, reference: 50, ordermethod: 100, walletused: 100 };

// ---------------------------------------------------------------------------
// Cell helpers

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Header/catalog key: tolerant of the sheet's abbreviations and typos.
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
  if (r == null) return "";
  if (r instanceof Date) return isoDate(r);
  return String(r).replace(/\s+/g, " ").trim();
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

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

const ymd = (y, m, d) => {
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? isoDate(dt) : null;
};

/** Leading date of a cell -> { iso, rest }. Accepts dates, Excel serials, "6-Feb-2026", "7-Sept-2026", "10/6/26" (d/m/y). */
const parseDate = (v) => {
  const r = raw(v);
  if (r == null || r === "") return { iso: null, rest: "" };
  if (r instanceof Date) return { iso: isoDate(r), rest: "" };
  if (typeof r === "number") {
    if (r > 20000 && r < 80000) return { iso: isoDate(new Date(Date.UTC(1899, 11, 30) + Math.round(r) * 86400000)), rest: "" };
    return { iso: null, rest: String(r) };
  }
  const s = String(r).replace(/\s+/g, " ").trim();
  let m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{2,4})\b/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) {
    return { iso: ymd(+m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]), rest: s.slice(m[0].length).trim() };
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return { iso: ymd(+m[3], +m[2], +m[1]), rest: s.slice(m[0].length).trim() };
  return { iso: null, rest: s };
};

// ---------------------------------------------------------------------------
// Serials

/** Which serialised product a description fragment like "ITERABIO LITEx2 " names. */
const deviceFor = (label) => {
  const l = norm(label);
  if (/biot?lite/.test(l)) return "ITB-LTE";
  if (/bio/.test(l)) return "ITB-STD";
  if (/prem|ppl/.test(l)) return "ITC-PPL";
  if (/class/.test(l)) return "ITC-CLS";
  if (/pro/.test(l)) return "ITC-PRO";
  return null;
};

/** "YP25/03  y3/053" -> "YP/25/03 Y3/053". Whitespace and the YP prefix only; digits are never changed. */
const canonSerial = (s) =>
  s
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^YP\/?(\d{2})\/(\d{2})\s*/, "YP/$1/$2 ");

/**
 * Expand one bracket's contents: "SN: 202645, 642" -> [202645, 202642];
 * "YP/25/03 Y3/181-190" -> ten serials. A short all-digit token replaces the
 * tail of the previous serial.
 */
const expandSerials = (content, notes) => {
  const out = [];
  let prev = null;
  for (let t of content.replace(/^\s*S\/?N\s*:?/i, "").split(/[,;]/)) {
    t = t.replace(/^\s*S\/?N\s*:?/i, "").trim();
    if (!t) continue;
    if (!/\d/.test(t)) {
      notes.push(`no serial in "${t}"`);
      continue;
    }
    const range = t.match(/^(.*?)(\d+)\s*-\s*(\d+)$/);
    if (range && range[3].length <= range[2].length && +range[3] > +range[2] && +range[3] - +range[2] <= 50) {
      const [, prefix, a, b] = range;
      const width = a.length;
      const head = a.slice(0, a.length - b.length);
      const end = +(head + b);
      for (let n = +a; n <= end; n++) out.push(canonSerial(prefix + String(n).padStart(width, "0")));
      prev = out[out.length - 1];
      continue;
    }
    if (prev && /^\d+$/.test(t) && t.length < prev.length) t = prev.slice(0, prev.length - t.length) + t;
    // "YP/25/03 Y3/054, Y3/052": the short form repeats only the last word.
    else if (prev && !t.includes(" ") && prev.includes(" ") && t.length === prev.length - prev.lastIndexOf(" ") - 1) {
      t = prev.slice(0, prev.lastIndexOf(" ") + 1) + t;
    }
    t = canonSerial(t);
    out.push(t);
    prev = t;
  }
  return out;
};

/** All "[...]" groups in a Product description -> [{ code, serials, label, notes }]. */
const parseSerialGroups = (desc) => {
  const groups = [];
  const re = /\[([^\]]*)\]?/g;
  let last = 0;
  let m;
  while ((m = re.exec(desc))) {
    const label = desc.slice(last, m.index).split(/[,\n]/).filter((p) => p.trim()).pop() || "";
    last = m.index + m[0].length;
    const notes = [];
    const serials = expandSerials(m[1], notes);
    groups.push({ code: deviceFor(label), serials, label: label.trim(), notes });
  }
  const outside = desc.replace(/\[[^\]]*\]?/g, "");
  if (/\bS\/?N\b|\dSN\b/i.test(outside)) groups.push({ code: null, serials: [], label: outside.trim(), notes: ["serial text outside [ ]"] });
  return groups;
};

// ---------------------------------------------------------------------------
// Reading the workbook

const findHeaderRow = (ws) => {
  for (let r = 1; r <= Math.min(ws.rowCount, 20); r++) {
    const keys = [];
    ws.getRow(r).eachCell((c) => keys.push(norm(str(c.value))));
    if (keys.includes("prifeid") && keys.some((k) => FIELDS.do_no.includes(k))) return r;
  }
  return null;
};

const mapColumns = (ws, headerRow, catalog, problems) => {
  const fieldCol = {};
  const productCols = [];
  const unmapped = [];
  const byKey = new Map(catalog.map((p) => [canon(p.name), p]));
  const byCode = new Map(catalog.map((p) => [p.itemcode, p]));
  const overrides = Object.fromEntries(Object.entries(COLUMN_OVERRIDES).map(([k, v]) => [norm(k), v]));

  ws.getRow(headerRow).eachCell((cell, col) => {
    const text = str(cell.value);
    const key = norm(text);
    if (!key) return;
    const field = Object.keys(FIELDS).find((f) => FIELDS[f].includes(key));
    if (field) {
      if (!fieldCol[field]) fieldCol[field] = col;
      return;
    }
    let product = overrides[key] ? byCode.get(overrides[key]) : byKey.get(canon(text));
    if (!product && !overrides[key]) {
      const hits = catalog.filter((p) => canon(p.name).startsWith(canon(text)));
      if (hits.length === 1) product = hits[0];
      else if (hits.length > 1) problems.push(`Column "${text}" matches ${hits.map((h) => h.itemcode).join(", ")}; add it to COLUMN_OVERRIDES`);
    }
    if (overrides[key] && !product) problems.push(`COLUMN_OVERRIDES maps "${text}" to unknown itemcode ${overrides[key]}`);
    if (product) productCols.push({ col, header: text, product });
    else unmapped.push({ col, header: text });
  });

  for (const f of ["date", "do_no", "prife_id", "customer"]) {
    if (!fieldCol[f]) problems.push(`No "${FIELDS[f][0]}" column found in header row ${headerRow}`);
  }
  const seen = new Map();
  for (const pc of productCols) {
    if (seen.has(pc.product.itemcode)) problems.push(`Columns "${seen.get(pc.product.itemcode)}" and "${pc.header}" both map to ${pc.product.itemcode}`);
    seen.set(pc.product.itemcode, pc.header);
  }
  return { fieldCol, productCols, unmapped };
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
  const serialLog = [];

  try {
    const [catalog] = await conn.query(
      `SELECT p.productid, p.itemcode, p.name, COALESCE(pm.is_serialized, 0) AS is_serialized
         FROM products p LEFT JOIN product_master pm ON pm.productid = p.productid
        WHERE p.active = 1 AND p.itemcode IS NOT NULL`
    );

    const headerRow = findHeaderRow(ws);
    if (!headerRow) throw new Error(`No header row with "Prife ID" and "Prife DO" in the first 20 rows of sheet "${ws.name}"`);
    const { fieldCol, productCols, unmapped } = mapColumns(ws, headerRow, catalog, errors);

    // ---- rows -> DOs ------------------------------------------------------
    const dos = [];
    const customers = new Map(); // upper(Prife ID) -> { username, name, row }
    const doNos = new Map();
    const serialSeen = new Map();
    const unmappedWithQty = new Map();

    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const get = (f) => (fieldCol[f] ? row.getCell(fieldCol[f]).value : null);
      const at = `Row ${r}`;

      const doNo = str(get("do_no"));
      const prifeId = str(get("prife_id")).split(" ")[0];
      const desc = raw(get("description")) == null ? "" : String(raw(get("description"))).trim();
      if (!doNo && !prifeId && !desc) continue;

      const rowErr = (m) => errors.push(`${at} (${doNo || "no DO"}): ${m}`);
      const rowWarn = (m) => warnings.push(`${at} (${doNo || "no DO"}): ${m}`);

      const date = parseDate(get("date"));
      if (!doNo) rowErr("Prife DO number is empty");
      else if (doNos.has(doNo.toUpperCase())) rowErr(`DO number repeats row ${doNos.get(doNo.toUpperCase())}`);
      else doNos.set(doNo.toUpperCase(), r);
      if (doNo.length > LIMITS.reference) rowErr(`DO number longer than ${LIMITS.reference} characters`);
      if (!date.iso) rowErr(`DO date "${str(get("date"))}" is not a date`);
      if (!prifeId) rowErr("Prife ID is empty");
      if (prifeId.length > LIMITS.username) rowErr(`Prife ID "${prifeId}" is longer than ${LIMITS.username} characters`);

      const name = str(get("customer"));
      if (prifeId) {
        const key = prifeId.toUpperCase();
        const c = customers.get(key);
        if (!c) customers.set(key, { username: prifeId, name, row: r });
        else if (!c.name && name) c.name = name;
        else if (name && norm(c.name) !== norm(name)) rowWarn(`Prife ID ${prifeId} is "${c.name}" on row ${c.row} but "${name}" here; keeping "${c.name}"`);
      }
      if (name.length > LIMITS.name) rowErr(`Customer name longer than ${LIMITS.name} characters`);

      // Lines from the quantity columns.
      const lines = [];
      for (const pc of productCols) {
        const q = num(row.getCell(pc.col).value);
        if (q == null || q === 0) continue;
        if (!Number.isInteger(q) || q < 0) {
          rowErr(`"${pc.header}" quantity "${str(row.getCell(pc.col).value)}" is not a whole number`);
          continue;
        }
        lines.push({ product: pc.product, qty: q, serials: [] });
      }
      for (const u of unmapped) {
        const q = num(row.getCell(u.col).value);
        if (q != null && q !== 0 && !Number.isNaN(q)) unmappedWithQty.set(u.header, (unmappedWithQty.get(u.header) || 0) + 1);
      }
      if (lines.length === 0) rowErr("no product quantity on this row");

      // Serials from the description.
      for (const g of parseSerialGroups(desc)) {
        for (const n of g.notes) rowWarn(`${n} ("${g.label}")`);
        if (g.serials.length === 0) continue;
        const line = g.code && lines.find((l) => l.product.itemcode === g.code);
        const skip = (why) => {
          rowWarn(`serials ${g.serials.join(", ")} not imported: ${why}`);
          for (const s of g.serials) serialLog.push([doNo, g.code || "?", s, `skipped: ${why}`]);
        };
        if (!g.code) skip(`can't tell which device "${g.label}" is`);
        else if (!line) skip(`${g.code} has no quantity on this row`);
        else line.serials.push(...g.serials);
      }
      for (const l of lines) {
        if (l.serials.length === 0) continue;
        if (l.serials.length > l.qty) {
          rowWarn(`${l.product.itemcode}: ${l.serials.length} serials for qty ${l.qty}; none imported`);
          for (const s of l.serials) serialLog.push([doNo, l.product.itemcode, s, "skipped: more serials than qty"]);
          l.serials = [];
          continue;
        }
        l.serials = l.serials.filter((s) => {
          const prior = serialSeen.get(s);
          if (prior) {
            rowWarn(`serial ${s} already on ${prior}; skipped here`);
            serialLog.push([doNo, l.product.itemcode, s, `skipped: duplicate of ${prior}`]);
            return false;
          }
          serialSeen.set(s, doNo);
          serialLog.push([doNo, l.product.itemcode, s, "imported"]);
          return true;
        });
      }
      for (const l of lines) {
        if (l.product.is_serialized && l.serials.length < l.qty) {
          rowWarn(`${l.product.itemcode}: ${l.qty - l.serials.length} of ${l.qty} unit(s) without a serial`);
        }
      }

      // Header fields.
      const collected = parseDate(get("collected_on"));
      const collectedText = str(get("collected_on"));
      const method = str(get("collection_method"));
      const wallet = str(get("wallet"));
      const sales = str(get("sales_usd"));
      const pv = str(get("pv"));
      const fee = str(get("fee"));
      const comment = str(get("comment"));
      if (method.length > LIMITS.ordermethod) rowErr(`Collection method longer than ${LIMITS.ordermethod} characters`);
      if (wallet.length > LIMITS.walletused) rowErr(`Wallet Used longer than ${LIMITS.walletused} characters`);
      const remarks = [
        str(get("so_no")) && `PGS SO: ${str(get("so_no"))}`,
        desc && `Items: ${desc}`,
        collectedText && (!collected.iso || collected.rest) && `Collected: ${collectedText}`,
        sales && `Prife Sales US$: ${sales}`,
        pv && `PV: ${pv}`,
        fee && `Fee US$: ${fee}`,
        comment && `Comment: ${comment}`,
      ].filter(Boolean);

      dos.push({
        row: r,
        doNo,
        prifeKey: prifeId.toUpperCase(),
        transdate: date.iso,
        datecollected: collected.iso,
        ordermethod: method || null,
        walletused: wallet || null,
        selfpickup: /self/i.test(method) ? 1 : 0,
        remarks: remarks.join("\n") || null,
        lines,
      });
    }

    for (const [header, n] of unmappedWithQty) {
      errors.push(`Column "${header}" has quantities on ${n} row(s) but matches no product; add it to COLUMN_OVERRIDES`);
    }
    for (const u of unmapped) {
      if (!unmappedWithQty.has(u.header)) warnings.push(`Column "${u.header}" ignored (no product match, no quantities)`);
    }

    // ---- summary ----------------------------------------------------------
    const lineCount = dos.reduce((n, d) => n + d.lines.length, 0);
    const unitCount = dos.reduce((n, d) => n + d.lines.reduce((m, l) => m + l.qty, 0), 0);
    const serialCount = dos.reduce((n, d) => n + d.lines.reduce((m, l) => m + l.serials.length, 0), 0);
    const [counts] = await conn.query(WIPE_TABLES.map((t) => `SELECT '${t}' AS t, COUNT(*) AS n FROM \`${t}\``).join(" UNION ALL "));

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(__dirname, "backups", `import_do_listing_${stamp}`);
    fs.mkdirSync(backupDir, { recursive: true });
    const report = [
      `File: ${path.resolve(args.file)}  Sheet: ${ws.name}  Header row: ${headerRow}`,
      `Target: ${target}  Mode: ${apply ? "APPLY" : "dry run"}`,
      "",
      "Product columns:",
      ...productCols.map((pc) => `  ${pc.header}  ->  ${pc.product.itemcode} ${pc.product.name}`),
      "",
      `Would delete: ${counts.filter((c) => c.n > 0).map((c) => `${c.t} ${c.n}`).join(", ") || "nothing"}`,
      `Would insert: ${customers.size} customers, ${dos.length} DOs, ${lineCount} DO lines (${unitCount} units), ${serialCount} serials`,
      "",
      `Errors (${errors.length}):`,
      ...errors.map((e) => `  ${e}`),
      "",
      `Warnings (${warnings.length}):`,
      ...warnings.map((w) => `  ${w}`),
    ].join("\n");
    fs.writeFileSync(path.join(backupDir, "report.txt"), report + "\n");
    fs.writeFileSync(
      path.join(backupDir, "serials.csv"),
      ["do_no,itemcode,serial_no,result", ...serialLog.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n") + "\n"
    );

    console.log(report);
    console.log(`\nReport and serial list: ${backupDir}`);

    if (errors.length > 0) {
      console.error(`\n✗  ${errors.length} error(s). Fix the file (or COLUMN_OVERRIDES) and run again. Nothing was written to the database.`);
      process.exitCode = 1;
      return;
    }
    if (!apply) {
      console.log(`\nDry run only. To write, add: --apply --confirm=${target}`);
      return;
    }

    // ---- apply ------------------------------------------------------------
    for (const t of WIPE_TABLES) {
      const [rows] = await conn.query(`SELECT * FROM \`${t}\``);
      fs.writeFileSync(path.join(backupDir, `${t}.json`), JSON.stringify(rows, null, 1));
    }
    console.log(`✓  Backed up ${WIPE_TABLES.length} tables`);

    // Loaded here so the pool it creates only exists on an apply run.
    const pool = require("../src/config/db");
    const serialModel = require("../src/models/serialModel");

    await conn.beginTransaction();
    try {
      for (const t of WIPE_TABLES) await conn.query(`DELETE FROM \`${t}\``);
      console.log("✓  Deleted transaction and customer data");

      const customerId = new Map();
      for (const [key, c] of customers) {
        const [res] = await conn.query(
          `INSERT INTO customers (username, name, enteredby, entereddate, active) VALUES (?, ?, NULL, NOW(), 1)`,
          [c.username, c.name || c.username]
        );
        customerId.set(key, res.insertId);
      }
      console.log(`✓  Inserted ${customers.size} customers`);

      for (const d of dos) {
        const [hd] = await conn.query(
          `INSERT INTO dohd (transtype, contactid, ordermethod, walletused, stockist, selfpickup, transdate, reference, datecollected, remarks, enteredby, entereddate, active)
           VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL, NOW(), 1)`,
          [TXN_TYPE, customerId.get(d.prifeKey), d.ordermethod, d.walletused, d.selfpickup, d.transdate, d.doNo, d.datecollected, d.remarks]
        );
        for (const l of d.lines) {
          const [ln] = await conn.query(
            `INSERT INTO dodetails (doid, itemid, qty, enteredby, entereddate, active) VALUES (?, ?, ?, NULL, NOW(), 1)`,
            [hd.insertId, l.product.productid, l.qty]
          );
          if (l.serials.length === 0) continue;
          await serialModel.issueOnStockOut(
            {
              productid: l.product.productid,
              docType: "do",
              lineId: ln.insertId,
              serials: l.serials,
              remarks: "Imported from DO listing",
              status: serialModel.DO_STATUS[TXN_TYPE],
            },
            conn
          );
          // Movements are stamped NOW(); date them with the DO instead.
          await conn.query(`UPDATE product_serial_mov SET mov_date = ? WHERE dolineid = ?`, [d.transdate, ln.insertId]);
        }
      }
      await conn.commit();
      console.log(`✓  Inserted ${dos.length} DOs, ${lineCount} lines, ${serialCount} serials`);
      console.log(`\nDone. Backups of the deleted rows are in ${backupDir}`);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      await pool.end();
    }
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error(`✗  ${err.message}`);
  process.exit(1);
});
