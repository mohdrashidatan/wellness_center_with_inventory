const pool = require("../config/db");

const getBalanceForAdj = async ({ cutoffDate, subcat } = {}) => {
  const co = cutoffDate || new Date().toISOString().split("T")[0];

  const [rows] = await pool.query(
    `SELECT
       p.productid,
       p.itemcode,
       p.name        AS product_name,
       p.description AS product_desc,
       p.productcat,
       p.subcat,
       CASE
         WHEN grn.total_in IS NULL AND do_out.total_out IS NULL
              AND pos_out.total_sold IS NULL AND adj.total_adj IS NULL
         THEN NULL
         ELSE COALESCE(grn.total_in, 0)
              - COALESCE(do_out.total_out, 0)
              - COALESCE(pos_out.total_sold, 0)
              + COALESCE(adj.total_adj, 0)
       END AS balance_qty
     FROM products p
     LEFT JOIN (
       SELECT gd.itemid, SUM(gd.qty) AS total_in
       FROM grndetails gd
       JOIN grnhd g ON g.grnid = gd.grnid
       WHERE gd.active = 1 AND g.active = 1 AND DATE(g.receiptdate) <= ?
       GROUP BY gd.itemid
     ) grn ON grn.itemid = p.productid
     LEFT JOIN (
       SELECT dd.itemid, SUM(dd.qty) AS total_out
       FROM dodetails dd
       JOIN dohd d ON d.doid = dd.doid
       WHERE dd.active = 1 AND d.active = 1 AND DATE(d.transdate) <= ?
       GROUP BY dd.itemid
     ) do_out ON do_out.itemid = p.productid
     LEFT JOIN (
       SELECT pl.itemid, SUM(pl.qty) AS total_sold
       FROM poslines pl
       JOIN poshd ph ON ph.posid = pl.posid
       WHERE pl.active = 1 AND ph.active = 1 AND DATE(ph.transdate) <= ?
       GROUP BY pl.itemid
     ) pos_out ON pos_out.itemid = p.productid
     LEFT JOIN (
       SELECT sl.itemid, SUM(sl.onhandactual - sl.onhandstk) AS total_adj
       FROM stkadjlines sl
       JOIN stkadjhd sh ON sh.stkadjhdid = sl.stkadjhdid
       WHERE sl.active = 1 AND sh.active = 1 AND sl.onhandactual IS NOT NULL
         AND DATE(sh.stkadjasatdate) <= ?
       GROUP BY sl.itemid
     ) adj ON adj.itemid = p.productid
     WHERE p.active = 1 AND (p.productcat IS NULL OR p.productcat != 'Service')
       ${subcat ? "AND p.subcat = ?" : ""}
     ORDER BY p.name ASC`,
    subcat ? [co, co, co, co, subcat] : [co, co, co, co]
  );
  return rows;
};

const createAdjustment = async ({ stkadjasatdate, stkadjdescription, enteredby, lines }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [hdResult] = await conn.execute(
      `INSERT INTO stkadjhd (stkadjasatdate, stkadjdescription, enteredby, entereddate, editedby, editeddate, active)
       VALUES (?, ?, ?, CURDATE(), NULL, NULL, 1)`,
      [stkadjasatdate, stkadjdescription || null, enteredby]
    );
    const stkadjhdid = hdResult.insertId;

    if (lines && lines.length > 0) {
      const lineValues = lines.map((l) => [
        stkadjhdid,
        l.itemid,
        l.onhandactual ?? null,
        l.onhandstk ?? null,
        l.reasonfordiff || null,
        1,
      ]);
      await conn.query(
        `INSERT INTO stkadjlines (stkadjhdid, itemid, onhandactual, onhandstk, reasonfordiff, active)
         VALUES ?`,
        [lineValues]
      );
    }

    await conn.commit();
    return stkadjhdid;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { getBalanceForAdj, createAdjustment };
