import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/utils/api";
import { authService } from "@/services/authService";
import toast from "react-hot-toast";
import { ShoppingCart, ArrowRightLeft, Users, TrendingUp, Package, ChevronRight, Download } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 20;
const MAX_PAGE_BUTTONS = 5;

const fmt = (v) => (v == null ? "—" : v);
const fmtNum = (v) => (v == null ? 0 : Number(v));
const fmtPrice = (v) => (v == null ? "—" : Number(v).toFixed(2));
const fmtDate = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
};

const inputCls = "border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";

// ─── Top-3 Bar chart row ──────────────────────────────────────────────────────
function RankBar({ rank, label, value, subLabel, maxValue, colorClass }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">{medals[rank] || `#${rank + 1}`}</span>
          <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]" title={label}>
            {label || "—"}
          </span>
        </div>
        <div className="text-right ml-2 shrink-0">
          <span className="text-sm font-semibold text-gray-700">{fmtNum(value).toLocaleString()}</span>
          {subLabel && <span className="text-xs text-gray-400 ml-1">{subLabel}</span>}
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ title, icon: Icon, iconBg, items, valueKey, labelKey, subValueKey, subLabel, unit, colorClass, onDrillDown }) {
  const maxVal = items.length ? Math.max(...items.map((i) => fmtNum(i[valueKey]))) : 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon size={18} className="text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        <button
          onClick={onDrillDown}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          Details <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex-1">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No data for this period</p>
        ) : (
          items.map((item, i) => (
            <RankBar
              key={i}
              rank={i}
              label={item[labelKey]}
              value={fmtNum(item[valueKey])}
              subLabel={subLabel || unit}
              maxValue={maxVal}
              colorClass={colorClass}
            />
          ))
        )}
      </div>

      {subValueKey && items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Top: <span className="font-semibold text-gray-600">
              {subValueKey === "total_revenue" || subValueKey === "total_spent"
                ? `RM ${fmtPrice(items[0]?.[subValueKey])}`
                : fmtNum(items[0]?.[subValueKey]).toLocaleString()}
            </span>{" "}
            {subValueKey === "total_revenue" ? "revenue" : subValueKey === "total_spent" ? "spent" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
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

// ─── Type badge ───────────────────────────────────────────────────────────────
const MOV_BADGE = {
  "POS Sale":     "bg-blue-100 text-blue-700",
  "Transfer Out": "bg-orange-100 text-orange-700",
  "GRN Receipt":  "bg-green-100 text-green-700",
};

// ─── Stock Movements Panel ────────────────────────────────────────────────────
function MovementsPanel({ initialMovType }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [movType, setMovType] = useState(initialMovType || "");
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchData = useCallback(async (df, dt, mt, ps, pg) => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({ dateFrom: df, dateTo: dt, movType: mt, productSearch: ps, page: pg, limit: ITEMS_PER_PAGE });
      const res = await api.get(`${API_BASE_URL}/api/stock-report/movements?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data.rows || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateFrom, dateTo, initialMovType || "", productSearch, 1);
    setMovType(initialMovType || "");
  }, [initialMovType]);

  const handleSearch = () => { setPage(1); fetchData(dateFrom, dateTo, movType, productSearch, 1); };
  const handleClear = () => {
    setDateFrom(""); setDateTo(""); setMovType(""); setProductSearch(""); setPage(1);
    fetchData("", "", "", "", 1);
  };

  const handleExport = () => {
    if (!rows.length) return;
    const headers = ["Date", "Type", "Product", "Qty", "Reference", "Party", "Amount (RM)"];
    const csvRows = rows.map((r) => [
      fmtDate(r.mov_date), fmt(r.mov_type), fmt(r.product_name),
      r.qty, fmt(r.reference), fmt(r.party_name), r.amount != null ? fmtPrice(r.amount) : "—",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "stock_movements.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <input
          type="text"
          placeholder="Search product…"
          className={`${inputCls} w-48`}
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <select
          className={inputCls}
          value={movType}
          onChange={(e) => setMovType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="POS Sale">POS Sale</option>
          <option value="Transfer Out">Transfer Out</option>
          <option value="GRN Receipt">GRN Receipt</option>
        </select>
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
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Customer / Contact</TableHead>
              <TableHead className="text-right">Amount (RM)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">No records found.</TableCell></TableRow>
            ) : rows.map((r, idx) => (
              <TableRow key={idx} className="hover:bg-gray-50 transition-colors">
                <TableCell className="text-gray-400 text-xs">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                <TableCell className="text-sm">{fmtDate(r.mov_date)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MOV_BADGE[r.mov_type] || "bg-gray-100 text-gray-600"}`}>
                    {r.mov_type}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{fmt(r.product_name)}</TableCell>
                <TableCell className="text-right">{fmtNum(r.qty).toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">{fmt(r.reference)}</TableCell>
                <TableCell className="text-sm">{fmt(r.party_name)}</TableCell>
                <TableCell className="text-right text-sm">{r.amount != null ? fmtPrice(r.amount) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p); fetchData(dateFrom, dateTo, movType, productSearch, p); }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockReportPage() {
  const [summary, setSummary] = useState({ topSold: [], topTransferred: [], topCustomers: [] });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeSection, setActiveSection] = useState(null); // null = dashboard, else show movements
  const [drillMovType, setDrillMovType] = useState("");

  const fetchSummary = useCallback(async (df, dt) => {
    setLoadingSummary(true);
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({ dateFrom: df, dateTo: dt });
      const res = await api.get(`${API_BASE_URL}/api/stock-report/summary?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data);
    } catch {
      toast.error("Failed to load stock summary");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => { fetchSummary("", ""); }, []);

  const handleFilter = () => fetchSummary(dateFrom, dateTo);
  const handleClearFilter = () => { setDateFrom(""); setDateTo(""); fetchSummary("", ""); };

  const handleDrillDown = (movType) => {
    setDrillMovType(movType);
    setActiveSection("movements");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Top performers and movement history</p>
        </div>
        {activeSection === "movements" && (
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      {activeSection === null ? (
        <>
          {/* Period filter */}
          <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-sm text-gray-600 font-medium">Period:</span>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500">From</label>
              <input type="date" className={inputCls} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500">To</label>
              <input type="date" className={inputCls} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <button onClick={handleFilter}
              className="px-4 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 transition">Apply</button>
            <button onClick={handleClearFilter}
              className="px-4 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition">All Time</button>
          </div>

          {/* Top-3 Cards */}
          {loadingSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-52 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 rounded w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <SummaryCard
                title="Top Products Sold"
                icon={ShoppingCart}
                iconBg="bg-blue-500"
                items={summary.topSold}
                labelKey="product_name"
                valueKey="total_qty"
                subValueKey="total_revenue"
                unit="units"
                colorClass="bg-blue-400"
                onDrillDown={() => handleDrillDown("POS Sale")}
              />
              <SummaryCard
                title="Top Products Transferred Out"
                icon={ArrowRightLeft}
                iconBg="bg-orange-500"
                items={summary.topTransferred}
                labelKey="product_name"
                valueKey="total_qty"
                unit="units"
                colorClass="bg-orange-400"
                onDrillDown={() => handleDrillDown("Transfer Out")}
              />
              <SummaryCard
                title="Top Customers (by Spend)"
                icon={Users}
                iconBg="bg-purple-500"
                items={summary.topCustomers}
                labelKey="customer_name"
                valueKey="total_spent"
                subValueKey="total_spent"
                unit="RM"
                colorClass="bg-purple-400"
                onDrillDown={() => handleDrillDown("POS Sale")}
              />
            </div>
          )}

          {/* Quick-access panels */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "All Stock Movements", icon: TrendingUp, movType: "", desc: "Combined view of sales, transfers, and receipts", color: "text-gray-600 bg-gray-100" },
              { label: "Transfers Out Detail", icon: ArrowRightLeft, movType: "Transfer Out", desc: "All DO transfer-out lines", color: "text-orange-600 bg-orange-50" },
              { label: "GRN Receipts Detail", icon: Package, movType: "GRN Receipt", desc: "All goods received note lines", color: "text-green-600 bg-green-50" },
            ].map(({ label, icon: Icon, movType: mt, desc, color }) => (
              <button
                key={label}
                onClick={() => handleDrillDown(mt)}
                className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 ml-auto mt-1 shrink-0" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-semibold text-gray-800">Stock Movements</h2>
            {drillMovType && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MOV_BADGE[drillMovType] || "bg-gray-100 text-gray-600"}`}>
                {drillMovType}
              </span>
            )}
          </div>
          <MovementsPanel initialMovType={drillMovType} />
        </div>
      )}
    </div>
  );
}
