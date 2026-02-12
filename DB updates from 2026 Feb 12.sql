ALTER TABLE `pwg_new`.`userac` 
ADD COLUMN `active` BIT NOT NULL DEFAULT 1 AFTER `role`,
CHANGE COLUMN `role` `role` ENUM('Customer', 'Therapist', 'Admin') NULL DEFAULT NULL ;

CREATE TABLE `grnd` (
  `grnid` int NOT NULL AUTO_INCREMENT,
  `contactid` int DEFAULT NULL,
  `receiptdate` datetime DEFAULT NULL,
  `remarks` text,
  `printed` tinyint DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`grnid`),
  KEY `contactid` (`contactid`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `grndetails` (
  `grnlineid` int NOT NULL AUTO_INCREMENT,
  `grnid` int DEFAULT NULL,
  `itemid` int DEFAULT NULL,
  `qty` int NOT NULL DEFAULT '0',
  `uom` varchar(10),
  `consign` tinyint(1) DEFAULT '0',
  `remarks` varchar(40) DEFAULT NULL,
  `enteredby` int DEFAULT NULL,
  `entereddate` datetime DEFAULT NULL,
  `editedby` int DEFAULT NULL,
  `editeddate` datetime DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`grnlineid`),
  KEY `grnid` (`grnid`)
) ENGINE=InnoDB AUTO_INCREMENT=200 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 1) UOM MASTER
-- =========================================================
CREATE TABLE uom (
  uom_id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(10) NOT NULL,          -- PCS, BOX, KG, G, ML, L, etc
  name VARCHAR(50) NOT NULL,          -- Pieces, Box, Kilogram, etc
  uom_type ENUM('quantity','weight','volume','length','other') DEFAULT 'quantity',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (uom_id),
  UNIQUE KEY uq_uom_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 2) PRODUCT EXTENSION (inventory-specific attributes)
--    1:1 with products
-- =========================================================
CREATE TABLE product_master (
  productid INT NOT NULL,                 -- FK to products.productid
  base_uom_id INT NOT NULL,               -- default stock ledger UOM
  is_stock_item TINYINT(1) NOT NULL DEFAULT 1,
  is_variant_enabled TINYINT(1) NOT NULL DEFAULT 0,

  -- optional inventory flags
  is_serialized TINYINT(1) NOT NULL DEFAULT 0,
  is_batch_tracked TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (productid),
  KEY idx_pm_base_uom (base_uom_id),
  CONSTRAINT fk_pm_product
    FOREIGN KEY (productid) REFERENCES products(productid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pm_base_uom
    FOREIGN KEY (base_uom_id) REFERENCES uom(uom_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 3) PRODUCT UOM CONVERSION
--    Define how each sellable UOM converts to base UOM.
--    Example: 1 BOX = 12 PCS (base)
-- =========================================================
CREATE TABLE product_uom (
  product_uom_id INT NOT NULL AUTO_INCREMENT,
  productid INT NOT NULL,
  uom_id INT NOT NULL,

  -- Multiply qty in this UOM by factor_to_base to get base UOM qty
  factor_to_base DECIMAL(18,6) NOT NULL DEFAULT 1.000000,

  -- Optional: price override per UOM (if null, use variant/base price logic)
  uom_price DECIMAL(19,4) DEFAULT NULL,

  is_default_sell_uom TINYINT(1) NOT NULL DEFAULT 0,
  is_default_purchase_uom TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,

  PRIMARY KEY (product_uom_id),
  UNIQUE KEY uq_product_uom (productid, uom_id),
  KEY idx_product_uom_product (productid),
  KEY idx_product_uom_uom (uom_id),

  CONSTRAINT fk_pu_product
    FOREIGN KEY (productid) REFERENCES products(productid)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pu_uom
    FOREIGN KEY (uom_id) REFERENCES uom(uom_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_factor_to_base
    CHECK (factor_to_base > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 4) VARIANT DEFINITIONS (attributes like Size, Color)
-- =========================================================
CREATE TABLE variant_option (
  option_id INT NOT NULL AUTO_INCREMENT,
  productid INT NOT NULL,
  option_name VARCHAR(50) NOT NULL,       -- e.g. Size, Color, Material
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (option_id),
  UNIQUE KEY uq_variant_option (productid, option_name),
  KEY idx_vo_product (productid),
  CONSTRAINT fk_vo_product
    FOREIGN KEY (productid) REFERENCES products(productid)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE variant_option_value (
  value_id INT NOT NULL AUTO_INCREMENT,
  option_id INT NOT NULL,
  value_name VARCHAR(50) NOT NULL,        -- e.g. S, M, L / Red, Blue
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (value_id),
  UNIQUE KEY uq_option_value (option_id, value_name),
  KEY idx_vov_option (option_id),
  CONSTRAINT fk_vov_option
    FOREIGN KEY (option_id) REFERENCES variant_option(option_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 5) SELLABLE SKU (variant item)
--    Each row is a SKU for the product.
-- =========================================================
CREATE TABLE product_sku (
  sku_id INT NOT NULL AUTO_INCREMENT,
  productid INT NOT NULL,
  sku_code VARCHAR(64) NOT NULL,          -- unique barcode/SKU
  sku_name VARCHAR(150) DEFAULT NULL,     -- optional display name

  -- pricing per SKU (recommended)
  unitprice DECIMAL(19,4) DEFAULT NULL,
  baseprice DECIMAL(19,4) DEFAULT NULL,
  packageprice DECIMAL(19,4) DEFAULT NULL,

  is_active TINYINT(1) NOT NULL DEFAULT 1,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (sku_id),
  UNIQUE KEY uq_sku_code (sku_code),
  KEY idx_sku_product (productid),
  CONSTRAINT fk_sku_product
    FOREIGN KEY (productid) REFERENCES products(productid)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =========================================================
-- 6) SKU -> option value mapping (what combination is this SKU)
--    Example SKU: Size=M + Color=Red
-- =========================================================
CREATE TABLE product_sku_value (
  sku_id INT NOT NULL,
  value_id INT NOT NULL,

  PRIMARY KEY (sku_id, value_id),
  KEY idx_psv_value (value_id),

  CONSTRAINT fk_psv_sku
    FOREIGN KEY (sku_id) REFERENCES product_sku(sku_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_psv_value
    FOREIGN KEY (value_id) REFERENCES variant_option_value(value_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;