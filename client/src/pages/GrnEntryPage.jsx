import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, CheckSquare, Square } from "lucide-react";
import { grnService } from "@/services/grnService";
import { contactsService } from "@/services/contactsService";
import toast from "react-hot-toast";
import Modal from "@/shared/Modal";

/* ─── helpers ─────────────────────────────────────────────────── */
const today = () => new Date().toISOString().split("T")[0];

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

/* ─── Lookup input (shared for supplier & item) ─────────────────── */
function LookupInput({ value, placeholder, onSearch, onSelect, onCreate, renderOption, creatable, creatableLabel }) {
  const [query, setQuery]       = useState(value || "");
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const timer                   = useRef(null);
  const wrapRef                 = useRef(null);

  // sync external clear
  useEffect(() => { setQuery(value || ""); }, [value]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timer.current);
    if (!v.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { const r = await onSearch(v); setResults(r); setOpen(true); }
      catch { /* silent */ } finally { setLoading(false); }
    }, 280);
  };

  const choose = (item) => { onSelect(item); setQuery(""); setOpen(false); setResults([]); };

  return (
    <div className="relative" ref={wrapRef}>
      <input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
      {loading && <span className="absolute right-3 top-2.5 text-xs text-gray-400">…</span>}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
          {results.map((r) => (
            <div
              key={r.id || r.sku_id || r.contactid}
              className="px-3 py-2 text-sm hover:bg-purple-50 cursor-pointer"
              onMouseDown={() => choose(r)}
            >
              {renderOption(r)}
            </div>
          ))}
          {results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">No results</div>
          )}
          {creatable && query.trim() && (
            <div
              className="px-3 py-2 text-sm text-purple-600 font-medium hover:bg-purple-50 cursor-pointer border-t"
              onMouseDown={() => { onCreate(query.trim()); setOpen(false); setQuery(""); }}
            >
              + {creatableLabel || `Add "${query.trim()}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function GrnEntryPage() {
  const navigate = useNavigate();

  /* header state */
  const [header, setHeader] = useState({
    contactid:         "",
    supplier_name:     "",
    receiptdate:       today(),
    delivery_order_no: "",
    remarks:           "",
  });

  /* lines state */
  const [lines, setLines] = useState([emptyLine()]);

  /* new supplier modal */
  const [newSupplierModal, setNewSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName]   = useState("");
  const [saving, setSaving] = useState(false);

  /* ── header helpers ── */
  const setHdr = (field, val) => setHeader((p) => ({ ...p, [field]: val }));

  /* ── supplier lookup ── */
  const handleSupplierSelect = (c) => {
    setHdr("contactid", c.contactid);
    setHdr("supplier_name", c.display_name);
  };

  const handleCreateSupplier = async (name) => {
    setNewSupplierName(name);
    setNewSupplierModal(true);
  };

  const saveNewSupplier = async () => {
    try {
      const c = await contactsService.createSupplier({ display_name: newSupplierName });
      setHdr("contactid", c.contactid);
      setHdr("supplier_name", c.display_name);
      setNewSupplierModal(false);
      toast.success(`Supplier "${c.display_name}" created`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create supplier");
    }
  };

  /* ── line helpers ── */
  const updateLine = (key, field, val) =>
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, [field]: val } : l)));

  const setConsignFromIndex = (idx, val) =>
    setLines((prev) =>
      prev.map((l, i) => (i >= idx ? { ...l, consign: val } : l))
    );

  const addLine = () => {
    const lastConsign = lines.length > 0 ? lines[lines.length - 1].consign : false;
    setLines((prev) => [...prev, emptyLine(lastConsign)]);
  };

  const removeLine = (key) => setLines((prev) => prev.filter((l) => l._key !== key));

  const handleProductSelect = (key, product) => {
    setLines((prev) =>
      prev.map((l) =>
        l._key === key
          ? { ...l, productid: product.productid, product_name: product.name, product_desc: product.description || "" }
          : l
      )
    );
  };

  /* ── totals ── */
  const totalLines = lines.length;
  const totalQty   = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0), 0);

  /* ── save ── */
  const handleSave = async () => {
    if (!header.receiptdate) { toast.error("Received date is required"); return; }
    if (lines.length === 0)  { toast.error("Add at least one item line"); return; }
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].productid)   { toast.error(`Line ${i + 1}: Item is required`); return; }
      if (!lines[i].qty || parseFloat(lines[i].qty) <= 0) { toast.error(`Line ${i + 1}: Qty must be > 0`); return; }
    }

    setSaving(true);
    try {
      await grnService.create({
        header: {
          contactid:         header.contactid || null,
          receiptdate:       header.receiptdate,
          delivery_order_no: header.delivery_order_no,
          remarks:           header.remarks,
        },
        lines: lines.map((l) => ({
          itemid:      l.productid,
          qty:         parseFloat(l.qty),
          uom:         l.uom,
          consign:     l.consign ? 1 : 0,
          remarks:     l.remarks,
          batch_no:    l.batch_no,
          expiry_date: l.expiry_date || null,
        })),
      });
      toast.success("GRN saved successfully");
      navigate("/therapist/stocks/incoming");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save GRN");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-bold">New Goods Received Note</h1>

      {/* ══ Section 1 — Header ══════════════════════════════════ */}
      <section className="bg-gray-50 border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-700 text-base">Receipt Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Supplier lookup */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Supplier *</label>
            {header.supplier_name ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-medium text-gray-800 border border-gray-200 rounded-md px-3 py-2 bg-white truncate">
                  {header.supplier_name}
                </span>
                <button
                  onClick={() => { setHdr("contactid", ""); setHdr("supplier_name", ""); }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <LookupInput
                placeholder="Search supplier…"
                onSearch={contactsService.search}
                onSelect={handleSupplierSelect}
                creatable
                creatableLabel="Create new supplier"
                onCreate={handleCreateSupplier}
                renderOption={(c) => (
                  <div>
                    <span className="font-medium">{c.display_name}</span>
                    {c.code && <span className="ml-2 text-gray-400 text-xs">{c.code}</span>}
                  </div>
                )}
              />
            )}
          </div>

          {/* Date received */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Received *</label>
            <input
              type="date"
              value={header.receiptdate}
              onChange={(e) => setHdr("receiptdate", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* DO number */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Order No.</label>
            <input
              value={header.delivery_order_no}
              onChange={(e) => setHdr("delivery_order_no", e.target.value)}
              placeholder="e.g. DO-2025-001"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Remarks */}
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Remarks</label>
            <input
              value={header.remarks}
              onChange={(e) => setHdr("remarks", e.target.value)}
              placeholder="Optional notes…"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      </section>

      {/* ══ Section 2 — Lines ══════════════════════════════════ */}
      <section className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-b">
          <h2 className="font-semibold text-gray-700 text-base">Received Items</h2>
          <Button onClick={addLine} size="sm" className="bg-prime-color hover:bg-prime-color-hover flex gap-1">
            <Plus className="w-4 h-4" /> Add Line
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-3 py-2 text-left w-8">#</th>
                <th className="px-3 py-2 text-left w-36">Item Code *</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-right w-20">Qty *</th>
                <th className="px-3 py-2 text-left w-20">UOM</th>
                <th className="px-3 py-2 text-center w-24">Consignment</th>
                <th className="px-3 py-2 text-left w-28">Batch No.</th>
                <th className="px-3 py-2 text-left w-32">Expiry Date</th>
                <th className="px-3 py-2 text-left">Remarks</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((ln, idx) => (
                <tr key={ln._key} className="border-t hover:bg-gray-50">
                  {/* # */}
                  <td className="px-3 py-2 text-gray-400">{idx + 1}</td>

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

                  {/* Description (auto-filled, read-only) */}
                  <td className="px-3 py-2">
                    <input
                      value={ln.product_desc}
                      readOnly
                      tabIndex={-1}
                      placeholder="Auto-populated"
                      className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-gray-600 cursor-default focus:outline-none"
                    />
                  </td>

                  {/* Qty */}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={ln.qty}
                      onChange={(e) => updateLine(ln._key, "qty", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </td>

                  {/* UOM */}
                  <td className="px-3 py-2">
                    <input
                      value={ln.uom}
                      onChange={(e) => updateLine(ln._key, "uom", e.target.value)}
                      placeholder="UOM"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </td>

                  {/* Consignment toggle */}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => {
                        const newVal = !ln.consign;
                        setConsignFromIndex(idx, newVal);
                      }}
                      title={ln.consign ? "Consignment — click to toggle" : "Not consignment — click to toggle"}
                      className={`flex items-center gap-1 mx-auto text-xs font-medium px-2 py-1 rounded-full ${ln.consign ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"}`}
                    >
                      {ln.consign ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                      {ln.consign ? "Consign" : "No"}
                    </button>
                  </td>

                  {/* Batch No */}
                  <td className="px-3 py-2">
                    <input
                      value={ln.batch_no}
                      onChange={(e) => updateLine(ln._key, "batch_no", e.target.value)}
                      placeholder="Batch #"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </td>

                  {/* Expiry Date */}
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={ln.expiry_date}
                      onChange={(e) => updateLine(ln._key, "expiry_date", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </td>

                  {/* Remarks */}
                  <td className="px-3 py-2">
                    <input
                      value={ln.remarks}
                      onChange={(e) => updateLine(ln._key, "remarks", e.target.value)}
                      placeholder="Comments…"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeLine(ln._key)}
                      disabled={lines.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══ Section 3 — Footer ══════════════════════════════════ */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50 border rounded-xl px-5 py-4">
        {/* Summary */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Total Lines: </span>
            <span className="font-semibold text-gray-800">{totalLines}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Qty: </span>
            <span className="font-semibold text-gray-800">{totalQty}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/therapist/stocks/incoming")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-prime-color hover:bg-prime-color-hover min-w-[100px]"
          >
            {saving ? "Saving…" : "Save GRN"}
          </Button>
        </div>
      </section>

      {/* ══ New Supplier Modal ══════════════════════════════════ */}
      {newSupplierModal && (
        <Modal title="Create New Supplier" setIsOpen={setNewSupplierModal} small>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              This supplier will be saved as a <strong>Supplier</strong> contact.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Name *</label>
              <input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <Button onClick={saveNewSupplier} className="bg-prime-color hover:bg-prime-color-hover w-full">
              Save Supplier
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
