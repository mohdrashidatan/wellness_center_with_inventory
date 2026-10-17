import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/utils/api";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";
import { Download } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 20;
const MAX_PAGE_BUTTONS = 5;

const fmt = (v) => (v == null ? "—" : v);
const fmtPrice = (v) => (v == null ? "—" : Number(v).toFixed(2));
const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
};

const inputCls = "border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const getButtons = () => {
    if (totalPages <= MAX_PAGE_BUTTONS)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, page - 2);
    let end = start + MAX_PAGE_BUTTONS - 1;
    if (end > totalPages) { end = totalPages; start = Math.max(1, end - MAX_PAGE_BUTTONS + 1); }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="flex items-center gap-1 mt-4">
      <button onClick={() => onPage(1)} disabled={page === 1}
        className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">«</button>
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
        className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">Prev</button>
      {getButtons().map((p) => (
        <button key={p} onClick={() => onPage(p)}
          className={`px-2 py-1 text-xs rounded border ${p === page ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 hover:bg-gray-100"}`}>{p}</button>
      ))}
      <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">Next</button>
      <button onClick={() => onPage(totalPages)} disabled={page === totalPages}
        className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100">»</button>
      <span className="ml-2 text-xs text-gray-500">Page {page} of {totalPages}</span>
    </div>
  );
}

// ─── Tab: Sales Headers ───────────────────────────────────────────────────────
function HeadersTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchData = useCallback(async (s, df, dt, pg) => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({ search: s, dateFrom: df, dateTo: dt, page: pg, limit: ITEMS_PER_PAGE });
      const res = await api.get(`${API_BASE_URL}/api/pos/sales/headers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data.rows || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load sales headers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(search, dateFrom, dateTo, page); }, []);

  const handleSearch = () => { setPage(1); fetchData(search, dateFrom, dateTo, 1); };
  const handleClear = () => {
    setSearch(""); setDateFrom(""); setDateTo(""); setPage(1);
    fetchData("", "", "", 1);
  };

  const handleExport = () => {
    if (!rows.length) return;
    const headers = ["POS ID", "Date", "Customer", "Contact", "Payment Method", "Total Amount", "Therapist", "Remarks"];
    const csvRows = rows.map((r) => [
      r.posid, fmtDate(r.transdate), fmt(r.customer_name), fmt(r.contact_no),
      fmt(r.payment_method), fmtPrice(r.total_amount), fmt(r.therapist_name), fmt(r.remarks),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sales_headers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <input
          type="text"
          placeholder="Search POS ID, customer, payment…"
          className={`${inputCls} w-64`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">From</label>
          <input type="date" className={inputCls} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">To</label>
          <input type="date" className={inputCls} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button onClick={handleSearch}
          className="px-4 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 transition">Search</button>
        <button onClick={handleClear}
          className="px-4 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">Clear</button>
        <button onClick={handleExport}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-2">{total} record{total !== 1 ? "s" : ""}</div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-10">#</TableHead>
              <TableHead>POS ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total (RM)</TableHead>
              <TableHead>Therapist</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-gray-400">No records found.</TableCell></TableRow>
            ) : rows.map((r, idx) => (
              <TableRow key={r.posid} className="hover:bg-purple-50 transition-colors">
                <TableCell className="text-gray-400 text-xs">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                <TableCell className="font-mono text-xs">{r.posid}</TableCell>
                <TableCell className="text-sm">{fmtDate(r.transdate)}</TableCell>
                <TableCell>{fmt(r.customer_name)}</TableCell>
                <TableCell className="text-sm">{fmt(r.contact_no)}</TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {fmt(r.payment_method)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{fmtPrice(r.total_amount)}</TableCell>
                <TableCell className="text-sm">{fmt(r.therapist_name)}</TableCell>
                <TableCell className="text-sm text-gray-500 max-w-xs truncate">{fmt(r.remarks)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p); fetchData(search, dateFrom, dateTo, p); }} />
    </div>
  );
}

// ─── Tab: Sales Details ───────────────────────────────────────────────────────
function DetailsTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [posid, setPosid] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchData = useCallback(async (s, pi, df, dt, pg) => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({ search: s, posid: pi, dateFrom: df, dateTo: dt, page: pg, limit: ITEMS_PER_PAGE });
      const res = await api.get(`${API_BASE_URL}/api/pos/sales/details?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data.rows || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load sales details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(search, posid, dateFrom, dateTo, page); }, []);

  const handleSearch = () => { setPage(1); fetchData(search, posid, dateFrom, dateTo, 1); };
  const handleClear = () => {
    setSearch(""); setPosid(""); setDateFrom(""); setDateTo(""); setPage(1);
    fetchData("", "", "", "", 1);
  };

  const handleExport = () => {
    if (!rows.length) return;
    const headers = ["POS ID", "Date", "Customer", "Category", "Item", "Qty", "Unit Price", "Disc", "Disc %", "Total"];
    const csvRows = rows.map((r) => [
      r.posid, fmtDate(r.transdate), fmt(r.customer_name), fmt(r.productcat),
      fmt(r.item_name), r.qty, fmtPrice(r.unit_price), fmtPrice(r.disc),
      r.discpercent != null ? r.discpercent : "—", fmtPrice(r.total_price),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sales_details.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <input
          type="text"
          placeholder="Search item name…"
          className={`${inputCls} w-56`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">POS ID</label>
          <input type="text" className={inputCls} placeholder="e.g. 42" value={posid}
            onChange={(e) => setPosid(e.target.value)} style={{ width: 80 }} />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">From</label>
          <input type="date" className={inputCls} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">To</label>
          <input type="date" className={inputCls} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button onClick={handleSearch}
          className="px-4 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 transition">Search</button>
        <button onClick={handleClear}
          className="px-4 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">Clear</button>
        <button onClick={handleExport}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-2">{total} record{total !== 1 ? "s" : ""}</div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-10">#</TableHead>
              <TableHead>POS ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Disc</TableHead>
              <TableHead className="text-right">Disc %</TableHead>
              <TableHead className="text-right">Total (RM)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={11} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-10 text-gray-400">No records found.</TableCell></TableRow>
            ) : rows.map((r, idx) => (
              <TableRow key={r.poslinesid} className="hover:bg-purple-50 transition-colors">
                <TableCell className="text-gray-400 text-xs">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                <TableCell className="font-mono text-xs">{r.posid}</TableCell>
                <TableCell className="text-sm">{fmtDate(r.transdate)}</TableCell>
                <TableCell>{fmt(r.customer_name)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.productcat === "Service" ? "bg-blue-100 text-blue-700"
                    : r.productcat === "Package" ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                  }`}>
                    {fmt(r.productcat)}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{fmt(r.item_name)}</TableCell>
                <TableCell className="text-right">{r.qty}</TableCell>
                <TableCell className="text-right">{fmtPrice(r.unit_price)}</TableCell>
                <TableCell className="text-right">{fmtPrice(r.disc)}</TableCell>
                <TableCell className="text-right">{r.discpercent != null ? `${r.discpercent}%` : "—"}</TableCell>
                <TableCell className="text-right font-medium">{fmtPrice(r.total_price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p); fetchData(search, posid, dateFrom, dateTo, p); }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "headers", label: "Sales Headers" },
  { id: "details", label: "Sales Details" },
];

export default function SalesReportPage() {
  const [activeTab, setActiveTab] = useState("headers");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales Report</h1>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-6 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? "border-gray-800 text-gray-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "headers" && <HeadersTab />}
      {activeTab === "details" && <DetailsTab />}
    </div>
  );
}
