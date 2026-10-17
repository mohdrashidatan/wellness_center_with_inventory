import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Modal from "@/shared/Modal";
import { serialService } from "@/services/serialService";
import toast from "react-hot-toast";
import { ScanLine, Plus, RefreshCw, AlertTriangle, History } from "lucide-react";

const ITEMS_PER_PAGE = 20;

const STATUSES = [
  "In Stock", "Sold", "Transferred", "Consigned",
  "Loaned Out", "Returned", "Pending Serial", "Void",
];

const inputCls =
  "border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";

const fmt = (v) => (v == null || v === "" ? "—" : v);
const fmtDate = (v) =>
  v ? new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const statusCls = (s) =>
  s === "In Stock" ? "bg-green-100 text-green-700"
  : s === "Sold" ? "bg-blue-100 text-blue-700"
  : s === "Pending Serial" ? "bg-amber-100 text-amber-700"
  : s === "Void" ? "bg-red-100 text-red-600"
  : "bg-gray-100 text-gray-600";

/* ─── Register serials for stock already on hand ───────────────────────────── */
function RegisterModal({ products, onDone, onClose }) {
  const [productid, setProductid] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const serials = text.split(/[\n,;\t]+/).map((s) => s.trim()).filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    if (!productid) return toast.error("Select a product");
    if (serials.length === 0) return toast.error("Enter at least one serial");
    setSaving(true);
    try {
      const { created } = await serialService.register({
        productid,
        serials,
        remarks: "Opening balance registration",
      });
      toast.success(`${created.length} serial(s) registered`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to register serials");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Register Existing Stock</h2>
      <p className="text-xs text-gray-500 mb-4">
        For units already on the shelf that never went through a GRN. They are recorded as In Stock.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Product *</label>
          <select className={`w-full ${inputCls}`} value={productid} onChange={(e) => setProductid(e.target.value)}>
            <option value="">— Select a serialised product —</option>
            {products.map((p) => (
              <option key={p.productid} value={p.productid}>
                {p.itemcode} — {p.name} ({p.serial_capture_at})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Serial numbers — one per line, or comma separated
          </label>
          <textarea
            className={`w-full ${inputCls} font-mono resize-none`}
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"ITC240001\nITC240002\nITC240003"}
          />
          <p className="text-[11px] text-gray-400 mt-1">{serials.length} serial(s) detected</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 disabled:opacity-50 transition">
            {saving ? "Registering…" : "Register"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── One unit's life story ────────────────────────────────────────────────── */
function HistoryModal({ serialId, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    serialService.getHistory(serialId).then(setData).catch(() => toast.error("Failed to load history"));
  }, [serialId]);

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Serial History</h2>
      {!data ? (
        <p className="text-sm text-gray-400 py-6 text-center">Loading…</p>
      ) : (
        <>
          <div className="mb-4 space-y-1">
            <p className="font-mono text-sm font-medium text-gray-800">{fmt(data.serial_no)}</p>
            <p className="text-xs text-gray-500">{data.itemcode} — {data.product_name}</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusCls(data.status)}`}>
              {data.status}
            </span>
          </div>
          {data.movements.length === 0 ? (
            <p className="text-sm text-gray-400">No movements recorded.</p>
          ) : (
            <ol className="space-y-2">
              {data.movements.map((m) => (
                <li key={m.mov_id} className="border-l-2 border-gray-200 pl-3 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{m.mov_type}</span>
                    <span className="text-xs text-gray-400">{fmtDate(m.mov_date)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {fmt(m.grn_ref || m.pos_ref || m.do_ref || m.remarks)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
      <div className="flex justify-end pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">Close</button>
      </div>
    </Modal>
  );
}

/* ─── Serial vs stock reconciliation ──────────────────────────────────────── */
function ReconciliationPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { rows } = await serialService.getReconciliation();
      setRows(rows || []);
    } catch {
      toast.error("Failed to load reconciliation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const offenders = rows.filter((r) => Number(r.variance) !== 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${offenders.length ? "bg-amber-500" : "bg-green-600"}`}>
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Serial Reconciliation</h3>
            <p className="text-xs text-gray-400">
              Receipt items: serials in stock vs stock balance. Sale items: serials sold vs qty sold.
            </p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-6 text-center">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No products are flagged as serialised yet. Tick “Serialized” on a product to include it here.
        </p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-28">Item Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Stock Bal</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Serials In Stock</TableHead>
                <TableHead className="text-right">Serials Sold</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const v = Number(r.variance);
                return (
                  <TableRow key={r.productid} className={v !== 0 ? "bg-amber-50/50" : ""}>
                    <TableCell className="font-mono text-xs text-gray-600">{fmt(r.itemcode)}</TableCell>
                    <TableCell className="font-medium">{fmt(r.product_name)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {r.serial_capture_at}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{Number(r.balance_qty)}</TableCell>
                    <TableCell className="text-right">{Number(r.total_sold)}</TableCell>
                    <TableCell className="text-right">{Number(r.serials_in_stock)}</TableCell>
                    <TableCell className="text-right">{Number(r.serials_sold)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold text-sm ${v === 0 ? "text-green-600" : "text-amber-600"}`}>
                        {v > 0 ? `+${v}` : v}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function SerialRegisterPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [historyId, setHistoryId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const load = useCallback(async (searchVal, statusVal, pageVal) => {
    setLoading(true);
    try {
      const data = await serialService.list({
        search: searchVal, status: statusVal, page: pageVal, limit: ITEMS_PER_PAGE,
      });
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load serials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(search, status, page); }, [search, status, page, load]);
  useEffect(() => { serialService.getSerializedProducts().then(setProducts); }, []);

  return (
    <div className="p-6 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-600">
            <ScanLine size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Serial Register</h1>
            <p className="text-xs text-gray-400">Every tracked unit, and where it is now</p>
          </div>
        </div>
        <button
          onClick={() => setModal("register")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition">
          <Plus size={14} /> Register Existing Stock
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mt-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            className={`${inputCls} flex-1 min-w-[220px]`}
            placeholder="Search serial no, product or item code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Serial No.</TableHead>
                <TableHead className="w-28">Item Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">
                  No serials recorded yet.
                </TableCell></TableRow>
              ) : rows.map((r, idx) => (
                <TableRow key={r.serial_id} className="hover:bg-indigo-50/40 transition-colors">
                  <TableCell className="text-gray-400 text-xs">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                  <TableCell className="font-mono text-sm font-medium">{fmt(r.serial_no)}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{fmt(r.itemcode)}</TableCell>
                  <TableCell>{fmt(r.product_name)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls(r.status)}`}>{r.status}</span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{fmt(r.serial_capture_at)}</TableCell>
                  <TableCell className="text-xs text-gray-500">{fmtDate(r.entereddate)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setHistoryId(r.serial_id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-700 transition-colors">
                      <History size={12} /> History
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 text-sm">
            <p className="text-xs text-gray-400">{total} unit(s)</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition">Prev</button>
              <span className="px-3 py-1 text-gray-500">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition">Next</button>
            </div>
          </div>
        )}
      </div>

      <ReconciliationPanel />

      {modal === "register" && (
        <RegisterModal
          products={products}
          onDone={() => load(search, status, page)}
          onClose={() => setModal(null)}
        />
      )}
      {historyId && <HistoryModal serialId={historyId} onClose={() => setHistoryId(null)} />}
    </div>
  );
}
