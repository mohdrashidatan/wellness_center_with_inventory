const pool = require("../config/db");

const getTopProductsSold = async ({ dateFrom, dateTo } = {}) => {
  const conditions = ["pl.active = 1", "ph.active = 1"];
  const params = [];
  if (dateFrom) { conditions.push("DATE(ph.transdate) >= ?"); params.push(dateFrom); }
  if (dateTo)   { conditions.push("DATE(ph.transdate) <= ?"); params.push(dateTo); }

  const [rows] = await pool.query(
    `SELECT p.productid, p.name AS product_name, SUM(pl.qty) AS total_qty, SUM(pl.total_price) AS total_revenue
     FROM poslines pl
     JOIN poshd ph ON ph.posid = pl.posid
     LEFT JOIN products p ON p.productid = pl.itemid
     WHERE ${conditions.join(" AND ")}
     GROUP BY pl.itemid, p.productid, p.name
     ORDER BY total_qty DESC
     LIMIT 3`,
    params
  );
  return rows;
};

const getTopProductsTransferred = async ({ dateFrom, dateTo } = {}) => {
  const conditions = ["dd.active = 1", "d.active = 1"];
  const params = [];
  if (dateFrom) { conditions.push("DATE(d.transdate) >= ?"); params.push(dateFrom); }
  if (dateTo)   { conditions.push("DATE(d.transdate) <= ?"); params.push(dateTo); }

  const [rows] = await pool.query(
    `SELECT p.productid, p.name AS product_name, SUM(dd.qty) AS total_qty
     FROM dodetails dd
     JOIN dohd d ON d.doid = dd.doid
     LEFT JOIN products p ON p.productid = dd.itemid
     WHERE ${conditions.join(" AND ")}
     GROUP BY dd.itemid, p.productid, p.name
     ORDER BY total_qty DESC
     LIMIT 3`,
    params
  );
  return rows;
};

const getTopCustomersSold = async ({ dateFrom, dateTo } = {}) => {
  const conditions = ["ph.active = 1"];
  const params = [];
  if (dateFrom) { conditions.push("DATE(ph.transdate) >= ?"); params.push(dateFrom); }
  if (dateTo)   { conditions.push("DATE(ph.transdate) <= ?"); params.push(dateTo); }

  const [rows] = await pool.query(
    `SELECT
       COALESCE(c.name, ph.walkinname, 'Walk-in') AS customer_name,
       COUNT(DISTINCT ph.posid) AS total_transactions,
       SUM(ph.total_amount) AS total_spent
     FROM poshd ph
     LEFT JOIN customers c ON c.customerid = ph.customerid
     WHERE ${conditions.join(" AND ")}
     GROUP BY ph.customerid, ph.walkinname, c.name
     ORDER BY total_spent DESC
     LIMIT 3`,
    params
  );
  return rows;
};

// Stock balance per product up to cutoffDate
const getStockBalance = async ({ cutoffDate } = {}) => {
  const co = cutoffDate || new Date().toISOString().split("T")[0];

  const [rows] = await pool.query(
    `SELECT
       p.productid,
       p.name        AS product_name,
       p.description AS product_desc,
       p.productcat,
       COALESCE(grn.total_in,   0) AS total_in,
       COALESCE(do_out.total_out, 0) AS total_out,
       COALESCE(pos_out.total_sold, 0) AS total_sold,
       COALESCE(grn.total_in, 0)
         - COALESCE(do_out.total_out, 0)
         - COALESCE(pos_out.total_sold, 0) AS balance_qty
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
     WHERE p.active = 1
     ORDER BY p.name ASC`,
    [co, co, co]
  );
  return rows;
};

// Combined stock movements: POS Sales + DO Transfers + GRN Receipts
const getStockMovements = async ({ dateFrom, dateTo, movType, productSearch, productId, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const buildWhere = (conditions) => conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // POS Sales
  const posConditions = ["pl.active = 1", "ph.active = 1"];
  const posParams = [];
  if (dateFrom)      { posConditions.push("DATE(ph.transdate) >= ?"); posParams.push(dateFrom); }
  if (dateTo)        { posConditions.push("DATE(ph.transdate) <= ?"); posParams.push(dateTo); }
  if (productSearch) { posConditions.push("(p.name LIKE ? OR p.description LIKE ?)"); posParams.push(`%${productSearch}%`, `%${productSearch}%`); }
  if (productId)     { posConditions.push("pl.itemid = ?"); posParams.push(productId); }

  // DO Transfers
  const doConditions = ["dd.active = 1", "d.active = 1"];
  const doParams = [];
  if (dateFrom)      { doConditions.push("DATE(d.transdate) >= ?"); doParams.push(dateFrom); }
  if (dateTo)        { doConditions.push("DATE(d.transdate) <= ?"); doParams.push(dateTo); }
  if (productSearch) { doConditions.push("(p.name LIKE ? OR p.description LIKE ?)"); doParams.push(`%${productSearch}%`, `%${productSearch}%`); }
  if (productId)     { doConditions.push("dd.itemid = ?"); doParams.push(productId); }

  // GRN Receipts
  const grnConditions = ["gd.active = 1", "g.active = 1"];
  const grnParams = [];
  if (dateFrom)      { grnConditions.push("DATE(g.receiptdate) >= ?"); grnParams.push(dateFrom); }
  if (dateTo)        { grnConditions.push("DATE(g.receiptdate) <= ?"); grnParams.push(dateTo); }
  if (productSearch) { grnConditions.push("(p.name LIKE ? OR p.description LIKE ?)"); grnParams.push(`%${productSearch}%`, `%${productSearch}%`); }
  if (productId)     { grnConditions.push("gd.itemid = ?"); grnParams.push(productId); }

  const posSql = `
    SELECT
      ph.transdate AS mov_date,
      'POS Sale'   AS mov_type,
      p.name       AS product_name,
      pl.qty,
      CONCAT('POS-', ph.posid)                          AS reference,
      COALESCE(c.name, ph.walkinname, 'Walk-in')        AS party_name,
      pl.total_price                                     AS amount
    FROM poslines pl
    JOIN poshd ph ON ph.posid = pl.posid
    LEFT JOIN products p  ON p.productid  = pl.itemid
    LEFT JOIN customers c ON c.customerid = ph.customerid
    ${buildWhere(posConditions)}`;

  const doSql = `
    SELECT
      d.transdate                                          AS mov_date,
      'Transfer Out'                                       AS mov_type,
      p.name                                               AS product_name,
      dd.qty,
      COALESCE(d.reference, CONCAT('DO-', d.doid))        AS reference,
      ct.display_name                                      AS party_name,
      NULL                                                 AS amount
    FROM dodetails dd
    JOIN dohd d ON d.doid = dd.doid
    LEFT JOIN products p  ON p.productid  = dd.itemid
    LEFT JOIN contacts ct ON ct.contactid = d.contactid
    ${buildWhere(doConditions)}`;

  const grnSql = `
    SELECT
      g.receiptdate                                                  AS mov_date,
      'GRN Receipt'                                                  AS mov_type,
      p.name                                                         AS product_name,
      gd.qty,
      COALESCE(g.delivery_order_no, CONCAT('GRN-', g.grnid))        AS reference,
      ct.display_name                                                AS party_name,
      NULL                                                           AS amount
    FROM grndetails gd
    JOIN grnhd g ON g.grnid = gd.grnid
    LEFT JOIN products p  ON p.productid  = gd.itemid
    LEFT JOIN contacts ct ON ct.contactid = g.contactid
    ${buildWhere(grnConditions)}`;

  let unionSql, unionParams;
  if (movType === "POS Sale") {
    unionSql = posSql; unionParams = posParams;
  } else if (movType === "Transfer Out") {
    unionSql = doSql; unionParams = doParams;
  } else if (movType === "GRN Receipt") {
    unionSql = grnSql; unionParams = grnParams;
  } else {
    unionSql = `(${posSql}) UNION ALL (${doSql}) UNION ALL (${grnSql})`;
    unionParams = [...posParams, ...doParams, ...grnParams];
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM (${unionSql}) AS combined`,
    unionParams
  );

  const [rows] = await pool.query(
    `SELECT * FROM (${unionSql}) AS combined ORDER BY mov_date DESC LIMIT ? OFFSET ?`,
    [...unionParams, limit, offset]
  );

  return { total, rows };
};

module.exports = { getTopProductsSold, getTopProductsTransferred, getTopCustomersSold, getStockBalance, getStockMovements };
