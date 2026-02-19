const pool = require("../config/db");

const getData = async () => {
  const query = "select * from package JOIN packagedetails ON package.packageid = packagedetails.packageid JOIN products ON packagedetails.productid=products.productid";
  const [rows] = await pool.query(query);

  const package = {};

  rows.forEach((item, index) => {
    if (!package[item.packageid]) {
      package[item.packageid] = {
        packageid: item.packageid,
        packagedesc: item.packagedesc,
        price: item.price,
        expiry_days: item.expiry_days,
        noofsession: item.noofsession,
        productInfo: [],
      };
    }

    package[item.packageid].productInfo.push({
      name: item.name,
      productcat: item.productcat,
      unitprice: item.unitprice,
      baseprice: item.baseprice,
      packageprice: item.packageprice,
      description: item.description,
    });
  });

  return Object.values(package);
};

const getCusPackageData = async (id) => {
  const query = "select * from custpackages JOIN package ON custpackages.packageid=package.packageid JOIN packagedetails ON package.packageid = packagedetails.packageid JOIN products ON packagedetails.productid=products.productid  WHERE customerid= ?";
  const [rows] = await pool.query(query, [id]);

  const package = {};

  rows.forEach((item, index) => {
    if (!package[item.packageid]) {
      package[item.packageid] = {
        custpackageid: item.custpackageid,
        packageid: item.packageid,
        packagedesc: item.packagedesc,
        price: 0,
        expiry_days: item.expiry_days,
        noofsession: item.noofsession,
        origSessions: item.origsessions,
        remainSessions: item.remainsessions,
        productInfo: [],
      };
    }

    const exists = package[item.packageid].productInfo.some((p) => p.productid === item.productid);
    if (!exists) {
      package[item.packageid].productInfo.push({
        name: item.name,
        productid: item.productid,
        productcat: item.productcat,
        unitprice: item.unitprice,
        baseprice: item.baseprice,
        packageprice: item.packageprice,
        description: item.description,
      });
    }
  });

  return Object.values(package);
};

const insertCusPackages = async (data, id) => {
  const { packageid, noofsession } = data;
  const query = "INSERT INTO custpackages (customerid,  packageid, purchase_date, expiry_date, origsessions, remainsessions) VALUES (?,?,?,?,?,?)";
  const [result] = await pool.query(query, [id, packageid, new Date(), new Date(), noofsession, noofsession]);
  return result.insertId;
};

const getCusPackageByPackageId = async (idPackage, idCustomer) => {
  const query = "select * from custpackages WHERE packageid= ? AND customerid = ?";
  const [rows] = await pool.query(query, [idPackage, idCustomer]);

  return rows;
};

const minDataCusPackages = async (id, remainingsession) => {
  const query = "UPDATE custpackages SET remainsessions = ? WHERE custpackageid = ?";
  const [result] = await pool.query(query, [remainingsession, id]);
  return result;
};

const updateCusPackagesRemainSession = async (exist, data) => {
  const { noofsession } = data;
  const { remainsessions, custpackageid } = exist[0];
  const newSession = remainsessions + noofsession;

  const query = "UPDATE custpackages SET remainsessions = ? WHERE custpackageid = ?";
  const [result] = await pool.query(query, [newSession, custpackageid]);
  return result;
};

// ─── Setup Management ─────────────────────────────────────────────────────────

/** All packages with all their detail lines (active + inactive) for the setup page */
const getPackageList = async () => {
  const [pkgs] = await pool.query(
    `SELECT packageid, packagedesc, price, expiry_days, noofsession FROM package ORDER BY packageid`
  );
  if (pkgs.length === 0) return [];

  const ids = pkgs.map((p) => p.packageid);
  const [details] = await pool.query(
    `SELECT pd.packagedetailsid, pd.packageid, pd.productid, pd.consumeprice, pd.active,
            pr.name AS product_name, pr.productcat
     FROM packagedetails pd
     JOIN products pr ON pr.productid = pd.productid
     WHERE pd.packageid IN (?)
     ORDER BY pd.packagedetailsid`,
    [ids]
  );

  return pkgs.map((pkg) => ({
    ...pkg,
    details: details.filter((d) => d.packageid === pkg.packageid),
  }));
};

/** Create package header + detail lines in one transaction */
const createPackage = async (data, userId) => {
  const { packagedesc, price, expiry_days, noofsession, details = [] } = data;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [res] = await conn.query(
      `INSERT INTO package (packagedesc, price, expiry_days, noofsession) VALUES (?, ?, ?, ?)`,
      [packagedesc, price || 0, expiry_days || null, noofsession || null]
    );
    const newId = res.insertId;
    for (const d of details) {
      await conn.query(
        `INSERT INTO packagedetails (packageid, productid, consumeprice, enteredby, entereddate, active)
         VALUES (?, ?, ?, ?, NOW(), 1)`,
        [newId, d.productid, d.consumeprice || 0, userId]
      );
    }
    await conn.commit();
    return newId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/** Update package header fields */
const updatePackage = async (id, data) => {
  const { packagedesc, price, expiry_days, noofsession } = data;
  await pool.query(
    `UPDATE package SET packagedesc=?, price=?, expiry_days=?, noofsession=? WHERE packageid=?`,
    [packagedesc, price || 0, expiry_days || null, noofsession || null, id]
  );
};

/** Add one detail line to an existing package */
const addPackageDetail = async (packageId, data, userId) => {
  const { productid, consumeprice } = data;
  const [res] = await pool.query(
    `INSERT INTO packagedetails (packageid, productid, consumeprice, enteredby, entereddate, active)
     VALUES (?, ?, ?, ?, NOW(), 1)`,
    [packageId, productid, consumeprice || 0, userId]
  );
  return res.insertId;
};

/** Update consume price of an existing detail line */
const updatePackageDetail = async (detailId, data, userId) => {
  await pool.query(
    `UPDATE packagedetails SET consumeprice=?, editedby=?, editeddate=NOW() WHERE packagedetailsid=?`,
    [data.consumeprice || 0, userId, detailId]
  );
};

/** Soft-delete a detail line (active = 0) */
const deactivatePackageDetail = async (detailId) => {
  await pool.query(
    `UPDATE packagedetails SET active=0 WHERE packagedetailsid=?`,
    [detailId]
  );
};

/** Customer package usage — all customers or filtered by package */
const getCustomerPackageUsage = async ({ packageId = null, search = "" } = {}) => {
  const conditions = [];
  const params = [];
  if (packageId) { conditions.push("cp.packageid = ?"); params.push(packageId); }
  if (search) {
    conditions.push("(c.name LIKE ? OR pkg.packagedesc LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT cp.custpackageid, cp.customerid, cp.packageid,
            cp.purchase_date, cp.expiry_date,
            cp.origsessions, cp.remainsessions,
            (cp.origsessions - cp.remainsessions) AS used_sessions,
            c.name AS customer_name, c.email AS customer_email, c.contact_no,
            pkg.packagedesc, pkg.price AS package_price
     FROM custpackages cp
     JOIN customers c ON c.customerid = cp.customerid
     JOIN package pkg ON pkg.packageid = cp.packageid
     ${where}
     ORDER BY cp.purchase_date DESC`,
    params
  );
  return rows;
};

module.exports = {
  getData, insertCusPackages, getCusPackageData, minDataCusPackages,
  getCusPackageByPackageId, updateCusPackagesRemainSession,
  getPackageList, createPackage, updatePackage,
  addPackageDetail, updatePackageDetail, deactivatePackageDetail,
  getCustomerPackageUsage,
};
