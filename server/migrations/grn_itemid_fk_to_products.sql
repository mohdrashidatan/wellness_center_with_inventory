-- Drop FK from grndetails.itemid → product_sku.sku_id (if it exists)
-- Then re-add it pointing to products.productid
-- NOTE: Run this only once. Back up data first in production.

-- 1. Remove existing FK constraint (constraint name may vary — check with SHOW CREATE TABLE grndetails)
--    NOTE: MySQL does NOT support "DROP FOREIGN KEY IF EXISTS". Use plain DROP FOREIGN KEY <name>.
--    As of the initial migration run, grndetails had no FK on itemid, so this step was not needed.
--    If a FK named grndetails_ibfk_2 exists in your environment, uncomment and run the line below first:
-- ALTER TABLE grndetails DROP FOREIGN KEY grndetails_ibfk_2;

-- 2. Clear any existing rows whose itemid no longer maps to products.productid
--    (Safe in dev. In production, migrate values first.)
-- DELETE FROM grndetails WHERE itemid NOT IN (SELECT productid FROM products);

-- 3. Add new FK
ALTER TABLE grndetails
  ADD CONSTRAINT fk_grndetails_product
  FOREIGN KEY (itemid) REFERENCES products(productid);
