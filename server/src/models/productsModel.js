const pool = require("../config/db");
const getData = async () => {
  const [row] = await pool.query(
    `SELECT p.productid, p.name, p.productcat, p.unitprice, p.baseprice,
            p.packageprice, p.description, p.active,
            pm.is_variant_enabled, pm.is_stock_item, pm.is_serialized, pm.is_batch_tracked
     FROM products p
     LEFT JOIN product_master pm ON pm.productid = p.productid
     WHERE p.active = 1`
  );
  return row;
};

const getProductSkus = async (productId) => {
  const [skus] = await pool.query(
    `SELECT ps.sku_id, ps.sku_code, ps.sku_name, ps.unitprice, ps.baseprice, ps.packageprice
     FROM product_sku ps
     WHERE ps.productid = ? AND ps.is_active = 1`,
    [productId]
  );
  if (skus.length === 0) return [];

  const skuIds = skus.map((s) => s.sku_id);
  const [values] = await pool.query(
    `SELECT psv.sku_id, psv.value_id
     FROM product_sku_value psv
     WHERE psv.sku_id IN (?)`,
    [skuIds]
  );

  return skus.map((sku) => ({
    ...sku,
    value_ids: values.filter((v) => v.sku_id === sku.sku_id).map((v) => v.value_id),
  }));
};

const searchSku = async (q) => {
  const [rows] = await pool.query(
    `SELECT ps.sku_id, ps.sku_code, ps.sku_name, ps.unitprice,
            u.code AS base_uom_code
     FROM product_sku ps
     LEFT JOIN product_master pm ON pm.productid = ps.productid
     LEFT JOIN uom u ON u.uom_id = pm.base_uom_id
     WHERE ps.is_active = 1
       AND (ps.sku_code LIKE ? OR ps.sku_name LIKE ?)
     ORDER BY ps.sku_code
     LIMIT 20`,
    [`%${q}%`, `%${q}%`]
  );
  return rows;
};

const searchProducts = async (q) => {
  const [rows] = await pool.query(
    `SELECT p.productid, p.name, p.description, u.code AS base_uom_code
     FROM products p
     LEFT JOIN product_master pm ON pm.productid = p.productid
     LEFT JOIN uom u ON u.uom_id = pm.base_uom_id
     WHERE p.active = 1
       AND (p.name LIKE ? OR p.description LIKE ?)
     ORDER BY p.name
     LIMIT 20`,
    [`%${q}%`, `%${q}%`]
  );
  return rows;
};

const getProductList = async ({ search = "", page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const like = `%${search}%`;
  const params = [like, like, like, limit, offset];

  const [rows] = await pool.query(
    `SELECT p.productid, p.name, p.productcat, p.unitprice, p.baseprice,
            p.packageprice, p.description, p.active,
            u.code AS base_uom_code, u.name AS base_uom_name,
            pm.is_stock_item, pm.is_variant_enabled, pm.is_serialized, pm.is_batch_tracked,
            COALESCE(grn.qty_in, 0) - COALESCE(pos.qty_out, 0) - COALESCE(doq.qty_out, 0) AS qty_on_hand
     FROM products p
     LEFT JOIN product_master pm ON pm.productid = p.productid
     LEFT JOIN uom u ON u.uom_id = pm.base_uom_id
     LEFT JOIN (SELECT itemid, SUM(qty) AS qty_in  FROM grndetails GROUP BY itemid) grn ON grn.itemid = p.productid
     LEFT JOIN (SELECT itemid, SUM(qty) AS qty_out FROM poslines   GROUP BY itemid) pos ON pos.itemid = p.productid
     LEFT JOIN (SELECT itemid, SUM(qty) AS qty_out FROM dodetails  GROUP BY itemid) doq ON doq.itemid = p.productid
     WHERE (p.name LIKE ? OR p.productcat LIKE ? OR u.code LIKE ?)
     ORDER BY p.name
     LIMIT ? OFFSET ?`,
    params
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM products p
     LEFT JOIN product_master pm ON pm.productid = p.productid
     LEFT JOIN uom u ON u.uom_id = pm.base_uom_id
     WHERE (p.name LIKE ? OR p.productcat LIKE ? OR u.code LIKE ?)`,
    [like, like, like]
  );

  return { rows, total };
};

const getProductById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT p.productid, p.name, p.productcat, p.unitprice, p.baseprice,
            p.packageprice, p.description, p.active,
            p.enteredby, p.entereddate, p.editedby, p.editeddate,
            u.code AS base_uom_code, u.name AS base_uom_name,
            pm.is_stock_item, pm.is_variant_enabled, pm.is_serialized, pm.is_batch_tracked
     FROM products p
     LEFT JOIN product_master pm ON pm.productid = p.productid
     LEFT JOIN uom u ON u.uom_id = pm.base_uom_id
     WHERE p.productid = ?`,
    [id]
  );
  return row || null;
};

const updateProduct = async (id, data) => {
  const {
    name, productcat, unitprice, baseprice, packageprice, description,
    base_uom_id, is_stock_item, is_variant_enabled, is_serialized, is_batch_tracked,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE products
       SET name=?, productcat=?, unitprice=?, baseprice=?, packageprice=?,
           description=?, editeddate=NOW()
       WHERE productid=?`,
      [name, productcat, unitprice, baseprice, packageprice, description, id]
    );

    // upsert product_master
    await conn.query(
      `INSERT INTO product_master (productid, base_uom_id, is_stock_item, is_variant_enabled, is_serialized, is_batch_tracked)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         base_uom_id=VALUES(base_uom_id),
         is_stock_item=VALUES(is_stock_item),
         is_variant_enabled=VALUES(is_variant_enabled),
         is_serialized=VALUES(is_serialized),
         is_batch_tracked=VALUES(is_batch_tracked)`,
      [id, base_uom_id || null, is_stock_item ? 1 : 0, is_variant_enabled ? 1 : 0,
       is_serialized ? 1 : 0, is_batch_tracked ? 1 : 0]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const deactivateProduct = async (id) => {
  await pool.query(`UPDATE products SET active=0 WHERE productid=?`, [id]);
};

const findByName = async (name, excludeId = null) => {
  const query = excludeId
    ? `SELECT productid FROM products WHERE LOWER(name) = LOWER(?) AND productid <> ?`
    : `SELECT productid FROM products WHERE LOWER(name) = LOWER(?)`;
  const params = excludeId ? [name, excludeId] : [name];
  const [[row]] = await pool.query(query, params);
  return row || null;
};

const createProduct = async (data) => {
  const {
    name, productcat, unitprice, baseprice, packageprice, description,
    base_uom_id, is_stock_item, is_variant_enabled, is_serialized, is_batch_tracked,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO products (name, productcat, unitprice, baseprice, packageprice, description, active, entereddate)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [name, productcat || "Product", unitprice || null, baseprice || null, packageprice || null, description || null]
    );
    const newId = result.insertId;

    if (base_uom_id) {
      await conn.query(
        `INSERT INTO product_master (productid, base_uom_id, is_stock_item, is_variant_enabled, is_serialized, is_batch_tracked)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId, base_uom_id, is_stock_item ? 1 : 0, is_variant_enabled ? 1 : 0,
         is_serialized ? 1 : 0, is_batch_tracked ? 1 : 0]
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

const getProductTransactions = async (productId, { search = "", type = "", dateFrom = "", dateTo = "" } = {}) => {
  const likeSearch = `%${search}%`;

  // Build date filter condition (same column alias txn_date used in outer query)
  const dateConditions = [];
  const dateParams = [];
  if (dateFrom) { dateConditions.push("txn_date >= ?"); dateParams.push(dateFrom); }
  if (dateTo)   { dateConditions.push("txn_date <= ?"); dateParams.push(dateTo + " 23:59:59"); }

  const dateWhere = dateConditions.length ? `AND ${dateConditions.join(" AND ")}` : "";
  const typeWhere = type === "GRN" ? "AND txn_type = 'GRN'"
                  : type === "POS" ? "AND txn_type = 'POS'"
                  : type === "DO"  ? "AND txn_type = 'DO'"
                  : "";

  const sql = `
    SELECT * FROM (
      SELECT
        'GRN'                                           AS txn_type,
        CONCAT('GRN-', LPAD(g.grnid, 5, '0'))          AS ref_no,
        g.receiptdate                                   AS txn_date,
        gd.qty,
        gd.uom,
        NULL                                            AS unit_price,
        NULL                                            AS total_price,
        COALESCE(c.display_name, '')                   AS party,
        COALESCE(gd.remarks, '')                        AS remarks,
        g.grnid                                         AS ref_id
      FROM grndetails gd
      JOIN grnhd g ON g.grnid = gd.grnid
      LEFT JOIN contacts c ON c.contactid = g.contactid
      WHERE gd.itemid = ?

      UNION ALL

      SELECT
        'POS'                                           AS txn_type,
        CONCAT('POS-', LPAD(h.posid, 5, '0'))           AS ref_no,
        h.transdate                                     AS txn_date,
        -pl.qty                                         AS qty,
        NULL                                            AS uom,
        pl.unit_price,
        pl.total_price,
        COALESCE(cust.name, h.walkinname, '')           AS party,
        COALESCE(pl.remarks, '')                        AS remarks,
        h.posid                                         AS ref_id
      FROM poslines pl
      JOIN poshd h ON h.posid = pl.posid
      LEFT JOIN customers cust ON cust.customerid = h.customerid
      WHERE pl.itemid = ?

      UNION ALL

      SELECT
        'DO'                                            AS txn_type,
        CONCAT('DO-', LPAD(h.doid, 5, '0'))            AS ref_no,
        h.transdate                                     AS txn_date,
        -dd.qty                                         AS qty,
        dd.uom,
        NULL                                            AS unit_price,
        NULL                                            AS total_price,
        COALESCE(c.display_name, '')                   AS party,
        COALESCE(dd.remarks, '')                        AS remarks,
        h.doid                                          AS ref_id
      FROM dodetails dd
      JOIN dohd h ON h.doid = dd.doid
      LEFT JOIN contacts c ON c.contactid = h.contactid
      WHERE dd.itemid = ?
    ) AS txns
    WHERE (ref_no LIKE ? OR party LIKE ? OR remarks LIKE ?)
    ${typeWhere}
    ${dateWhere}
    ORDER BY txn_date DESC
  `;

  const params = [productId, productId, productId, likeSearch, likeSearch, likeSearch, ...dateParams];
  const [rows] = await pool.query(sql, params);
  return rows;
};

// ─── Variants ─────────────────────────────────────────────────────────────────

const getVariantsByProduct = async (productId) => {
  const [options] = await pool.query(
    `SELECT option_id, option_name, sort_order, is_active
     FROM variant_option
     WHERE productid = ?
     ORDER BY sort_order, option_name`,
    [productId]
  );
  if (options.length === 0) return [];

  const optionIds = options.map((o) => o.option_id);
  const [values] = await pool.query(
    `SELECT value_id, option_id, value_name, sort_order, is_active
     FROM variant_option_value
     WHERE option_id IN (?)
     ORDER BY sort_order, value_name`,
    [optionIds]
  );

  return options.map((opt) => ({
    ...opt,
    values: values.filter((v) => v.option_id === opt.option_id),
  }));
};

const createVariantOption = async (productId, { option_name, sort_order = 0 }) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query(
      `INSERT INTO variant_option (productid, option_name, sort_order, is_active)
       VALUES (?, ?, ?, 1)`,
      [productId, option_name.trim(), sort_order]
    );
    return result.insertId;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      const e = new Error("An option with this name already exists for this product");
      e.code = "DUPLICATE_ENTRY";
      throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
};

const updateVariantOption = async (optionId, { option_name, sort_order }) => {
  await pool.query(
    `UPDATE variant_option SET option_name=?, sort_order=? WHERE option_id=?`,
    [option_name.trim(), sort_order ?? 0, optionId]
  );
};

const getOptionUsageCount = async (optionId) => {
  const [[{ cnt }]] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM product_sku_value psv
     JOIN variant_option_value vov ON vov.value_id = psv.value_id
     WHERE vov.option_id = ?`,
    [optionId]
  );
  return cnt;
};

const deactivateVariantOption = async (optionId) => {
  const usageCount = await getOptionUsageCount(optionId);
  if (usageCount > 0) {
    const err = new Error("Option is used by existing SKUs and cannot be removed");
    err.code = "IN_USE";
    throw err;
  }
  await pool.query(`UPDATE variant_option SET is_active=0 WHERE option_id=?`, [optionId]);
};

const addVariantValue = async (optionId, { value_name, sort_order = 0 }) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO variant_option_value (option_id, value_name, sort_order, is_active)
       VALUES (?, ?, ?, 1)`,
      [optionId, value_name.trim(), sort_order]
    );
    return result.insertId;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      const e = new Error("A value with this name already exists for this option");
      e.code = "DUPLICATE_ENTRY";
      throw e;
    }
    throw err;
  }
};

const updateVariantValue = async (valueId, { value_name, sort_order }) => {
  await pool.query(
    `UPDATE variant_option_value SET value_name=?, sort_order=? WHERE value_id=?`,
    [value_name.trim(), sort_order ?? 0, valueId]
  );
};

const getValueUsageCount = async (valueId) => {
  const [[{ cnt }]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM product_sku_value WHERE value_id=?`,
    [valueId]
  );
  return cnt;
};

const deactivateVariantValue = async (valueId) => {
  const usageCount = await getValueUsageCount(valueId);
  if (usageCount > 0) {
    const err = new Error("Value is used by existing SKUs and cannot be removed");
    err.code = "IN_USE";
    throw err;
  }
  await pool.query(`UPDATE variant_option_value SET is_active=0 WHERE value_id=?`, [valueId]);
};

module.exports = {
  getData, searchSku, searchProducts, getProductList, getProductById, updateProduct,
  deactivateProduct, findByName, createProduct, getProductTransactions,
  getProductSkus,
  getVariantsByProduct, createVariantOption, updateVariantOption, deactivateVariantOption,
  addVariantValue, updateVariantValue, deactivateVariantValue,
};
