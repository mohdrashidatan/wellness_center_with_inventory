const pool = require("../config/db");

const getList = async ({ supplierName, itemSearch, dateFrom, dateTo, dateExact, page, limit }) => {
  const offset = (page - 1) * limit;

  const conditions = ["g.active = 1", "gd.active = 1"];
  const params = [];

  if (supplierName) {
    conditions.push("c.display_name LIKE ?");
    params.push(`%${supplierName}%`);
  }

  if (itemSearch) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
    params.push(`%${itemSearch}%`, `%${itemSearch}%`);
  }

  if (dateExact) {
    conditions.push("DATE(g.receiptdate) = ?");
    params.push(dateExact);
  } else {
    if (dateFrom) {
      conditions.push("DATE(g.receiptdate) >= ?");
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push("DATE(g.receiptdate) <= ?");
      params.push(dateTo);
    }
  }

  const where = conditions.join(" AND ");

  const baseQuery = `
    FROM grndetails gd
    JOIN grnhd g ON g.grnid = gd.grnid
    LEFT JOIN contacts c ON c.contactid = g.contactid
    LEFT JOIN products p ON p.productid = gd.itemid
    WHERE ${where}
  `;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(gd.qty), 0) AS total_qty ${baseQuery}`,
    params
  );
  const { total, total_qty } = countRows[0];

  const [rows] = await pool.query(
    `SELECT
        g.grnid,
        g.receiptdate,
        g.delivery_order_no,
        c.display_name  AS supplier_name,
        p.name          AS product_name,
        p.description   AS product_desc,
        gd.qty,
        gd.uom,
        gd.batch_no,
        gd.expiry_date,
        gd.remarks
     ${baseQuery}
     ORDER BY g.receiptdate DESC, g.grnid DESC, gd.grnlineid
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { total, total_qty, rows };
};

const getById = async (id) => {
  const [[header]] = await pool.query(
    `SELECT
        g.grnid,
        g.receiptdate,
        g.remarks,
        g.printed,
        c.contactid,
        c.display_name   AS supplier_name,
        c.code           AS supplier_code,
        c.phone          AS supplier_phone,
        c.email          AS supplier_email,
        c.contact_person AS supplier_contact_person,
        c.billing_address1,
        c.billing_address2,
        c.billing_city,
        c.billing_postal_code,
        c.billing_country
     FROM grnhd g
     LEFT JOIN contacts c ON g.contactid = c.contactid
     WHERE g.grnid = ? AND g.active = 1`,
    [id]
  );

  if (!header) return null;

  const [lines] = await pool.query(
    `SELECT
        gd.grnlineid,
        gd.qty,
        gd.uom,
        gd.consign,
        gd.remarks,
        p.name        AS product_name,
        p.description AS product_desc
     FROM grndetails gd
     LEFT JOIN products p ON gd.itemid = p.productid
     WHERE gd.grnid = ? AND gd.active = 1
     ORDER BY gd.grnlineid`,
    [id]
  );

  return { header, lines };
};

const create = async ({ contactid, receiptdate, delivery_order_no, remarks, enteredby }, lines) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [hResult] = await conn.query(
      `INSERT INTO grnhd (contactid, receiptdate, delivery_order_no, remarks, enteredby, entereddate, active)
       VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
      [contactid || null, receiptdate, delivery_order_no || null, remarks || null, enteredby || null]
    );
    const grnid = hResult.insertId;

    for (const ln of lines) {
      await conn.query(
        `INSERT INTO grndetails (grnid, itemid, qty, uom, consign, remarks, batch_no, expiry_date, enteredby, entereddate, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
        [
          grnid,
          ln.itemid || null,
          ln.qty || 0,
          ln.uom || null,
          ln.consign ? 1 : 0,
          ln.remarks || null,
          ln.batch_no || null,
          ln.expiry_date || null,
          enteredby || null,
        ]
      );
    }

    await conn.commit();
    return grnid;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { getList, getById, create };
