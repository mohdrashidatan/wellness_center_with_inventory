const pool = require("../config/db");

const addPosHd = async (data, userId) => {
  const { paymentMethod, receiptOption, totalPrice, email, customerId, therapistId } = data.formPaymentData;
  const { walkinName, walkinEmail, walkinContact } = data.formWalkinData;
  const discprint = data.discountShow;
  const query = "INSERT INTO poshd (transdate,  total_amount, payment_method, customerId, therapist_id,walkinname, walkinemail, walkincontactno,printdisc, enteredby, entereddate) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
  const [result] = await pool.query(query, [new Date(), totalPrice, paymentMethod, customerId, therapistId, walkinName, walkinEmail, walkinContact, discprint, userId, new Date()]);
  return result.insertId;
};

const addPosLine = async (idPosHd, item, userId, itemId, packagecheck) => {
  const { name, price, amount, type, discount, discpercent, subPrice } = item;

  console.log("item", item);
  const query = "INSERT INTO poslines (posid, itemid, productcat,qty, unit_price, total_price,disc,discpercent, package,oriprice, enteredby, entereddate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
  const [result] = await pool.query(query, [idPosHd, itemId, type || "Package", amount, price, subPrice, discount, discpercent, packagecheck, price * amount, userId, new Date()]);
  return result.insertId;
};

const getPosHdCusData = async (id) => {
  const query = `SELECT * FROM poshd WHERE customerid = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows;
};

const getPosLineCusData = async (id) => {
  const query = `SELECT * ,
    total_price AS subPrice, qty AS amount, oriprice AS price, disc AS discount FROM poslines JOIN poshd ON poslines.posid = poshd.posid JOIN products ON poslines.itemid=products.productid LEFT JOIN package on poslines.itemid=package.packageid WHERE poslines.posid = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows;
};

// ─── Sales Report ─────────────────────────────────────────────────────────────

const getSalesHeaders = async ({ search = "", dateFrom = "", dateTo = "", page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(`(COALESCE(c.name, h.walkinname) LIKE ? OR h.posid LIKE ? OR h.payment_method LIKE ?)`);
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (dateFrom) { conditions.push(`DATE(h.transdate) >= ?`); params.push(dateFrom); }
  if (dateTo)   { conditions.push(`DATE(h.transdate) <= ?`); params.push(dateTo); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT h.posid, h.transdate, h.total_amount, h.payment_method, h.remarks,
            h.walkin, h.walkinname, h.walkincontactno,
            COALESCE(c.name, h.walkinname) AS customer_name,
            COALESCE(c.contact_no, h.walkincontactno) AS contact_no,
            t.therapistname AS therapist_name
     FROM poshd h
     LEFT JOIN customers c ON c.customerid = h.customerid
     LEFT JOIN therapists t ON t.therapistsid = h.therapist_id
     ${where}
     ORDER BY h.transdate DESC, h.posid DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM poshd h
     LEFT JOIN customers c ON c.customerid = h.customerid
     LEFT JOIN therapists t ON t.therapistsid = h.therapist_id
     ${where}`,
    params
  );

  return { rows, total };
};

const getSalesDetails = async ({ search = "", dateFrom = "", dateTo = "", posid = "", page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(`(COALESCE(p.name, pk.packagedesc) LIKE ? OR h.posid LIKE ?)`);
    const like = `%${search}%`;
    params.push(like, like);
  }
  if (posid)    { conditions.push(`h.posid = ?`); params.push(posid); }
  if (dateFrom) { conditions.push(`DATE(h.transdate) >= ?`); params.push(dateFrom); }
  if (dateTo)   { conditions.push(`DATE(h.transdate) <= ?`); params.push(dateTo); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT l.poslinesid, l.posid, h.transdate,
            l.productcat, l.itemid,
            COALESCE(p.name, pk.packagedesc) AS item_name,
            l.qty, l.unit_price, l.disc, l.discpercent, l.total_price, l.oriprice, l.remarks,
            COALESCE(c.name, h.walkinname) AS customer_name
     FROM poslines l
     JOIN poshd h ON h.posid = l.posid
     LEFT JOIN products p ON p.productid = l.itemid AND l.productcat IN ('Product','Service')
     LEFT JOIN package pk ON pk.packageid = l.itemid AND l.productcat = 'Package'
     LEFT JOIN customers c ON c.customerid = h.customerid
     ${where}
     ORDER BY h.transdate DESC, l.posid DESC, l.poslinesid
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM poslines l
     JOIN poshd h ON h.posid = l.posid
     LEFT JOIN products p ON p.productid = l.itemid AND l.productcat IN ('Product','Service')
     LEFT JOIN package pk ON pk.packageid = l.itemid AND l.productcat = 'Package'
     LEFT JOIN customers c ON c.customerid = h.customerid
     ${where}`,
    params
  );

  return { rows, total };
};

module.exports = { addPosHd, addPosLine, getPosHdCusData, getPosLineCusData, getSalesHeaders, getSalesDetails };
