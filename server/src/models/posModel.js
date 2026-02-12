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

module.exports = { addPosHd, addPosLine, getPosHdCusData, getPosLineCusData };
