const pool = require("../config/db");
const serialModel = require("./serialModel");

const searchCustomers = async (query) => {
  const [rows] = await pool.query(
    `SELECT customerid, name, username FROM customers WHERE active = 1 AND name LIKE ? ORDER BY name ASC LIMIT 20`,
    [`%${query}%`]
  );
  return rows;
};

const createCustomer = async (name) => {
  const [result] = await pool.query(
    `INSERT INTO customers (name, active, entereddate) VALUES (?, 1, NOW())`,
    [name]
  );
  return { customerid: result.insertId, name };
};

const getList = async ({ recipientName, itemSearch, dateFrom, dateTo, dateExact, page, limit }) => {
  const offset = (page - 1) * limit;

  const conditions = ["g.active = 1", "gd.active = 1"];
  const params = [];

  if (recipientName) {
    conditions.push("c.name LIKE ?");
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
    LEFT JOIN customers c ON c.customerid = g.contactid
    LEFT JOIN products p ON p.productid = gd.itemid
    WHERE ${where}
  `;

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT
        g.doid,
        g.transdate        AS transferdate,
        g.transtype,
        g.selfpickup,
        g.datecollected,
        g.reference        AS delivery_order_no,
        c.name             AS recipient_name,
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
        g.transdate          AS transferdate,
        g.transtype,
        g.ordermethod,
        g.walletused,
        g.stockist,
        g.selfpickup,
        g.datecollected,
        g.reference          AS delivery_order_no,
        g.remarks,
        c.customerid         AS contactid,
        c.name               AS recipient_name,
        c.username           AS recipient_username,
        c.contact_no         AS recipient_phone,
        c.email              AS recipient_email,
        c.address            AS recipient_address
     FROM dohd g
     LEFT JOIN customers c ON c.customerid = g.contactid
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

const create = async ({ txn_type, contactid, ordermethod, walletused, stockist, selfpickup, datecollected, transferdate, delivery_order_no, remarks, enteredby }, lines) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [hResult] = await conn.query(
      `INSERT INTO dohd (transtype, contactid, ordermethod, walletused, stockist, selfpickup, transdate, reference, datecollected, remarks, enteredby, entereddate, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [txn_type || null, contactid || null, ordermethod || null, walletused || null, stockist || null, selfpickup ? 1 : 0, transferdate, delivery_order_no || null, datecollected || null, remarks || null, enteredby || null]
    );
    const doid = hResult.insertId;

    for (const ln of lines) {
      const [lResult] = await conn.query(
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

      // Stock out: the unit's resting status depends on why it left.
      if (ln.serials && ln.serials.length > 0) {
        await serialModel.issueOnStockOut(
          {
            productid: ln.itemid,
            docType: "do",
            lineId: lResult.insertId,
            serials: ln.serials,
            enteredby,
            status: serialModel.DO_STATUS[txn_type] || "Transferred",
          },
          conn
        );
      }
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

const update = async (id, { txn_type, contactid, ordermethod, walletused, stockist, selfpickup, datecollected, transferdate, delivery_order_no, remarks }, lines) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE dohd
       SET transtype=?, contactid=?, ordermethod=?, walletused=?, stockist=?, selfpickup=?, transdate=?, reference=?, datecollected=?, remarks=?
       WHERE doid=? AND active=1`,
      [txn_type || null, contactid || null, ordermethod || null, walletused || null, stockist || null, selfpickup ? 1 : 0, transferdate, delivery_order_no || null, datecollected || null, remarks || null, id]
    );

    // Soft-delete existing lines then re-insert.
    // Serials are deliberately not re-processed on edit: the units already have
    // movement rows against the old lines, and re-issuing them would fail as
    // "already Sold". Correcting a serial is done from the serial record itself.
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

const updateCollectedDate = async (id, datecollected) => {
  await pool.query(
    `UPDATE dohd SET datecollected=? WHERE doid=? AND active=1`,
    [datecollected || null, id]
  );
};

const SUGGEST_FIELDS = ["ordermethod", "walletused", "stockist"];

const searchFieldValues = async (field, q) => {
  if (!SUGGEST_FIELDS.includes(field)) throw { status: 400, message: "Invalid field" };
  const col = `\`${field}\``;
  const [rows] = await pool.query(
    `SELECT DISTINCT ${col} AS value FROM dohd WHERE ${col} IS NOT NULL AND ${col} != '' AND ${col} LIKE ? ORDER BY ${col} ASC LIMIT 20`,
    [`%${q}%`]
  );
  return rows.map((r) => r.value);
};

const getTopCustomers = async () => {
  const [rows] = await pool.query(`
    SELECT c.customerid, c.name, c.username,
           COUNT(DISTINCT g.doid) AS do_count
    FROM dohd g
    JOIN customers c ON c.customerid = g.contactid
    WHERE g.active = 1 AND g.contactid IS NOT NULL
    GROUP BY c.customerid, c.name, c.username
    ORDER BY do_count DESC
    LIMIT 3
  `);
  return rows;
};

const getTopProducts = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.query("SET SESSION group_concat_max_len = 1000000");
    const [rows] = await conn.query(`
      SELECT p.productid,
             p.name AS product_name,
             SUM(gd.qty) AS total_qty,
             GROUP_CONCAT(DISTINCT g.contactid ORDER BY g.contactid SEPARATOR ',') AS customer_ids_csv
      FROM dodetails gd
      JOIN dohd g ON g.doid = gd.doid
      JOIN products p ON p.productid = gd.itemid
      WHERE g.active = 1 AND gd.active = 1
        AND gd.itemid IS NOT NULL AND g.contactid IS NOT NULL
      GROUP BY p.productid, p.name
      ORDER BY total_qty DESC
      LIMIT 3
    `);
    return rows.map((r) => ({
      productid:    r.productid,
      product_name: r.product_name,
      total_qty:    r.total_qty,
      customerIds:  r.customer_ids_csv ? r.customer_ids_csv.split(",").map(Number) : [],
    }));
  } finally {
    conn.release();
  }
};

module.exports = { searchCustomers, createCustomer, getList, getById, create, update, updateCollectedDate, searchFieldValues, getTopCustomers, getTopProducts };
