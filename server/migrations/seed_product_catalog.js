/**
 * Reconcile the `products` catalog with the manually maintained inventory list
 * (Google Sheet), using the flat-SKU model: every sellable variant is its own
 * `products` row, keyed by a stable `itemcode`.
 *
 * Idempotent - safe to re-run. Creates no new tables.
 *
 *   `id` present -> that existing row is renamed/coded in place (history kept)
 *   `id` absent  -> row is inserted, or updated if its itemcode already exists
 *
 * Run with: node server/migrations/seed_product_catalog.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mysql = require("mysql2/promise");

const BRAND = "Prife";

// The sheet carries no prices. New catalog rows start at this placeholder so
// they are sellable in the POS; a real price entered later is never overwritten
// (the upsert below leaves price columns alone on an existing row).
const DEFAULT_PRICE = "1.00";

// 66 rows from the sheet. Typos fixed (K47 "URPLE" -> Purple, K44-"(WINE RED)"
// -> "(Wine Red)"), double spaces collapsed, colour casing normalised, and pack
// size stripped from names ("MINTBLISS (1 BOTTLE)" -> "Mint Bliss").
const CATALOG = [
  // --- Device ---
  { code: "ITC-CLS", name: "IteraCare Classic", subcat: "Device", id: 31 },
  { code: "ITC-PPL", name: "IteraCare Premium Plus", subcat: "Device", id: 28 },
  { code: "ITC-PRO", name: "IteraCare Pro", subcat: "Device" },
  { code: "ITB-STD", name: "Itera Bio", subcat: "Device", id: 29 },
  { code: "ITB-LTE", name: "Itera Bio Lite", subcat: "Device", id: 30 },
  { code: "HBS-STD", name: "Hydrogen Beauty Sprayer", subcat: "Device", id: 25 },
  { code: "OXY-STD", name: "Oxytap", subcat: "Device" },

  // --- Accessory ---
  { code: "7WC-STD", name: "7 Wonder Cartridge", subcat: "Accessory" },
  { code: "OXY-NOZ", name: "Oxytap Nozzle", subcat: "Accessory", id: 34 },
  { code: "ION-PUR", name: "Ion Shield (Purple)", subcat: "Accessory" },
  { code: "ION-WHT", name: "Ion Shield (White)", subcat: "Accessory" },
  { code: "ION-BLU", name: "Ion Shield (Blue)", subcat: "Accessory" },
  { code: "SES-STD", name: "Scalar Energy Shield", subcat: "Accessory", id: 39 },

  // --- Supplement ---
  { code: "ALF-STD", name: "Alfalfa", subcat: "Supplement" },
  { code: "NAT-STD", name: "Natto", subcat: "Supplement", id: 33 },
  { code: "SPL-STD", name: "Spring Life", subcat: "Supplement" },
  { code: "MNT-STD", name: "Mint Bliss", subcat: "Supplement", id: 32 },
  { code: "CF3-STD", name: "3 in 1 Coffee", subcat: "Supplement", id: 36 },
  { code: "CF6-STD", name: "6 in 1 Coffee", subcat: "Supplement", id: 37 },
  { code: "BTR-STD", name: "Botani Royale", subcat: "Supplement", id: 12 },
  { code: "SAT-WDY", name: "Sateera (Wendy)", subcat: "Supplement", brand: "Sateera" },

  // --- Personal Care ---
  { code: "AGW-HOT", name: "Agarwood Oil (Hot)", subcat: "Personal Care", id: 10 },
  { code: "AGW-CLD", name: "Agarwood Oil (Cold)", subcat: "Personal Care" },
  { code: "AQC-STD", name: "Aqua Cream", subcat: "Personal Care" },
  { code: "REC-STD", name: "Radiant Essence Cream", subcat: "Personal Care" },
  { code: "AAS-STD", name: "Anti-Aging Serum Spray", subcat: "Personal Care", id: 11 },
  { code: "EYE-STD", name: "Eye Essence", subcat: "Personal Care", id: 43 },
  { code: "HCM-STD", name: "Hydrolyzed Collagen Facial Mask", subcat: "Personal Care", id: 26 },

  // --- Patch ---
  { code: "TKP-STD", name: "Takara Patch", subcat: "Patch", id: 41 },
  { code: "GEP-STD", name: "Graphene Energy Patch", subcat: "Patch", id: 24 },

  // --- Eyewear: Envy Specs Adult ---
  { code: "ESA-BLU", name: "Envy Specs Adult (Blue)", subcat: "Eyewear", id: 16 },
  { code: "ESA-BLK", name: "Envy Specs Adult (Black)", subcat: "Eyewear", id: 15 },
  { code: "ESA-RED", name: "Envy Specs Adult (Red)", subcat: "Eyewear", id: 23 },
  { code: "ESA-PUR", name: "Envy Specs Adult (Purple)", subcat: "Eyewear", id: 22 },

  // --- Eyewear: Envy Spec K44 / K46 / K47 ---
  { code: "EK44-PUR", name: "Envy Spec K44 (Purple)", subcat: "Eyewear" },
  { code: "EK44-BLU", name: "Envy Spec K44 (Blue)", subcat: "Eyewear" },
  { code: "EK44-GRY", name: "Envy Spec K44 (Grey)", subcat: "Eyewear", id: 17 },
  { code: "EK44-GRN", name: "Envy Spec K44 (Green)", subcat: "Eyewear" },
  { code: "EK44-WRD", name: "Envy Spec K44 (Wine Red)", subcat: "Eyewear" },
  { code: "EK46-PUR", name: "Envy Spec K46 (Purple)", subcat: "Eyewear", id: 19 },
  { code: "EK46-BLU", name: "Envy Spec K46 (Blue)", subcat: "Eyewear" },
  { code: "EK46-GRY", name: "Envy Spec K46 (Grey)", subcat: "Eyewear", id: 18 },
  { code: "EK46-GRN", name: "Envy Spec K46 (Green)", subcat: "Eyewear" },
  { code: "EK46-WRD", name: "Envy Spec K46 (Wine Red)", subcat: "Eyewear", id: 20 },
  { code: "EK47-PUR", name: "Envy Spec K47 (Purple)", subcat: "Eyewear" },
  { code: "EK47-BLU", name: "Envy Spec K47 (Blue)", subcat: "Eyewear" },
  { code: "EK47-GRY", name: "Envy Spec K47 (Grey)", subcat: "Eyewear" },
  { code: "EK47-GRN", name: "Envy Spec K47 (Green)", subcat: "Eyewear" },
  { code: "EK47-WRD", name: "Envy Spec K47 (Wine Red)", subcat: "Eyewear", id: 21 },

  // --- Eyewear: Aurora Optics Sunglasses ---
  { code: "AOS-CLS", name: "Aurora Optics Sunglasses (Classic)", subcat: "Eyewear", id: 13 },
  { code: "AOS-INT", name: "Aurora Optics Sunglasses (Intellectual)", subcat: "Eyewear" },
  { code: "AOS-UNQ", name: "Aurora Optics Sunglasses (Unique)", subcat: "Eyewear" },
  { code: "AOS-ELG", name: "Aurora Optics Sunglasses (Elegant)", subcat: "Eyewear", id: 14 },
  { code: "AOS-PER", name: "Aurora Optics Sunglasses (Personality)", subcat: "Eyewear", id: 35 },
  { code: "AOS-TRD", name: "Aurora Optics Sunglasses (Trendy)", subcat: "Eyewear", id: 42 },
  { code: "AOS-VTG", name: "Aurora Optics Sunglasses (Vintage)", subcat: "Eyewear" },
  { code: "AOS-CNF", name: "Aurora Optics Sunglasses (Confident)", subcat: "Eyewear" },

  // --- Jewellery ---
  { code: "PWM-GLD", name: "Prife Watch Men (Gold)", subcat: "Jewellery" },
  { code: "PWM-SLV", name: "Prife Watch Men (Silver)", subcat: "Jewellery" },
  { code: "PWW-GLD", name: "Prife Watch Women (Gold)", subcat: "Jewellery", id: 40 },
  { code: "PWW-SLV", name: "Prife Watch Women (Silver)", subcat: "Jewellery" },
  { code: "PBG-GLD", name: "Prife Bangles (Gold)", subcat: "Jewellery" },
  { code: "PBG-SLV", name: "Prife Bangles (Silver)", subcat: "Jewellery", id: 38 },
  { code: "VTB-RED", name: "Vitality Bracelet (Red)", subcat: "Jewellery", id: 45 },
  { code: "VTB-BLK", name: "Vitality Bracelet (Black)", subcat: "Jewellery", id: 44 },
  { code: "VTB-GRY", name: "Vitality Bracelet (Grey)", subcat: "Jewellery" },
];

// Existing services keep their rows; coded for a consistent catalog.
const SERVICES = [
  { code: "SVC-BIO30", name: "Biolite30", subcat: "Therapy", id: 6 },
  { code: "SVC-ITERA40", name: "Itera40", subcat: "Therapy", id: 7 },
  { code: "SVC-MAGNO", name: "Magnoseek", subcat: "Therapy", id: 8 },
];

/**
 * Superseded rows - deactivated, never deleted, because all of them are
 * referenced by existing POS / GRN / DO / stock-adjustment lines.
 *   1,2,3,9 : overlap with sheet items (now carried by coded rows)
 *   27      : generic "Ion Shield" with no colour; replaced by ION-PUR/WHT/BLU
 */
const RETIRE = [
  { id: 1, why: "Prife Vision Eye Essence -> EYE-STD" },
  { id: 2, why: "Prife Luxe Bean anti aging serum spray -> AAS-STD" },
  { id: 3, why: "Watches -> PWM-* / PWW-*" },
  { id: 9, why: "Prife Envy Speccs Anion Anti Blue Light Glasses -> ESA-*" },
  { id: 27, why: "Ion Shield (no colour) -> ION-PUR / ION-WHT / ION-BLU" },
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [[pcs]] = await conn.query("SELECT uom_id FROM uom WHERE code = 'PCS'");
  if (!pcs) throw new Error("UOM 'PCS' not found - seed the uom table first");

  const stats = { coded: 0, inserted: 0, updated: 0, retired: 0, master: 0, priced: 0 };

  // Phase 1 - stamp the itemcode onto the existing row each entry maps to, so
  // phase 2 updates that row instead of inserting a near-duplicate.
  for (const row of [...CATALOG, ...SERVICES]) {
    if (!row.id) continue;
    await conn.query("UPDATE products SET itemcode = ? WHERE productid = ?", [row.code, row.id]);
    stats.coded++;
  }

  // Phase 2 - upsert by itemcode.
  for (const row of CATALOG) {
    const [res] = await conn.query(
      `INSERT INTO products (itemcode, name, productcat, brand, subcat,
                             unitprice, baseprice, reorder_level, active, entereddate)
       VALUES (?, ?, 'Product', ?, ?, ?, ?, 0, 1, NOW())
       ON DUPLICATE KEY UPDATE
         name       = VALUES(name),
         productcat = VALUES(productcat),
         brand      = VALUES(brand),
         subcat     = VALUES(subcat),
         active     = 1,
         editeddate = NOW()`,
      [row.code, row.name, row.brand || BRAND, row.subcat, DEFAULT_PRICE, DEFAULT_PRICE]
    );
    // mysql2 reports affectedRows 1 for an insert, 2 for an applied update.
    if (res.affectedRows === 1) stats.inserted++;
    else stats.updated++;
  }

  for (const row of SERVICES) {
    await conn.query(
      "UPDATE products SET productcat = 'Service', subcat = ?, editeddate = NOW() WHERE itemcode = ?",
      [row.subcat, row.code]
    );
  }

  // Backfill the placeholder price onto catalog rows that still have none.
  // Only touches NULLs, so prices already entered are left as they are.
  const codeList = CATALOG.map((r) => r.code);
  const [priced] = await conn.query(
    `UPDATE products
     SET unitprice = COALESCE(unitprice, ?),
         baseprice = COALESCE(baseprice, ?),
         editeddate = NOW()
     WHERE itemcode IN (${codeList.map(() => "?").join(",")})
       AND (unitprice IS NULL OR baseprice IS NULL)`,
    [DEFAULT_PRICE, DEFAULT_PRICE, ...codeList]
  );
  stats.priced = priced.affectedRows;

  // Phase 3 - every catalog row is a stock item measured in PCS. Variants are
  // modelled as their own rows, so is_variant_enabled stays 0.
  const codes = CATALOG.map((r) => r.code);
  const [rows] = await conn.query(
    `SELECT productid, itemcode FROM products WHERE itemcode IN (${codes.map(() => "?").join(",")})`,
    codes
  );
  for (const p of rows) {
    const [res] = await conn.query(
      `INSERT INTO product_master (productid, base_uom_id, is_stock_item, is_variant_enabled, is_serialized, is_batch_tracked)
       VALUES (?, ?, 1, 0, 0, 0)
       ON DUPLICATE KEY UPDATE base_uom_id = VALUES(base_uom_id), is_stock_item = 1`,
      [p.productid, pcs.uom_id]
    );
    if (res.affectedRows >= 1) stats.master++;
  }

  // Phase 4 - retire superseded rows (deactivate only; history is referenced).
  for (const r of RETIRE) {
    const [res] = await conn.query(
      "UPDATE products SET active = 0, editeddate = NOW() WHERE productid = ? AND active = 1",
      [r.id]
    );
    if (res.affectedRows) {
      stats.retired++;
      console.log(`   retired #${r.id}  ${r.why}`);
    }
  }

  console.log(
    [
      "",
      `itemcodes stamped: ${stats.coded}`,
      `catalog inserted : ${stats.inserted}`,
      `catalog updated  : ${stats.updated}`,
      `prices defaulted : ${stats.priced} (to ${DEFAULT_PRICE})`,
      `product_master   : ${stats.master}`,
      `retired          : ${stats.retired}`,
    ].join("\n")
  );

  const [[{ n }]] = await conn.query(
    "SELECT COUNT(*) AS n FROM products WHERE active = 1 AND productcat = 'Product'"
  );
  console.log(`active products  : ${n} (expected ${CATALOG.length})`);

  await conn.end();
}

run().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
