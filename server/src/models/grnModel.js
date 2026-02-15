const pool = require("../config/db");

const getList = async ({ supplierName, itemSearch, dateFrom, dateTo, dateExact, page, limit }) => {
  const offset = (page - 1) * limit;

  const conditions = ["g.active = 1"];
  const params = [];

  if (supplierName) {
    conditions.push("c.display_name LIKE ?");
    params.push(`%${supplierName}%`);
  }

  if (itemSearch) {
    conditions.push(
      "EXISTS (SELECT 1 FROM grndetails gd2 LEFT JOIN product_sku ps2 ON gd2.itemid = ps2.sku_id WHERE gd2.grnid = g.grnid AND gd2.active = 1 AND (ps2.sku_code LIKE ? OR ps2.sku_name LIKE ?))"
    );
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
    FROM grnd g
    LEFT JOIN contacts c ON g.contactid = c.contactid
    WHERE ${where}
  `;

  const [countRows] = await pool.query(
    `SELECT COUNT(DISTINCT g.grnid) AS total ${baseQuery}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT DISTINCT
        g.grnid,
        g.receiptdate,
        g.remarks,
        c.contactid,
        c.display_name   AS supplier_name,
        c.code           AS supplier_code,
        c.phone          AS supplier_phone,
        c.email          AS supplier_email,
        c.contact_person AS supplier_contact_person
     ${baseQuery}
     ORDER BY g.receiptdate DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { total, rows };
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
     FROM grnd g
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
        ps.sku_code,
        ps.sku_name
     FROM grndetails gd
     LEFT JOIN product_sku ps ON gd.itemid = ps.sku_id
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
      `INSERT INTO grnd (contactid, receiptdate, delivery_order_no, remarks, enteredby, entereddate, active)
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
