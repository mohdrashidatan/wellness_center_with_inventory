# GRN Product Lookup — Design Spec
**Date:** 2026-04-29  
**Status:** Approved

## Overview

On the New Goods Received Note (GRN) entry screen, the Item Code field must look up the `products` table. The dropdown shows the product `name` and `description`. When the user selects a product, its `productid` is saved as the FK in `grndetails.itemid`.

Currently, `grndetails.itemid` references `product_sku.sku_id`. This spec changes that FK to reference `products.productid`.

---

## Database Migration

**File:** `server/migrations/grn_itemid_fk_to_products.sql`

- Drop the existing FK constraint on `grndetails.itemid` (references `product_sku.sku_id`)
- Add new FK constraint: `grndetails.itemid` → `products.productid`

> Note: If there are existing `grndetails` rows, the migration must handle existing `sku_id` values (which are now orphaned). Since this is a development environment and GRN data may not be in production, a `DELETE FROM grndetails` before altering is acceptable — confirm with team before running on production.

---

## Backend Changes

### 1. New product search endpoint

**File:** `server/src/models/productsModel.js`  
Add `searchProducts(q)`:
```sql
SELECT productid, name, description
FROM products
WHERE active = 1
  AND (name LIKE ? OR description LIKE ?)
ORDER BY name
LIMIT 20
```

**File:** `server/src/controllers/productsController.js`  
Add `searchProducts` handler that calls `productsModel.searchProducts(q)`.

**File:** `server/src/routes/productsRoute.js`  
Add: `router.get("/search", authenticateToken, searchProducts)`  
(Must be placed before `/:id` to avoid param conflict — already the pattern used for `/sku/search`.)

### 2. Update `grnModel.js`

Three query locations to update — replace `product_sku` join with `products` join:

**`getList` — item search subquery (line 16):**
```sql
-- Before
EXISTS (SELECT 1 FROM grndetails gd2
        LEFT JOIN product_sku ps2 ON gd2.itemid = ps2.sku_id
        WHERE gd2.grnid = g.grnid AND gd2.active = 1
          AND (ps2.sku_code LIKE ? OR ps2.sku_name LIKE ?))

-- After
EXISTS (SELECT 1 FROM grndetails gd2
        LEFT JOIN products p2 ON gd2.itemid = p2.productid
        WHERE gd2.grnid = g.grnid AND gd2.active = 1
          AND (p2.name LIKE ? OR p2.description LIKE ?))
```

**`getById` — lines query (line 95–108):**
```sql
-- Before
SELECT gd.grnlineid, gd.qty, gd.uom, gd.consign, gd.remarks,
       ps.sku_code, ps.sku_name
FROM grndetails gd
LEFT JOIN product_sku ps ON gd.itemid = ps.sku_id

-- After
SELECT gd.grnlineid, gd.qty, gd.uom, gd.consign, gd.remarks,
       p.name AS product_name, p.description AS product_desc
FROM grndetails gd
LEFT JOIN products p ON gd.itemid = p.productid
```

**`create` — INSERT (line 128):** No change to column name or structure — `itemid` still receives whatever value the caller passes; it will now receive a `productid`.

### 3. Update `productsModel.js` — `getProductTransactions`

The GRN arm currently: `grndetails → product_sku (sku_id) → products (productid = ?)`

Change to: `grndetails` joined directly to `products` on `productid`:
```sql
-- Before
FROM grndetails gd
JOIN grnd g ON g.grnid = gd.grnid
LEFT JOIN contacts c ON c.contactid = g.contactid
JOIN product_sku ps ON ps.sku_id = gd.itemid
WHERE ps.productid = ?

-- After
FROM grndetails gd
JOIN grnd g ON g.grnid = gd.grnid
LEFT JOIN contacts c ON c.contactid = g.contactid
WHERE gd.itemid = ?
```

---

## Frontend Changes

### 1. `client/src/services/grnService.js`

Rename `searchSku` → `searchProducts`. Change endpoint from `/api/products/sku/search` to `/api/products/search`:
```js
searchProducts: async (q) => {
  const response = await api.get(
    `${API_BASE_URL}/api/products/search?q=${encodeURIComponent(q)}`,
    authHeader()
  );
  return response.data;
},
```

### 2. `client/src/pages/GrnEntryPage.jsx`

**`emptyLine` helper:** Replace `itemid`, `sku_code`, `sku_name` with `productid`, `product_name`, `product_desc`:
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

**`handleSkuSelect` → `handleProductSelect`:** Store `productid`, `product_name`, `product_desc`.

**Item Code column — selected state:** Show `product_name` (was `sku_code`). Clear button resets `productid`, `product_name`, `product_desc`.

**Item Code column — lookup state:** Call `grnService.searchProducts`. `renderOption` shows:
```jsx
<div>
  <span className="font-medium">{p.name}</span>
  {p.description && (
    <span className="ml-2 text-gray-400 text-xs truncate">{p.description}</span>
  )}
</div>
```

**Description column:** Auto-fill from `product_desc` (was `sku_name`). Remains read-only.

**Validation in `handleSave`:** Check `!lines[i].productid` instead of `!lines[i].itemid`.

**Payload to `grnService.create`:** Send `itemid: l.productid` so the server column name stays unchanged.

**`GrnDetailView.jsx`:** Update to display `product_name` / `product_desc` instead of `sku_code` / `sku_name`.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `server/migrations/grn_itemid_fk_to_products.sql` | New — FK migration |
| `server/src/models/productsModel.js` | Add `searchProducts`, update `getProductTransactions` GRN arm |
| `server/src/controllers/productsController.js` | Add `searchProducts` handler |
| `server/src/routes/productsRoute.js` | Add `GET /search` route |
| `server/src/models/grnModel.js` | Update `getList` subquery, `getById` lines join |
| `client/src/services/grnService.js` | Rename + reroute `searchProducts` |
| `client/src/pages/GrnEntryPage.jsx` | Update line state, lookup, display, payload |
| `client/src/components/grn/GrnDetailView.jsx` | Update field names in display |

---

## Out of Scope

- No changes to GRN list page filters (the `itemSearch` param will now match product name/description instead of sku_code/sku_name — acceptable behavior change)
- No UI changes to the header section or other line fields
- No changes to how `uom` is handled (remains a free-text field on the line)
