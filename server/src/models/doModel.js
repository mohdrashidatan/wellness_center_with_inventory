const pool = require("../config/db");

const getList = async ({ recipientName, itemSearch, dateFrom, dateTo, dateExact, page, limit }) => {
  const offset = (page - 1) * limit;

  const conditions = ["g.active = 1", "gd.active = 1"];
  const params = [];

  if (recipientName) {
    conditions.push("c.display_name LIKE ?");
    params.push(`%${recipientName}%`);
  }

  if (itemSearch) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
    params.push(`%${itemSearch}%`, `%${itemSearch}%`);
  }

  if (dateExact) {
    conditions.push("DATE(g.transdate) = ?");
    params.push(dateExact);
  } else {
    if (dateFrom) {
      conditions.push("DATE(g.transdate) >= ?");
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push("DATE(g.transdate) <= ?");
      params.push(dateTo);
    }
  }

  const where = conditions.join(" AND ");

  const baseQuery = `
    FROM dodetails gd
    JOIN dohd g ON g.doid = gd.doid
    LEFT JOIN contacts c ON c.contactid = g.contactid
    LEFT JOIN products p ON p.productid = gd.itemid
    WHERE ${where}
  `;

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT
        g.doid,
        g.transdate     AS transferdate,
        g.transtype,
        g.reference     AS delivery_order_no,
        c.display_name  AS recipient_name,
        p.name          AS product_name,
        gd.qty,
        gd.uom,
        gd.batch_no,
        gd.expiry_date,
        gd.remarks
     ${baseQuery}
     ORDER BY g.transdate DESC, g.doid DESC, gd.dolineid
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { total, rows };
};

const getById = async (id) => {
  const [[header]] = await pool.query(
    `SELECT
        g.doid,
        g.transdate     AS transferdate,
        g.transtype,
        g.reference     AS delivery_order_no,
        g.remarks,
        c.contactid,
        c.display_name   AS recipient_name,
        c.code           AS recipient_code,
        c.phone          AS recipient_phone,
        c.email          AS recipient_email,
        c.contact_person AS recipient_contact_person,
        c.billing_address1,
        c.billing_address2,
        c.billing_city,
        c.billing_postal_code,
        c.billing_country
     FROM dohd g
     LEFT JOIN contacts c ON c.contactid = g.contactid
     WHERE g.doid = ? AND g.active = 1`,
    [id]
  );

  if (!header) return null;

  const [lines] = await pool.query(
    `SELECT
        gd.dolineid,
        gd.itemid     AS productid,
        gd.qty,
        gd.uom,
        gd.batch_no,
        gd.expiry_date,
        gd.remarks,
        p.name        AS product_name,
        p.description AS product_desc
     FROM dodetails gd
     LEFT JOIN products p ON p.productid = gd.itemid
     WHERE gd.doid = ? AND gd.active = 1
     ORDER BY gd.dolineid`,
    [id]
  );

  return { header, lines };
};

const create = async ({ txn_type, contactid, transferdate, delivery_order_no, remarks, enteredby }, lines) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [hResult] = await conn.query(
      `INSERT INTO dohd (transtype, contactid, transdate, reference, remarks, enteredby, entereddate, active)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [txn_type || null, contactid || null, transferdate, delivery_order_no || null, remarks || null, enteredby || null]
    );
    const doid = hResult.insertId;

    for (const ln of lines) {
      await conn.query(
        `INSERT INTO dodetails (doid, itemid, qty, uom, batch_no, expiry_date, remarks, enteredby, entereddate, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
        [
          doid,
          ln.itemid || null,
          ln.qty || 0,
          ln.uom || null,
          ln.batch_no || null,
          ln.expiry_date || null,
          ln.remarks || null,
          enteredby || null,
        ]
      );
    }

    await conn.commit();
    return doid;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const update = async (id, { txn_type, contactid, transferdate, delivery_order_no, remarks }, lines) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE dohd
       SET transtype=?, contactid=?, transdate=?, reference=?, remarks=?
       WHERE doid=? AND active=1`,
      [txn_type || null, contactid || null, transferdate, delivery_order_no || null, remarks || null, id]
    );

    // Soft-delete existing lines then re-insert
    await conn.query(`UPDATE dodetails SET active=0 WHERE doid=?`, [id]);

    for (const ln of lines) {
      await conn.query(
        `INSERT INTO dodetails (doid, itemid, qty, uom, batch_no, expiry_date, remarks, entereddate, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
        [id, ln.itemid || null, ln.qty || 0, ln.uom || null, ln.batch_no || null, ln.expiry_date || null, ln.remarks || null]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { getList, getById, create, update };
