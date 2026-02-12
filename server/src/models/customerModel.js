const pool = require("../config/db");

const getData = async () => {
  const query = "SELECT * FROM customers";
  const [rows] = await pool.query(query);
  return rows;
};

const getDataJoinInterest = async (id) => {
  const query = "SELECT * FROM customers LEFT JOIN customer_interests ON customers.customerid = customer_interests.customer_id LEFT JOIN products ON products.id = customer_interests.product_id WHERE customerid = ?";
  const [rows] = await pool.query(query, [id]);

  return rows;
};

const getDataById = async (id) => {
  const query = "SELECT * FROM customers WHERE customerid = ?";
  const [rows] = await pool.query(query, [id]);
  return rows;
};

const getCustomerByAccountId = async (id) => {
  const query = "SELECT * FROM customers WHERE account_id = ?";
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

const initiate = async (account_id) => {
  const query = `INSERT INTO customers (account_id) VALUES (?)`;
  await pool.query(query, [account_id]);
};

const insertCustomer = async (data, idaccount = 0, idUser2) => {
  console.log("boy");

  console.log(idaccount);
  const {
    name,
    email,
    contact_no,
    address,
    postalcode,
    country,
    referred_by,
    emergency_contact_name,
    emergency_contact_no,
    dateOfBirth,
    referred_other,
    editedby, // tambahan
  } = data;

  const query = `INSERT INTO customers (name, email, contact_no, address, postalcode, country, referred_by, emergency_contact_name, emergency_contact_no, registration_date, account_id, dateofbirth, referred_other, entereddate, enteredby) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

  const [result] = await pool.query(query, [name, email, contact_no, address, postalcode, country, referred_by, emergency_contact_name, emergency_contact_no, new Date(), idaccount, dateOfBirth, referred_other, new Date(), idUser2]);
  console.log("idd");
  console.log(result.insertId);
  return result.insertId;
};

const updateCustomer = async (updateData, id, idUser2) => {
  const {
    name,
    email,
    contact_no,
    address,
    password,
    postalcode,
    country,
    referred_by,
    other,
    emergency_contact_name,
    emergency_contact_no,
    dateOfBirth,
    referred_other,
    editedby, // tambahan
  } = updateData;

  console.log(updateData);

  const [result] = await pool.query(
    `UPDATE customers SET 
      name = ?, 
      email = ?, 
      contact_no = ?, 
      address = ?, 
      postalcode = ?, 
      country = ?, 
      referred_by = ?, 
      emergency_contact_name = ?, 
      emergency_contact_no = ?,
      dateofbirth=?,
      referred_other=?,
      editedby=?,
      editeddate=?
     WHERE customerid = ?`,
    [name, email, contact_no, address, postalcode, country, referred_by, emergency_contact_name, emergency_contact_no, dateOfBirth, referred_other, idUser2, new Date(), id]
  );

  return result.affectedRows > 0;
};

const customerInterests = async (idUser, idInterests) => {
  const query = "INSERT INTO customer_interests (customer_id, product_id) VALUES (?, ?)";
  await pool.query(query, [idUser, idInterests]);
};

const deleteCustomerInterests = async (id) => {
  const query = "DELETE FROM customer_interests WHERE customer_id = ?";
  await pool.query(query, [id]);
};

const findCustomerByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT customerid, email 
     FROM customers WHERE email = ? `,
    [email]
  );
  return rows[0];
};

module.exports = {
  getData,
  getDataById,
  initiate,
  updateCustomer,
  customerInterests,
  insertCustomer,
  deleteCustomerInterests,
  getCustomerByAccountId,
  findCustomerByEmail,
  getDataJoinInterest,
};
