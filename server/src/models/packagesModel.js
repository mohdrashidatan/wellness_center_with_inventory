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

module.exports = { getData, insertCusPackages, getCusPackageData, minDataCusPackages, getCusPackageByPackageId, updateCusPackagesRemainSession };
