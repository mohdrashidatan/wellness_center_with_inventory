import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Modal from "@/shared/Modal";
import SearchBar from "@/shared/SearchBar";
import { productsService } from "@/services/productsService";
import { uomService } from "@/services/uomService";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const ITEMS_PER_PAGE = 10;
const MAX_PAGE_BUTTONS = 5;

const fmt = (val) => (val == null ? "—" : val);
const fmtPrice = (val) => (val == null ? "—" : Number(val).toFixed(2));

const inputCls =
  "w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";
const labelCls = "block text-xs text-gray-500 mb-1";
const checkboxCls = "h-4 w-4 rounded border-gray-300 accent-gray-800 cursor-pointer";


// ─── Create Modal ─────────────────────────────────────────────────────────────
const emptyForm = {
  name: "",
  productcat: "Product",
  unitprice: "",
  baseprice: "",
  packageprice: "",
  description: "",
  base_uom_id: "",
  is_stock_item: true,
  is_variant_enabled: false,
  is_serialized: false,
  is_batch_tracked: false,
};

function ProductCreateModal({ uomList, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "name") setNameError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    setNameError("");
    try {
      await onSave(form);
    } catch (err) {
      if (err?.response?.status === 409) {
        setNameError("A product with this name already exists.");
      } else {
        toast.error("Failed to create product");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input
              className={`${inputCls} ${nameError ? "border-red-400 focus:ring-red-400" : ""}`}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select
              className={inputCls}
              value={form.productcat}
              onChange={(e) => set("productcat", e.target.value)}>
              <option value="Product">Product</option>
              <option value="Service">Service</option>
            </select>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Unit Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.unitprice}
              onChange={(e) => set("unitprice", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Base Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.baseprice}
              onChange={(e) => set("baseprice", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Package Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.packageprice}
              onChange={(e) => set("packageprice", e.target.value)}
            />
          </div>
        </div>

        {/* Base UOM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Base UOM</label>
            <select
              className={inputCls}
              value={form.base_uom_id}
              onChange={(e) => set("base_uom_id", e.target.value)}>
              <option value="">— Select UOM —</option>
              {uomList.map((u) => (
                <option key={u.uom_id} value={u.uom_id}>
                  {u.code} — {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory flags */}
        <div>
          <p className={labelCls}>Inventory Flags</p>
          <div className="flex flex-wrap gap-6 mt-1">
            {[
              { key: "is_stock_item", label: "Stock Item" },
              { key: "is_variant_enabled", label: "Variant Enabled" },
              { key: "is_serialized", label: "Serialized" },
              { key: "is_batch_tracked", label: "Batch Tracked" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className={checkboxCls}
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 transition">
            {saving ? "Saving…" : "Create Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsSetupPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uomList, setUomList] = useState([]);

  const [modal, setModal] = useState(null); // 'create'
  const [jumpPage, setJumpPage] = useState("");

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchList = useCallback(async (searchVal, pageVal) => {
    setLoading(true);
    try {
      const data = await productsService.getProductList({
        search: searchVal,
        page: pageVal,
        limit: ITEMS_PER_PAGE,
      });
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(search, page);
  }, [search, page, fetchList]);

  // UOM list needed only for Create modal
  useEffect(() => {
    if (modal === "create") uomService.getAll().then(setUomList).catch(() => {});
  }, [modal]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCreate = async (formData) => {
    // throws on 409 — let the modal handle the error display
    await productsService.createProduct(formData);
    toast.success("Product created");
    setModal(null);
    setPage(1);
    fetchList(search, 1);
  };

  // Pagination helpers
  const getPageButtons = () => {
    if (totalPages <= MAX_PAGE_BUTTONS)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, page - 2);
    let end = start + MAX_PAGE_BUTTONS - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handleJumpPage = (e) => {
    if (e.key === "Enter") {
      const p = parseInt(jumpPage);
      if (!isNaN(p) && p >= 1 && p <= totalPages) setPage(p);
      setJumpPage("");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {total} record{total !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setModal("create")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
            <Plus size={15} />
            New Product
          </button>
        </div>
      </div>

      <div className="mb-4 w-full max-w-sm">
        <SearchBar
          placeholder="Search by name, category or UOM..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base UOM</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Base Price</TableHead>
              <TableHead className="text-right">Pkg Price</TableHead>
              <TableHead className="text-center">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  key={row.productid}
                  className="cursor-pointer hover:bg-purple-50 transition-colors"
                  onDoubleClick={() => navigate(`/therapist/setup/products/${row.productid}`)}>
                  <TableCell className="text-gray-400 text-xs">
                    {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{fmt(row.name)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.productcat === "Service"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                      {fmt(row.productcat)}
                    </span>
                  </TableCell>
                  <TableCell>{fmt(row.base_uom_code)}</TableCell>
                  <TableCell className="text-right">{fmtPrice(row.unitprice)}</TableCell>
                  <TableCell className="text-right">{fmtPrice(row.baseprice)}</TableCell>
                  <TableCell className="text-right">{fmtPrice(row.packageprice)}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                      {row.active ? "Yes" : "No"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">
              Prev
            </button>
            {getPageButtons().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-2 py-1 text-xs rounded border ${
                  p === page
                    ? "bg-gray-800 text-white border-gray-800"
                    : "border-gray-300 hover:bg-gray-100"
                }`}>
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">
              »
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Page {page} of {totalPages}</span>
            <span>|</span>
            <span>Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={handleJumpPage}
              className="w-14 border border-gray-300 rounded px-1 py-0.5 text-xs text-center"
              placeholder="#"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === "create" && (
        <ProductCreateModal
          uomList={uomList}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
