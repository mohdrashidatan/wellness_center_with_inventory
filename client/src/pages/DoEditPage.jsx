import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { doService } from "@/services/doService";
import { contactsService } from "@/services/contactsService";
import toast from "react-hot-toast";
import Modal from "@/shared/Modal";

/* ─── helpers ─────────────────────────────────────────────────── */
const toDateInput = (val) => {
  if (!val) return "";
  return val.split("T")[0];
};

const emptyLine = () => ({
  _key:         Math.random().toString(36).slice(2),
  productid:    "",
  product_name: "",
  product_desc: "",
  qty:          "",
  uom:          "",
  batch_no:     "",
  expiry_date:  "",
  remarks:      "",
});

/* ─── Lookup input ───────────────────────────────────────────────── */
function LookupInput({ value, placeholder, onSearch, onSelect, onCreate, renderOption, creatable, creatableLabel, dropWidthScale = 1 }) {
  const [query, setQuery]     = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const timer                 = useRef(null);
  const wrapRef               = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const update = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timer.current);
    if (!v.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { const r = await onSearch(v); setResults(r); setOpen(true); }
      catch (err) { console.error("Lookup search error:", err); setOpen(true); }
      finally { setLoading(false); }
    }, 280);
  };

  const choose = (item) => { onSelect(item); setQuery(""); setOpen(false); setResults([]); };

  const dropdown = open ? createPortal(
    <div
      style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width * dropWidthScale, zIndex: 9999 }}
      className="bg-white border border-orange-200 rounded-md shadow-lg max-h-52 overflow-y-auto"
    >
      {results.map((r) => (
        <div
          key={r.productid || r.id || r.contactid}
          className="px-3 py-2 text-sm hover:bg-orange-50 cursor-pointer"
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
          className="px-3 py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 cursor-pointer border-t border-orange-100"
          onMouseDown={() => { onCreate(query.trim()); setOpen(false); setQuery(""); }}
        >
          + {creatableLabel || `Add "${query.trim()}"`}
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative" ref={wrapRef}>
      <input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      {loading && <span className="absolute right-3 top-2.5 text-xs text-gray-400">…</span>}
      {dropdown}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function DoEditPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [header, setHeader] = useState(null);
  const [lines, setLines]   = useState([]);
  const [loadError, setLoadError]               = useState(null);
  const [newRecipientModal, setNewRecipientModal] = useState(false);
  const [newRecipientName, setNewRecipientName]   = useState("");
  const [saving, setSaving]                       = useState(false);

  /* ── Load existing DO ── */
  useEffect(() => {
    doService.getById(id)
      .then(({ header: h, lines: ls }) => {
        setHeader({
          txn_type:          h.transtype || "Consign Sales",
          contactid:         h.contactid || "",
          recipient_name:    h.recipient_name || "",
          transferdate:      toDateInput(h.transferdate),
          delivery_order_no: h.delivery_order_no || "",
          remarks:           h.remarks || "",
        });
        setLines(
          ls.length > 0
            ? ls.map((l) => ({
                _key:         Math.random().toString(36).slice(2),
                productid:    l.productid || "",
                product_name: l.product_name || "",
                product_desc: l.product_desc || "",
                qty:          l.qty ?? "",
                uom:          l.uom || "",
                batch_no:     l.batch_no || "",
                expiry_date:  toDateInput(l.expiry_date),
                remarks:      l.remarks || "",
              }))
            : [emptyLine()]
        );
      })
      .catch(() => setLoadError("Failed to load Delivery Order"));
  }, [id]);

  const setHdr = (field, val) => setHeader((p) => ({ ...p, [field]: val }));

  const handleRecipientSelect = (c) => {
    setHdr("contactid", c.contactid);
    setHdr("recipient_name", c.display_name);
  };

  const handleCreateRecipient = (name) => {
    setNewRecipientName(name);
    setNewRecipientModal(true);
  };

  const saveNewRecipient = async () => {
    try {
      const c = await contactsService.createSupplier({ display_name: newRecipientName });
      setHdr("contactid", c.contactid);
      setHdr("recipient_name", c.display_name);
      setNewRecipientModal(false);
      toast.success(`Recipient "${c.display_name}" created`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create recipient");
    }
  };

  const updateLine = (key, field, val) =>
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, [field]: val } : l)));

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (key) => setLines((prev) => prev.filter((l) => l._key !== key));

  const handleProductSelect = (key, product) => {
    setLines((prev) =>
      prev.map((l) =>
        l._key === key
          ? { ...l, productid: product.productid, product_name: product.name, product_desc: product.description || "", uom: product.base_uom_code || "" }
          : l
      )
    );
  };

  const totalLines = lines.length;
  const totalQty   = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0), 0);

  const handleSave = async () => {
    if (!header.txn_type)                  { toast.error("Transaction type is required"); return; }
    if (!header.transferdate)              { toast.error("Transfer date is required"); return; }
    if (!header.delivery_order_no.trim())  { toast.error("DO Reference No. is required"); return; }
    if (lines.length === 0)               { toast.error("Add at least one item line"); return; }
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].productid)                             { toast.error(`Line ${i + 1}: Item is required`); return; }
      if (!lines[i].qty || parseFloat(lines[i].qty) <= 0) { toast.error(`Line ${i + 1}: Qty must be > 0`); return; }
    }

    setSaving(true);
    try {
      await doService.update(id, {
        header: {
          txn_type:          header.txn_type,
          contactid:         header.contactid || null,
          transferdate:      header.transferdate,
          delivery_order_no: header.delivery_order_no,
          remarks:           header.remarks,
        },
        lines: lines.map((l) => ({
          itemid:      l.productid,
          qty:         parseFloat(l.qty),
          uom:         l.uom,
          remarks:     l.remarks,
          batch_no:    l.batch_no,
          expiry_date: l.expiry_date || null,
        })),
      });
      toast.success("Delivery Order updated successfully");
      navigate("/therapist/stocks/transfers");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update Delivery Order");
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{loadError}</p>
        <Button variant="outline" onClick={() => navigate("/therapist/stocks/transfers")}>Back to List</Button>
      </div>
    );
  }

  if (!header) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-bold text-orange-700">
        Edit Delivery Order — DO-{String(id).padStart(5, "0")}
      </h1>

      {/* ══ Section 1 — Header ══════════════════════════════════ */}
      <section className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-orange-700 text-base">Transfer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-medium text-orange-700 mb-1">Transaction Type *</label>
            <select
              value={header.txn_type}
              onChange={(e) => setHdr("txn_type", e.target.value)}
              className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="Consign Sales">Consign Sales</option>
              <option value="Consign Return">Consign Return</option>
              <option value="Loan Out">Loan Out</option>
            </select>
          </div>

          {/* Recipient lookup */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-orange-700 mb-1">Recipient</label>
            {header.recipient_name ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-medium text-gray-800 border border-orange-200 rounded-md px-3 py-2 bg-white truncate">
                  {header.recipient_name}
                </span>
                <button
                  onClick={() => { setHdr("contactid", ""); setHdr("recipient_name", ""); }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <LookupInput
                placeholder="Search recipient…"
                onSearch={contactsService.search}
                onSelect={handleRecipientSelect}
                creatable
                creatableLabel="Create new recipient"
                onCreate={handleCreateRecipient}
                renderOption={(c) => (
                  <div>
                    <span className="font-medium">{c.display_name}</span>
                    {c.code && <span className="ml-2 text-gray-400 text-xs">{c.code}</span>}
                  </div>
                )}
              />
            )}
          </div>

          {/* Transfer date */}
          <div>
            <label className="block text-xs font-medium text-orange-700 mb-1">Transfer Date *</label>
            <input
              type="date"
              value={header.transferdate}
              onChange={(e) => setHdr("transferdate", e.target.value)}
              className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>

          {/* DO Reference No. */}
          <div>
            <label className="block text-xs font-medium text-orange-700 mb-1">DO Reference No. *</label>
            <input
              value={header.delivery_order_no}
              onChange={(e) => setHdr("delivery_order_no", e.target.value)}
              placeholder="e.g. DO-2025-001"
              className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>

          {/* Remarks */}
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-orange-700 mb-1">Remarks</label>
            <input
              value={header.remarks}
              onChange={(e) => setHdr("remarks", e.target.value)}
              placeholder="Optional notes…"
              className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>
        </div>
      </section>

      {/* ══ Section 2 — Lines ══════════════════════════════════ */}
      <section className="border border-orange-200 rounded-xl overflow-hidden">
        <div className="bg-orange-50 px-5 py-3 flex justify-between items-center border-b border-orange-200">
          <h2 className="font-semibold text-orange-700 text-base">Items to Transfer</h2>
          <Button onClick={addLine} size="sm" className="bg-orange-600 hover:bg-orange-700 flex gap-1">
            <Plus className="w-4 h-4" /> Add Line
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-orange-50 text-xs text-orange-700 uppercase tracking-wide border-b border-orange-200">
                <th className="px-3 py-2 text-left w-8">#</th>
                <th className="px-3 py-2 text-left w-36">Item *</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-right w-20">Qty *</th>
                <th className="px-3 py-2 text-left w-20">UOM</th>
                <th className="px-3 py-2 text-left w-28">Batch No.</th>
                <th className="px-3 py-2 text-left w-32">Expiry Date</th>
                <th className="px-3 py-2 text-left">Remarks</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((ln, idx) => (
                <tr key={ln._key} className="border-t border-orange-100 hover:bg-orange-50">
                  <td className="px-3 py-2 text-gray-400">{idx + 1}</td>

                  {/* Product lookup */}
                  <td className="px-3 py-2">
                    {ln.productid ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-orange-700 font-semibold truncate max-w-[120px]">{ln.product_name}</span>
                        <button
                          onClick={() => setLines((prev) =>
                            prev.map((l) => l._key === ln._key
                              ? { ...l, productid: "", product_name: "", product_desc: "", uom: "" }
                              : l
                            )
                          )}
                          className="text-red-400 text-xs"
                        >✕</button>
                      </div>
                    ) : (
                      <LookupInput
                        key={ln._key}
                        placeholder="Search product…"
                        onSearch={doService.searchProducts}
                        onSelect={(p) => handleProductSelect(ln._key, p)}
                        dropWidthScale={4}
                        renderOption={(p) => (
                          <div className="overflow-hidden">
                            <span className="font-medium text-gray-800">{p.name}</span>
                            {p.description && (
                              <span className="ml-2 text-gray-400 text-xs">{p.description}</span>
                            )}
                          </div>
                        )}
                      />
                    )}
                  </td>

                  {/* Description (auto-filled) */}
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
                      className="w-full border border-orange-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </td>

                  {/* UOM */}
                  <td className="px-3 py-2">
                    <input
                      value={ln.uom}
                      onChange={(e) => updateLine(ln._key, "uom", e.target.value)}
                      placeholder="UOM"
                      className="w-full border border-orange-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </td>

                  {/* Batch No */}
                  <td className="px-3 py-2">
                    <input
                      value={ln.batch_no}
                      onChange={(e) => updateLine(ln._key, "batch_no", e.target.value)}
                      placeholder="Batch #"
                      className="w-full border border-orange-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </td>

                  {/* Expiry Date */}
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={ln.expiry_date}
                      onChange={(e) => updateLine(ln._key, "expiry_date", e.target.value)}
                      className="w-full border border-orange-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </td>

                  {/* Remarks */}
                  <td className="px-3 py-2">
                    <input
                      value={ln.remarks}
                      onChange={(e) => updateLine(ln._key, "remarks", e.target.value)}
                      placeholder="Comments…"
                      className="w-full border border-orange-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
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

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/therapist/stocks/transfers")}
            disabled={saving}
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 min-w-[160px]"
          >
            {saving ? "Saving…" : "Update Delivery Order"}
          </Button>
        </div>
      </section>

      {/* ══ New Recipient Modal ══════════════════════════════════ */}
      {newRecipientModal && (
        <Modal title="Create New Recipient" setIsOpen={setNewRecipientModal} small>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              This recipient will be saved as a contact.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Recipient Name *</label>
              <input
                value={newRecipientName}
                onChange={(e) => setNewRecipientName(e.target.value)}
                className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <Button onClick={saveNewRecipient} className="bg-orange-600 hover:bg-orange-700 w-full">
              Save Recipient
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
