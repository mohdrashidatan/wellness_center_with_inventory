import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Modal from "@/shared/Modal";
import { productsService } from "@/services/productsService";
import { uomService } from "@/services/uomService";
import toast from "react-hot-toast";
import { ArrowLeft, Pencil, Trash2, Download } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => (v == null ? "—" : v);
const fmtPrice = (v) => (v == null ? "—" : Number(v).toFixed(2));
const fmtBool = (v) => (v ? "Yes" : "No");
const fmtDate = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB");
};
const fmtDateTime = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const inputCls = "border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";
const labelCls = "block text-xs text-gray-500 mb-1";
const checkboxCls = "h-4 w-4 rounded border-gray-300 accent-gray-800 cursor-pointer";

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function ProductEditModal({ product, uomList, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product.name || "",
    productcat: product.productcat || "Product",
    unitprice: product.unitprice ?? "",
    baseprice: product.baseprice ?? "",
    packageprice: product.packageprice ?? "",
    description: product.description || "",
    base_uom_id: "",
    is_stock_item: !!product.is_stock_item,
    is_variant_enabled: !!product.is_variant_enabled,
    is_serialized: !!product.is_serialized,
    is_batch_tracked: !!product.is_batch_tracked,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uomList.length > 0 && product.base_uom_code) {
      const match = uomList.find((u) => u.code === product.base_uom_code);
      if (match) setForm((f) => ({ ...f, base_uom_id: match.uom_id }));
    }
  }, [uomList, product.base_uom_code]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  const W = "w-full " + inputCls;

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelCls}>Name *</label><input className={W} value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
          <div><label className={labelCls}>Category</label>
            <select className={W} value={form.productcat} onChange={(e) => set("productcat", e.target.value)}>
              <option value="Product">Product</option>
              <option value="Service">Service</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelCls}>Unit Price</label><input type="number" min="0" step="0.01" className={W} value={form.unitprice} onChange={(e) => set("unitprice", e.target.value)} /></div>
          <div><label className={labelCls}>Base Price</label><input type="number" min="0" step="0.01" className={W} value={form.baseprice} onChange={(e) => set("baseprice", e.target.value)} /></div>
          <div><label className={labelCls}>Package Price</label><input type="number" min="0" step="0.01" className={W} value={form.packageprice} onChange={(e) => set("packageprice", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelCls}>Base UOM</label>
            <select className={W} value={form.base_uom_id} onChange={(e) => set("base_uom_id", e.target.value)}>
              <option value="">— Select UOM —</option>
              {uomList.map((u) => (<option key={u.uom_id} value={u.uom_id}>{u.code} — {u.name}</option>))}
            </select>
          </div>
        </div>
        <div>
          <p className={labelCls}>Inventory Flags</p>
          <div className="flex flex-wrap gap-6 mt-1">
            {[["is_stock_item","Stock Item"],["is_variant_enabled","Variant Enabled"],["is_serialized","Serialized"],["is_batch_tracked","Batch Tracked"]].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className={checkboxCls} checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div><label className={labelCls}>Description</label><textarea className={`${W} resize-none`} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 disabled:opacity-50 transition">{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Deactivate Confirm Modal ─────────────────────────────────────────────────
function ConfirmDeactivateModal({ productName, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal onClose={onClose} small>
      <h2 className="text-base font-semibold text-gray-800 mb-3">Deactivate Product</h2>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to deactivate <span className="font-semibold">{productName}</span>?<br />
        The product will be marked as inactive.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">Cancel</button>
        <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}
          className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 transition">
          {busy ? "Deactivating…" : "Yes, Deactivate"}
        </button>
      </div>
    </Modal>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCsv(rows, productName) {
  const headers = ["Type", "Ref No.", "Date", "Party", "Qty", "UOM", "Unit Price", "Total Price", "Remarks"];
  const lines = [headers.join(",")];
  rows.forEach((r) => {
    const cols = [
      r.txn_type,
      r.ref_no,
      r.txn_date ? new Date(r.txn_date).toLocaleDateString("en-GB") : "",
      `"${(r.party || "").replace(/"/g, '""')}"`,
      r.qty,
      r.uom || "",
      r.unit_price != null ? Number(r.unit_price).toFixed(2) : "",
      r.total_price != null ? Number(r.total_price).toFixed(2) : "",
      `"${(r.remarks || "").replace(/"/g, '""')}"`,
    ];
    lines.push(cols.join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${productName.replace(/\s+/g, "_")}_transactions.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [uomList, setUomList] = useState([]);
  const [modal, setModal] = useState(null); // 'edit' | 'delete'

  // Transaction list state
  const [txns, setTxns] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [txnType, setTxnType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [applied, setApplied] = useState({ search: "", type: "", dateFrom: "", dateTo: "" });

  // Load product
  useEffect(() => {
    productsService.getProductById(id)
      .then(setProduct)
      .catch(() => toast.error("Failed to load product"));
    uomService.getAll().then(setUomList).catch(() => {});
  }, [id]);

  // Load transactions whenever applied filters change
  const fetchTxns = useCallback(async (filters) => {
    setTxnLoading(true);
    try {
      const data = await productsService.getProductTransactions(id, filters);
      setTxns(data);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setTxnLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTxns(applied);
  }, [applied, fetchTxns]);

  const handleApplyFilter = () => {
    setApplied({ search, type: txnType, dateFrom, dateTo });
  };

  const handleClearFilter = () => {
    setSearch(""); setTxnType(""); setDateFrom(""); setDateTo("");
    setApplied({ search: "", type: "", dateFrom: "", dateTo: "" });
  };

  // Edit / Deactivate handlers
  const handleSaveEdit = async (formData) => {
    try {
      const updated = await productsService.updateProduct(product.productid, formData);
      setProduct(updated);
      setModal(null);
      toast.success("Product updated");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDeactivate = async () => {
    try {
      await productsService.deactivateProduct(product.productid);
      toast.success("Product deactivated");
      navigate("/therapist/setup/products");
    } catch {
      toast.error("Failed to deactivate product");
    }
  };

  if (!product) {
    return <div className="p-6 text-gray-400 text-sm">Loading product…</div>;
  }

  const DetailRow = ({ label, value }) => (
    <div className="flex gap-2">
      <span className="w-40 text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/therapist/setup/products")}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition">
          <ArrowLeft size={16} />
          Back to Products
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setModal("edit")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition">
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => setModal("delete")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition">
            <Trash2 size={14} /> Deactivate
          </button>
        </div>
      </div>

      {/* ── Product detail card ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-800">{product.name}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.productcat === "Service" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
            {product.productcat}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {product.active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-2">
          <DetailRow label="Product ID" value={product.productid} />
          <DetailRow label="Base UOM" value={product.base_uom_code ? `${product.base_uom_code} — ${product.base_uom_name}` : "—"} />
          <DetailRow label="Unit Price" value={fmtPrice(product.unitprice)} />
          <DetailRow label="Base Price" value={fmtPrice(product.baseprice)} />
          <DetailRow label="Package Price" value={fmtPrice(product.packageprice)} />
          <DetailRow label="Stock Item" value={fmtBool(product.is_stock_item)} />
          <DetailRow label="Variant Enabled" value={fmtBool(product.is_variant_enabled)} />
          <DetailRow label="Serialized" value={fmtBool(product.is_serialized)} />
          <DetailRow label="Batch Tracked" value={fmtBool(product.is_batch_tracked)} />
          <DetailRow label="Entered Date" value={fmtDate(product.entereddate)} />
          <DetailRow label="Last Edited" value={fmtDate(product.editeddate)} />
        </div>

        {product.description && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
          </div>
        )}
      </div>

      {/* ── Transactions section ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Transaction History
              <span className="ml-2 text-xs font-normal text-gray-400">({txns.length} record{txns.length !== 1 ? "s" : ""})</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {txns.length > 0 && (() => {
              const net = txns.reduce((sum, r) => sum + Number(r.qty ?? 0), 0);
              return (
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Net Balance</p>
                  <p className={`text-2xl font-bold ${net < 0 ? "text-red-600" : net > 0 ? "text-green-700" : "text-gray-500"}`}>
                    {net > 0 ? "+" : ""}{net}
                  </p>
                </div>
              );
            })()}
            <button
              onClick={() => exportCsv(txns, product.name)}
              disabled={txns.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 disabled:opacity-40 transition">
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div>
            <label className={labelCls}>Search</label>
            <input
              className={`${inputCls} w-52`}
              placeholder="Ref, party, remarks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
            />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select
              className={`${inputCls} w-28`}
              value={txnType}
              onChange={(e) => setTxnType(e.target.value)}>
              <option value="">All</option>
              <option value="GRN">GRN</option>
              <option value="POS">POS</option>
              <option value="DO">DO</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date From</label>
            <input type="date" className={`${inputCls} w-36`} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Date To</label>
            <input type="date" className={`${inputCls} w-36`} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyFilter}
              className="px-3 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 transition">
              Search
            </button>
            <button
              onClick={handleClearFilter}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ref No.</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txnLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-gray-400">Loading…</TableCell>
                </TableRow>
              ) : txns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-gray-400">No transactions found.</TableCell>
                </TableRow>
              ) : txns.map((r, i) => (
                <TableRow key={i} className="hover:bg-gray-50">
                  <TableCell className="text-xs whitespace-nowrap">{fmtDateTime(r.txn_date)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.txn_type === "GRN" ? "bg-teal-100 text-teal-700"
                      : r.txn_type === "DO" ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                    }`}>
                      {r.txn_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.ref_no}</TableCell>
                  <TableCell className="text-sm">{fmt(r.party)}</TableCell>
                  <TableCell className={`text-right font-medium ${r.qty < 0 ? "text-red-600" : ""}`}>{r.qty}</TableCell>
                  <TableCell>{fmt(r.uom)}</TableCell>
                  <TableCell className="text-right">{r.unit_price != null ? Number(r.unit_price).toFixed(2) : "—"}</TableCell>
                  <TableCell className="text-right">{r.total_price != null ? Number(r.total_price).toFixed(2) : "—"}</TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-[160px] truncate">{r.remarks || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      {modal === "edit" && (
        <ProductEditModal product={product} uomList={uomList} onSave={handleSaveEdit} onClose={() => setModal(null)} />
      )}
      {modal === "delete" && (
        <ConfirmDeactivateModal productName={product.name} onConfirm={handleDeactivate} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
