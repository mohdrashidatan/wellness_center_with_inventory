import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Search, X, Plus } from "lucide-react";
import Modal from "@/shared/Modal";
import { doService } from "@/services/doService";
import DoDetailView from "@/components/do/DoDetailView";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 15;

const fmtDate = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-SG", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const emptyFilters = {
  recipientName: "",
  itemSearch:    "",
  dateExact:     "",
  dateFrom:      "",
  dateTo:        "",
};

export default function DoListPage() {
  const navigate = useNavigate();
  const [rows, setRows]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput]     = useState("");
  const [filters, setFilters]         = useState(emptyFilters);
  const [applied, setApplied]         = useState(emptyFilters);
  const [loading, setLoading]         = useState(false);
  const [viewId, setViewId]           = useState(null);
  const [viewModal, setViewModal]     = useState(false);
  const [dateMode, setDateMode]       = useState("range");

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchData = useCallback(async (page, f) => {
    setLoading(true);
    try {
      const params = { page, limit: ITEMS_PER_PAGE, ...f };
      if (f.dateMode === "exact") {
        params.dateExact = f.dateExact;
        delete params.dateFrom;
        delete params.dateTo;
      } else {
        delete params.dateExact;
      }
      delete params.dateMode;
      const data = await doService.getList(params);
      setRows(data.rows);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load Delivery Order records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentPage, { ...applied, dateMode });
  }, [currentPage, applied, dateMode, fetchData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setApplied({ ...filters });
    setCurrentPage(1);
  };

  const handleClear = () => {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    setDateMode("range");
    setCurrentPage(1);
  };

  const goToPage = (p) => {
    const clamped = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(clamped);
  };

  const handleJump = (e) => {
    if (e.key === "Enter") {
      const p = parseInt(jumpInput);
      if (!isNaN(p)) goToPage(p);
      setJumpInput("");
    }
  };

  const openView = (id) => {
    setViewId(id);
    setViewModal(true);
  };

  const pageButtons = () => {
    const pages = [];
    let start = Math.max(currentPage - 2, 1);
    let end   = Math.min(start + 4, totalPages);
    if (end - start < 4) start = Math.max(end - 4, 1);
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={
            currentPage === i
              ? "font-bold bg-orange-500 text-white px-3 py-1 rounded-sm shadow"
              : "px-3 py-1 hover:text-orange-500"
          }
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <>
      <div className="space-y-4">
        {/* ── Page title ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Delivery Orders List</h1>
          <Button
            onClick={() => navigate("/therapist/stocks/do/new")}
            className="bg-orange-600 hover:bg-orange-700 text-white flex gap-1"
          >
            <Plus className="w-4 h-4" /> New DO
          </Button>
        </div>

        {/* ── Search Panel ── */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Recipient */}
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">Recipient Name</label>
              <input
                name="recipientName"
                value={filters.recipientName}
                onChange={handleFilterChange}
                placeholder="Search recipient…"
                className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>

            {/* Item */}
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">Item Name / Code</label>
              <input
                name="itemSearch"
                value={filters.itemSearch}
                onChange={handleFilterChange}
                placeholder="Search item…"
                className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>

            {/* Date mode toggle */}
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">Date Filter</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDateMode("range")}
                  className={`px-3 py-1 rounded-md text-xs border ${dateMode === "range" ? "bg-orange-500 text-white border-orange-500" : "border-orange-300 text-orange-700"}`}
                >
                  Range
                </button>
                <button
                  onClick={() => setDateMode("exact")}
                  className={`px-3 py-1 rounded-md text-xs border ${dateMode === "exact" ? "bg-orange-500 text-white border-orange-500" : "border-orange-300 text-orange-700"}`}
                >
                  Exact
                </button>
              </div>
            </div>
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dateMode === "exact" ? (
              <div>
                <label className="block text-xs font-medium text-orange-700 mb-1">Transfer Date</label>
                <input
                  type="date"
                  name="dateExact"
                  value={filters.dateExact}
                  onChange={handleFilterChange}
                  className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">Date From</label>
                  <input
                    type="date"
                    name="dateFrom"
                    value={filters.dateFrom}
                    onChange={handleFilterChange}
                    className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">Date To</label>
                  <input
                    type="date"
                    name="dateTo"
                    value={filters.dateTo}
                    onChange={handleFilterChange}
                    className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>
              </>
            )}

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="bg-orange-600 hover:bg-orange-700 flex gap-1">
                <Search className="w-4 h-4" /> Search
              </Button>
              <Button onClick={handleClear} variant="outline" className="flex gap-1 border-orange-300 text-orange-700 hover:bg-orange-50">
                <X className="w-4 h-4" /> Clear
              </Button>
            </div>
          </div>
        </div>

        {/* ── Results summary ── */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>
            {loading ? "Loading…" : `${total} record${total !== 1 ? "s" : ""} found`}
          </span>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-orange-200 overflow-hidden">
          <Table>
            <TableCaption>Delivery Order Details</TableCaption>
            <TableHeader>
              <TableRow className="bg-orange-50">
                <TableHead className="w-28">DO No.</TableHead>
                <TableHead>Transfer Date</TableHead>
                <TableHead>DO Reference</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right w-20">Qty</TableHead>
                <TableHead className="w-20">UOM</TableHead>
                <TableHead className="w-28">Batch No.</TableHead>
                <TableHead className="w-28">Expiry Date</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-12 text-center">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-gray-400 py-10">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-gray-400 py-10">
                    No records found
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.map((r, idx) => (
                <TableRow
                  key={idx}
                  className="hover:bg-orange-500 hover:text-white transition-colors cursor-default"
                >
                  <TableCell className="font-mono font-medium">
                    DO-{String(r.doid).padStart(5, "0")}
                  </TableCell>
                  <TableCell>{fmtDate(r.transferdate)}</TableCell>
                  <TableCell>{r.delivery_order_no || "—"}</TableCell>
                  <TableCell>{r.recipient_name || "—"}</TableCell>
                  <TableCell>{r.product_name || "—"}</TableCell>
                  <TableCell className="text-right">{r.qty ?? "—"}</TableCell>
                  <TableCell>{r.uom || "—"}</TableCell>
                  <TableCell>{r.batch_no || "—"}</TableCell>
                  <TableCell>{fmtDate(r.expiry_date)}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.remarks || "—"}</TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => openView(r.doid)}
                      className="p-1 rounded hover:text-orange-500 transition-colors"
                      title="View DO Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="bg-white shadow px-3 py-1 border border-orange-300 text-sm disabled:opacity-40"
            >
              «
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-white shadow px-3 py-1 border border-orange-300 text-sm disabled:opacity-40"
            >
              Prev
            </button>

            {pageButtons()}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-white shadow px-3 py-1 border border-orange-300 text-sm disabled:opacity-40"
            >
              Next
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="bg-white shadow px-3 py-1 border border-orange-300 text-sm disabled:opacity-40"
            >
              »
            </button>

            <div className="flex items-center gap-1 ml-2 text-sm text-gray-500">
              <span>Go to</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onKeyDown={handleJump}
                placeholder="page"
                className="w-16 border border-orange-200 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <span className="text-xs text-gray-400">(press Enter)</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {viewModal && viewId && (
        <Modal title={`DO-${String(viewId).padStart(5, "0")} — Details`} setIsOpen={setViewModal}>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <DoDetailView doId={viewId} />
          </div>
        </Modal>
      )}
    </>
  );
}
