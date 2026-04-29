# GRN Product Lookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the GRN entry screen's item lookup from SKU-level (`product_sku.sku_id`) to product-level (`products.productid`), with the dropdown showing product name and description.

**Architecture:** The FK in `grndetails.itemid` is moved from `product_sku.sku_id` to `products.productid`. A new `/api/products/search` endpoint serves the typeahead. All backend queries that joined through `product_sku` are updated to join directly on `products`. The frontend replaces the SKU lookup with a product lookup throughout the GRN entry and detail view.

**Tech Stack:** Node.js/Express, MySQL2, React 18, Vite, TailwindCSS, Axios

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/migrations/grn_itemid_fk_to_products.sql` | Create | FK migration |
| `server/src/models/productsModel.js` | Modify | Add `searchProducts`, fix `getProductTransactions` |
| `server/src/controllers/productsController.js` | Modify | Add `searchProducts` handler |
| `server/src/routes/productsRoute.js` | Modify | Add `GET /search` route |
| `server/src/models/grnModel.js` | Modify | Update `getList` and `getById` joins |
| `client/src/services/grnService.js` | Modify | Replace `searchSku` with `searchProducts` |
| `client/src/pages/GrnEntryPage.jsx` | Modify | Update line state, lookup, display, payload |
| `client/src/components/grn/GrnDetailView.jsx` | Modify | Show `product_name`/`product_desc` instead of `sku_code`/`sku_name` |

---

## Task 1: Database Migration

**Files:**
- Create: `server/migrations/grn_itemid_fk_to_products.sql`

- [ ] **Step 1: Create the migration file**

Create `server/migrations/grn_itemid_fk_to_products.sql` with this content:

```sql
-- Drop FK from grndetails.itemid → product_sku.sku_id (if it exists)
-- Then re-add it pointing to products.productid
-- NOTE: Run this only once. Back up data first in production.

-- 1. Remove existing FK constraint (constraint name may vary — check with SHOW CREATE TABLE grndetails)
--    If the constraint does not exist the ALTER will fail harmlessly; comment it out.
ALTER TABLE grndetails DROP FOREIGN KEY IF EXISTS grndetails_ibfk_2;

-- 2. Clear any existing rows whose itemid no longer maps to products.productid
--    (Safe in dev. In production, migrate values first.)
-- DELETE FROM grndetails WHERE itemid NOT IN (SELECT productid FROM products);

-- 3. Add new FK
ALTER TABLE grndetails
  ADD CONSTRAINT fk_grndetails_product
  FOREIGN KEY (itemid) REFERENCES products(productid);
```

- [ ] **Step 2: Run the migration against your local DB**

```bash
mysql -u root -p db_name < server/migrations/grn_itemid_fk_to_products.sql
```

Expected: no errors. If you get "Can't DROP ... check that constraint exists", comment out the DROP line and re-run.

- [ ] **Step 3: Verify the FK**

```sql
SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'grndetails' AND COLUMN_NAME = 'itemid';
```

Expected: one row showing `REFERENCED_TABLE_NAME = products` and `REFERENCED_COLUMN_NAME = productid`.

- [ ] **Step 4: Commit**

```bash
git add server/migrations/grn_itemid_fk_to_products.sql
git commit -m "db: change grndetails.itemid FK from product_sku to products"
```

---

## Task 2: Add `searchProducts` to the model

**Files:**
- Modify: `server/src/models/productsModel.js`

- [ ] **Step 1: Add `searchProducts` function**

Open `server/src/models/productsModel.js`. Find the existing `searchSku` function (around line 37). Add the new function directly after it:

```js
const searchProducts = async (q) => {
  const [rows] = await pool.query(
    `SELECT productid, name, description
     FROM products
     WHERE active = 1
       AND (name LIKE ? OR description LIKE ?)
     ORDER BY name
     LIMIT 20`,
    [`%${q}%`, `%${q}%`]
  );
  return rows;
};
```

- [ ] **Step 2: Export `searchProducts`**

Find the `module.exports` line at the bottom of `server/src/models/productsModel.js`. Add `searchProducts` to the export:

```js
module.exports = {
  getData, searchSku, searchProducts, getProductList, getProductById, updateProduct,
  deactivateProduct, findByName, createProduct, getProductTransactions,
  getProductSkus,
  getVariantsByProduct, createVariantOption, updateVariantOption, deactivateVariantOption,
  addVariantValue, updateVariantValue, deactivateVariantValue,
};
```

- [ ] **Step 3: Manual smoke test via node REPL**

```bash
cd server
node -e "
const m = require('./src/models/productsModel');
m.searchProducts('oil').then(r => { console.log(r); process.exit(); });
"
```

Expected: array of product objects, each with `productid`, `name`, `description`.

- [ ] **Step 4: Commit**

```bash
git add server/src/models/productsModel.js
git commit -m "feat: add searchProducts model function"
```

---

## Task 3: Add `searchProducts` controller and route

**Files:**
- Modify: `server/src/controllers/productsController.js`
- Modify: `server/src/routes/productsRoute.js`

- [ ] **Step 1: Add the controller handler**

Open `server/src/controllers/productsController.js`. Find where `searchSku` is destructured from the model import (near the top). Add `searchProducts` to the same destructure:

```js
const {
  getData, searchSku, searchProducts, getProductList, getProductById, updateProduct,
  // ... rest of the existing destructure
} = require("../models/productsModel");
```

Then add the controller function. Place it right after the existing `searchSku` controller:

```js
const searchProductsHandler = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const rows = await searchProducts(q);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};
```

Add `searchProductsHandler` to `module.exports` at the bottom of the file.

- [ ] **Step 2: Add the route**

Open `server/src/routes/productsRoute.js`. Add the new route **before** `router.get("/:id", ...)` (so it isn't caught by the param route):

```js
router.get("/search", authenticateToken, searchProductsHandler);
```

Also add `searchProductsHandler` to the destructure at the top of the file:

```js
const {
  getProducts, searchSku, searchProductsHandler, getProductList, getProductById, updateProduct,
  // ... rest
} = require("../controllers/productsController");
```

- [ ] **Step 3: Start the server and test the endpoint**

```bash
cd server && npm run dev
```

In a second terminal (replace TOKEN with a valid JWT):

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3052/api/products/search?q=oil"
```

Expected: JSON array like `[{"productid":1,"name":"Lavender Oil","description":"..."}]`.

Empty query:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3052/api/products/search?q="
```
Expected: `[]`

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/productsController.js server/src/routes/productsRoute.js
git commit -m "feat: add GET /api/products/search endpoint"
```

---

## Task 4: Update `grnModel.js` — fix both queries

**Files:**
- Modify: `server/src/models/grnModel.js`

- [ ] **Step 1: Update `getList` item search subquery**

Open `server/src/models/grnModel.js`. Around line 14–18, replace the `itemSearch` subquery:

Old:
```js
conditions.push(
  "EXISTS (SELECT 1 FROM grndetails gd2 LEFT JOIN product_sku ps2 ON gd2.itemid = ps2.sku_id WHERE gd2.grnid = g.grnid AND gd2.active = 1 AND (ps2.sku_code LIKE ? OR ps2.sku_name LIKE ?))"
);
params.push(`%${itemSearch}%`, `%${itemSearch}%`);
```

New:
```js
conditions.push(
  "EXISTS (SELECT 1 FROM grndetails gd2 LEFT JOIN products p2 ON gd2.itemid = p2.productid WHERE gd2.grnid = g.grnid AND gd2.active = 1 AND (p2.name LIKE ? OR p2.description LIKE ?))"
);
params.push(`%${itemSearch}%`, `%${itemSearch}%`);
```

- [ ] **Step 2: Update `getById` lines query**

Around lines 95–108, replace the lines query:

Old:
```js
const [lines] = await pool.query(
  `SELECT
      gd.grnlineid,
      gd.qty,
      gd.uom,
      gd.consign,
      gd.remarks,
      ps.sku_code,
      ps.sku_name
   FROM grndetails gd
   LEFT JOIN product_sku ps ON gd.itemid = ps.sku_id
   WHERE gd.grnid = ? AND gd.active = 1
   ORDER BY gd.grnlineid`,
  [id]
);
```

New:
```js
const [lines] = await pool.query(
  `SELECT
      gd.grnlineid,
      gd.qty,
      gd.uom,
      gd.consign,
      gd.remarks,
      p.name        AS product_name,
      p.description AS product_desc
   FROM grndetails gd
   LEFT JOIN products p ON gd.itemid = p.productid
   WHERE gd.grnid = ? AND gd.active = 1
   ORDER BY gd.grnlineid`,
  [id]
);
```

- [ ] **Step 3: Verify with a quick request (server must be running)**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3052/api/grn/1"
```

Expected: `lines` array where each item has `product_name` and `product_desc` instead of `sku_code` / `sku_name`.

- [ ] **Step 4: Commit**

```bash
git add server/src/models/grnModel.js
git commit -m "feat: update grnModel to join products instead of product_sku"
```

---

## Task 5: Fix `getProductTransactions` in `productsModel.js`

**Files:**
- Modify: `server/src/models/productsModel.js`

- [ ] **Step 1: Update the GRN arm of the UNION query**

Open `server/src/models/productsModel.js`. Find `getProductTransactions` (around line 190). In the GRN `SELECT` inside the UNION, replace:

Old:
```sql
FROM grndetails gd
JOIN grnd g ON g.grnid = gd.grnid
LEFT JOIN contacts c ON c.contactid = g.contactid
JOIN product_sku ps ON ps.sku_id = gd.itemid
WHERE ps.productid = ?
```

New:
```sql
FROM grndetails gd
JOIN grnd g ON g.grnid = gd.grnid
LEFT JOIN contacts c ON c.contactid = g.contactid
WHERE gd.itemid = ?
```

The `params` array for this query has two positions before the search terms: `[productId, productId, ...]` (one for each SELECT in the UNION). The first positional param corresponds to the GRN arm. After the change, the GRN arm's `WHERE gd.itemid = ?` still uses the first `productId` — no change needed to the params array.

- [ ] **Step 2: Verify the product transactions endpoint**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3052/api/products/1/transactions"
```

Expected: array with `txn_type: "GRN"` entries (if any GRN rows exist for that productid) and `txn_type: "POS"` entries. No SQL errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/models/productsModel.js
git commit -m "fix: update getProductTransactions to join grndetails on products directly"
```

---

## Task 6: Update `grnService.js` on the client

**Files:**
- Modify: `client/src/services/grnService.js`

- [ ] **Step 1: Replace `searchSku` with `searchProducts`**

Open `client/src/services/grnService.js`. Replace the entire `searchSku` method:

Old:
```js
searchSku: async (q) => {
  const response = await api.get(
    `${API_BASE_URL}/api/products/sku/search?q=${encodeURIComponent(q)}`,
    authHeader()
  );
  return response.data;
},
```

New:
```js
searchProducts: async (q) => {
  const response = await api.get(
    `${API_BASE_URL}/api/products/search?q=${encodeURIComponent(q)}`,
    authHeader()
  );
  return response.data;
},
```

- [ ] **Step 2: Commit**

```bash
git add client/src/services/grnService.js
git commit -m "feat: replace searchSku with searchProducts in grnService"
```

---

## Task 7: Update `GrnEntryPage.jsx`

**Files:**
- Modify: `client/src/pages/GrnEntryPage.jsx`

- [ ] **Step 1: Update `emptyLine` helper**

Find the `emptyLine` function near the top of the file. Replace it entirely:

Old:
```js
const emptyLine = (consign = false) => ({
  _key:        Math.random().toString(36).slice(2),
  itemid:      "",
  sku_code:    "",
  sku_name:    "",
  qty:         "",
  uom:         "",
  base_uom:    "",
  consign,
  batch_no:    "",
  expiry_date: "",
  remarks:     "",
});
```

New:
```js
const emptyLine = (consign = false) => ({
  _key:         Math.random().toString(36).slice(2),
  productid:    "",
  product_name: "",
  product_desc: "",
  qty:          "",
  uom:          "",
  consign,
  batch_no:     "",
  expiry_date:  "",
  remarks:      "",
});
```

- [ ] **Step 2: Update `handleSkuSelect` → `handleProductSelect`**

Find `handleSkuSelect` and replace it entirely:

Old:
```js
const handleSkuSelect = (key, sku) => {
  setLines((prev) =>
    prev.map((l) =>
      l._key === key
        ? { ...l, itemid: sku.sku_id, sku_code: sku.sku_code, sku_name: sku.sku_name, uom: sku.base_uom_code || l.uom }
        : l
    )
  );
};
```

New:
```js
const handleProductSelect = (key, product) => {
  setLines((prev) =>
    prev.map((l) =>
      l._key === key
        ? { ...l, productid: product.productid, product_name: product.name, product_desc: product.description || "" }
        : l
    )
  );
};
```

- [ ] **Step 3: Update the Item Code column in the table**

Find the Item Code `<td>` inside the lines `map`. Replace it entirely:

Old:
```jsx
{/* Item code lookup */}
<td className="px-3 py-2">
  {ln.itemid ? (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs text-purple-700 font-semibold">{ln.sku_code}</span>
      <button onClick={() => updateLine(ln._key, "itemid", "") || updateLine(ln._key, "sku_code", "") || updateLine(ln._key, "sku_name", "")} className="text-red-400 text-xs">✕</button>
    </div>
  ) : (
    <LookupInput
      placeholder="Search SKU…"
      onSearch={grnService.searchSku}
      onSelect={(sku) => handleSkuSelect(ln._key, sku)}
      renderOption={(s) => (
        <div className="flex gap-2">
          <span className="font-mono text-purple-600 text-xs">{s.sku_code}</span>
          <span className="text-gray-600 truncate">{s.sku_name}</span>
        </div>
      )}
    />
  )}
</td>
```

New:
```jsx
{/* Product lookup */}
<td className="px-3 py-2">
  {ln.productid ? (
    <div className="flex items-center gap-1">
      <span className="text-xs text-purple-700 font-semibold truncate max-w-[120px]">{ln.product_name}</span>
      <button
        onClick={() => setLines((prev) =>
          prev.map((l) => l._key === ln._key
            ? { ...l, productid: "", product_name: "", product_desc: "" }
            : l
          )
        )}
        className="text-red-400 text-xs"
      >✕</button>
    </div>
  ) : (
    <LookupInput
      placeholder="Search product…"
      onSearch={grnService.searchProducts}
      onSelect={(p) => handleProductSelect(ln._key, p)}
      renderOption={(p) => (
        <div>
          <span className="font-medium text-gray-800">{p.name}</span>
          {p.description && (
            <span className="ml-2 text-gray-400 text-xs truncate">{p.description}</span>
          )}
        </div>
      )}
    />
  )}
</td>
```

- [ ] **Step 4: Update the Description column**

Find the Description `<td>` (the read-only auto-populated input). Update the `value` prop:

Old:
```jsx
<input
  value={ln.sku_name}
  readOnly
  ...
/>
```

New:
```jsx
<input
  value={ln.product_desc}
  readOnly
  ...
/>
```

- [ ] **Step 5: Update validation in `handleSave`**

Find the validation loop inside `handleSave`. Replace the `itemid` check:

Old:
```js
if (!lines[i].itemid) { toast.error(`Line ${i + 1}: Item code is required`); return; }
```

New:
```js
if (!lines[i].productid) { toast.error(`Line ${i + 1}: Item is required`); return; }
```

- [ ] **Step 6: Update the payload in `handleSave`**

Find the `lines.map` inside the `grnService.create` call. Update `itemid`:

Old:
```js
lines: lines.map((l) => ({
  itemid:      l.itemid,
  qty:         parseFloat(l.qty),
  uom:         l.uom,
  consign:     l.consign ? 1 : 0,
  remarks:     l.remarks,
  batch_no:    l.batch_no,
  expiry_date: l.expiry_date || null,
})),
```

New:
```js
lines: lines.map((l) => ({
  itemid:      l.productid,
  qty:         parseFloat(l.qty),
  uom:         l.uom,
  consign:     l.consign ? 1 : 0,
  remarks:     l.remarks,
  batch_no:    l.batch_no,
  expiry_date: l.expiry_date || null,
})),
```

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/GrnEntryPage.jsx
git commit -m "feat: update GrnEntryPage to use product lookup instead of SKU lookup"
```

---

## Task 8: Update `GrnDetailView.jsx`

**Files:**
- Modify: `client/src/components/grn/GrnDetailView.jsx`

- [ ] **Step 1: Update Item Code cell**

Find line 95 in `GrnDetailView.jsx`:

Old:
```jsx
<TableCell className="font-mono">{ln.sku_code || "—"}</TableCell>
```

New:
```jsx
<TableCell>{ln.product_name || "—"}</TableCell>
```

- [ ] **Step 2: Update Item Name cell**

Find line 96:

Old:
```jsx
<TableCell>{ln.sku_name || "—"}</TableCell>
```

New:
```jsx
<TableCell className="text-gray-500 text-xs">{ln.product_desc || "—"}</TableCell>
```

Also update the column header (line 77) from "Item Name" to "Description" to match:

Old:
```jsx
<TableHead>Item Name</TableHead>
```

New:
```jsx
<TableHead>Description</TableHead>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/grn/GrnDetailView.jsx
git commit -m "feat: update GrnDetailView to show product_name and product_desc"
```

---

## Task 9: End-to-End Smoke Test

- [ ] **Step 1: Start both servers**

Terminal 1:
```bash
cd server && npm run dev
```

Terminal 2:
```bash
cd client && npm run dev
```

- [ ] **Step 2: Test the GRN entry flow**

1. Log in as a Therapist and navigate to **New Goods Received Note** (`/therapist/stocks/incoming/new` or equivalent)
2. In the Received Items table, click the Item Code field on line 1
3. Type a partial product name (e.g., first 3 letters of a known product)
4. Verify the dropdown shows product **name** (bold) and **description** (grey, smaller)
5. Select a product — verify:
   - Item Code column shows the product name
   - Description column auto-fills with the product description
   - The `✕` button clears the selection
6. Fill in Qty and save the GRN
7. Navigate to the GRN list, open the saved GRN
8. Verify the detail view shows `product_name` in the "Item Code" column and `product_desc` in the "Description" column

- [ ] **Step 3: Test validation**

1. Add a line but don't select a product
2. Click Save GRN — verify toast: "Line 1: Item is required"

- [ ] **Step 4: Test the GRN list item search (if search filter exists on the list page)**

1. On the GRN list, search by a known product name
2. Verify matching GRNs appear

---

## Self-Review Notes

- All 8 files in the File Map have a corresponding task ✓
- `searchProductsHandler` is exported from controller and imported in route ✓
- `product_name` / `product_desc` field names are consistent across Tasks 4, 7, 8 ✓
- `handleProductSelect` is defined in Task 7 before it is used in the JSX ✓
- The params array in `getProductTransactions` (Task 5) does not need changing because the GRN arm still receives one positional `productid` param ✓
- The `itemid` column name in `grndetails` is **not renamed** — only the FK target changes — so the INSERT in `grnModel.js` `create` needs no change ✓
