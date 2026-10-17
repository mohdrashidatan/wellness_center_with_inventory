const pool = require("../config/db");

/**
 * Serial numbers are tracked as one row per physical unit in `product_serial`,
 * with every event appended to `product_serial_mov`.
 *
 * A unit can be born at either end of its life:
 *   - stock in  (GRN)      — optional, for products whose serial is on the box
 *   - stock out (POS / DO)  — for products whose serial is applied on sale
 *
 * Every write helper accepts an optional `conn` so it can join the caller's
 * transaction (GRN / DO create already run in one); it falls back to the pool.
 */

const DOC_COLUMN = {
  grn: "grnlineid",
  pos: "poslinesid",
  do: "dolineid",
  stkadj: "stkadjlinesid",
};

const MOV_TYPE = {
  grn: "GRN In",
  pos: "POS Sale",
  do: "DO Out",
  stkadj: "Adjustment",
};

// Status a unit lands in when it leaves on a DO, by the header's transaction type.
const DO_STATUS = {
  "Loan Out": "Loaned Out",
  "Consign Sales": "Consigned",
};

const normalise = (list) =>
  (Array.isArray(list) ? list : [])
    .map((s) => (typeof s === "string" ? s.trim() : s == null ? "" : String(s).trim()))
    .filter((s) => s.length > 0);

const logMovement = async (db, { serialId, docType, lineId, movType, enteredby, remarks }) => {
  const col = DOC_COLUMN[docType];
  await db.query(
    `INSERT INTO product_serial_mov
       (serial_id, mov_type, mov_date, ${col}, remarks, enteredby, entereddate)
     VALUES (?, ?, NOW(), ?, ?, ?, NOW())`,
    [serialId, movType, lineId ?? null, remarks || null, enteredby ?? null]
  );
};

/**
 * Register serials received on a GRN line. Optional: an empty list is a no-op,
 * so non-serialised products and un-serialised receipts behave exactly as before.
 */
const receiveOnGrnLine = async ({ productid, grnlineid, serials, enteredby, remarks }, conn) => {
  const db = conn || pool;
  const list = normalise(serials);
  if (list.length === 0) return [];

  const created = [];
  for (const serial_no of list) {
    const [res] = await db.query(
      `INSERT INTO product_serial
         (productid, serial_no, status, grnlineid, remarks, enteredby, entereddate, active)
       VALUES (?, ?, 'In Stock', ?, ?, ?, NOW(), 1)`,
      [productid, serial_no, grnlineid ?? null, remarks || null, enteredby ?? null]
    );
    await logMovement(db, {
      serialId: res.insertId,
      docType: "grn",
      lineId: grnlineid,
      movType: MOV_TYPE.grn,
      enteredby,
      remarks,
    });
    created.push({ serial_id: res.insertId, serial_no });
  }
  return created;
};

/**
 * Record serials leaving on a stock-out line (POS sale or DO).
 *
 * For each serial: if the unit is already registered and in stock it is moved
 * to the outgoing status; otherwise the unit is created at that status, which
 * is the 'serial applied on sale' case. Either way a movement row is written,
 * so the history is uniform regardless of where the unit was born.
 */
const issueOnStockOut = async (
  { productid, docType, lineId, serials, enteredby, remarks, status = "Sold" },
  conn
) => {
  const db = conn || pool;
  const list = normalise(serials);
  if (list.length === 0) return [];

  const movType = MOV_TYPE[docType] || MOV_TYPE.pos;
  const issued = [];

  for (const serial_no of list) {
    const [[existing]] = await db.query(
      `SELECT serial_id, productid, status FROM product_serial
       WHERE serial_no = ? AND active = 1`,
      [serial_no]
    );

    let serialId;
    if (existing) {
      if (existing.productid !== productid) {
        const err = new Error(
          `Serial "${serial_no}" belongs to a different product (id ${existing.productid})`
        );
        err.code = "SERIAL_WRONG_PRODUCT";
        throw err;
      }
      if (!["In Stock", "Returned", "Pending Serial"].includes(existing.status)) {
        const err = new Error(`Serial "${serial_no}" is already ${existing.status}`);
        err.code = "SERIAL_NOT_AVAILABLE";
        throw err;
      }
      await db.query(
        `UPDATE product_serial SET status = ?, editedby = ?, editeddate = NOW()
         WHERE serial_id = ?`,
        [status, enteredby ?? null, existing.serial_id]
      );
      serialId = existing.serial_id;
    } else {
      // Serial applied at point of sale — the unit was anonymous until now.
      const [res] = await db.query(
        `INSERT INTO product_serial
           (productid, serial_no, status, remarks, enteredby, entereddate, active)
         VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
        [productid, serial_no, status, remarks || null, enteredby ?? null]
      );
      serialId = res.insertId;
    }

    await logMovement(db, {
      serialId,
      docType,
      lineId,
      movType,
      enteredby,
      remarks,
    });
    issued.push({ serial_id: serialId, serial_no, status });
  }
  return issued;
};

/** Units currently sellable for a product — what the stock-out picker lists. */
const getAvailableByProduct = async (productid) => {
  const [rows] = await pool.query(
    `SELECT serial_id, serial_no, status, grnlineid, entereddate
     FROM product_serial
     WHERE productid = ? AND active = 1 AND status IN ('In Stock', 'Returned')
     ORDER BY entereddate ASC, serial_id ASC`,
    [productid]
  );
  return rows;
};

const listSerials = async ({ search = "", productId = null, status = "", page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const where = ["ps.active = 1"];
  const params = [];

  if (search) {
    where.push("(ps.serial_no LIKE ? OR p.name LIKE ? OR p.itemcode LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (productId) {
    where.push("ps.productid = ?");
    params.push(productId);
  }
  if (status) {
    where.push("ps.status = ?");
    params.push(status);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const [rows] = await pool.query(
    `SELECT ps.serial_id, ps.serial_no, ps.status, ps.productid, ps.entereddate,
            p.itemcode, p.name AS product_name, p.subcat,
            pm.serial_capture_at
     FROM product_serial ps
     LEFT JOIN products p ON p.productid = ps.productid
     LEFT JOIN product_master pm ON pm.productid = ps.productid
     ${whereSql}
     ORDER BY ps.entereddate DESC, ps.serial_id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM product_serial ps
     LEFT JOIN products p ON p.productid = ps.productid
     ${whereSql}`,
    params
  );

  return { rows, total };
};

/** Full life story of one unit, newest event first. */
const getSerialHistory = async (serialId) => {
  const [[serial]] = await pool.query(
    `SELECT ps.*, p.itemcode, p.name AS product_name
     FROM product_serial ps
     LEFT JOIN products p ON p.productid = ps.productid
     WHERE ps.serial_id = ?`,
    [serialId]
  );
  if (!serial) return null;

  const [movements] = await pool.query(
    `SELECT m.mov_id, m.mov_type, m.mov_date, m.remarks,
            m.grnlineid, m.poslinesid, m.dolineid, m.stkadjlinesid,
            COALESCE(g.delivery_order_no, CONCAT('GRN-', g.grnid))  AS grn_ref,
            CONCAT('POS-', ph.posid)                                AS pos_ref,
            COALESCE(d.reference, CONCAT('DO-', d.doid))            AS do_ref
     FROM product_serial_mov m
     LEFT JOIN grndetails gd ON gd.grnlineid = m.grnlineid
     LEFT JOIN grnhd g       ON g.grnid      = gd.grnid
     LEFT JOIN poslines pl   ON pl.poslinesid = m.poslinesid
     LEFT JOIN poshd ph      ON ph.posid      = pl.posid
     LEFT JOIN dodetails dd  ON dd.dolineid   = m.dolineid
     LEFT JOIN dohd d        ON d.doid        = dd.doid
     WHERE m.serial_id = ?
     ORDER BY m.mov_date DESC, m.mov_id DESC`,
    [serialId]
  );

  return { ...serial, movements };
};

/**
 * Serial-vs-stock reconciliation. The rule differs by capture mode, so a single
 * query would give false alarms:
 *   Receipt mode — units in stock must equal the computed stock balance.
 *   Sale mode    — units sold must equal the quantity sold through the POS,
 *                  since nothing is serialised while it sits on the shelf.
 */
const getReconciliation = async () => {
  const [rows] = await pool.query(
    `SELECT
       p.productid,
       p.itemcode,
       p.name AS product_name,
       COALESCE(pm.serial_capture_at, 'Receipt') AS serial_capture_at,
       COALESCE(grn.total_in, 0) - COALESCE(do_out.total_out, 0)
         - COALESCE(pos_out.total_sold, 0) + COALESCE(adj.total_adj, 0) AS balance_qty,
       COALESCE(pos_out.total_sold, 0) AS total_sold,
       COALESCE(sn.in_stock, 0)        AS serials_in_stock,
       COALESCE(sn.sold, 0)            AS serials_sold,
       CASE COALESCE(pm.serial_capture_at, 'Receipt')
         WHEN 'Sale' THEN COALESCE(sn.sold, 0) - COALESCE(pos_out.total_sold, 0)
         ELSE COALESCE(sn.in_stock, 0) - (
                COALESCE(grn.total_in, 0) - COALESCE(do_out.total_out, 0)
                - COALESCE(pos_out.total_sold, 0) + COALESCE(adj.total_adj, 0))
       END AS variance
     FROM products p
     JOIN product_master pm ON pm.productid = p.productid AND pm.is_serialized = 1
     LEFT JOIN (
       SELECT gd.itemid, SUM(gd.qty) AS total_in FROM grndetails gd
       JOIN grnhd g ON g.grnid = gd.grnid
       WHERE gd.active = 1 AND g.active = 1 GROUP BY gd.itemid
     ) grn ON grn.itemid = p.productid
     LEFT JOIN (
       SELECT dd.itemid, SUM(dd.qty) AS total_out FROM dodetails dd
       JOIN dohd d ON d.doid = dd.doid
       WHERE dd.active = 1 AND d.active = 1 GROUP BY dd.itemid
     ) do_out ON do_out.itemid = p.productid
     LEFT JOIN (
       SELECT pl.itemid, SUM(pl.qty) AS total_sold FROM poslines pl
       JOIN poshd ph ON ph.posid = pl.posid
       WHERE pl.active = 1 AND ph.active = 1 GROUP BY pl.itemid
     ) pos_out ON pos_out.itemid = p.productid
     LEFT JOIN (
       SELECT sl.itemid, SUM(sl.onhandactual - sl.onhandstk) AS total_adj FROM stkadjlines sl
       JOIN stkadjhd sh ON sh.stkadjhdid = sl.stkadjhdid
       WHERE sl.active = 1 AND sh.active = 1 AND sl.onhandactual IS NOT NULL
       GROUP BY sl.itemid
     ) adj ON adj.itemid = p.productid
     LEFT JOIN (
       SELECT productid,
              SUM(status IN ('In Stock', 'Returned')) AS in_stock,
              SUM(status IN ('Sold', 'Transferred', 'Consigned', 'Loaned Out')) AS sold
       FROM product_serial WHERE active = 1 GROUP BY productid
     ) sn ON sn.productid = p.productid
     WHERE p.active = 1
     ORDER BY ABS(
       CASE COALESCE(pm.serial_capture_at, 'Receipt')
         WHEN 'Sale' THEN COALESCE(sn.sold, 0) - COALESCE(pos_out.total_sold, 0)
         ELSE COALESCE(sn.in_stock, 0) - (
                COALESCE(grn.total_in, 0) - COALESCE(do_out.total_out, 0)
                - COALESCE(pos_out.total_sold, 0) + COALESCE(adj.total_adj, 0))
       END
     ) DESC, p.name ASC`
  );
  return rows;
};

/** Products that expect serials, so the entry screens know what to prompt for. */
const getSerializedProducts = async () => {
  const [rows] = await pool.query(
    `SELECT p.productid, p.itemcode, p.name,
            COALESCE(pm.serial_capture_at, 'Receipt') AS serial_capture_at
     FROM products p
     JOIN product_master pm ON pm.productid = p.productid
     WHERE p.active = 1 AND pm.is_serialized = 1
     ORDER BY p.name`
  );
  return rows;
};

module.exports = {
  receiveOnGrnLine,
  issueOnStockOut,
  getAvailableByProduct,
  listSerials,
  getSerialHistory,
  getReconciliation,
  getSerializedProducts,
  DO_STATUS,
};
