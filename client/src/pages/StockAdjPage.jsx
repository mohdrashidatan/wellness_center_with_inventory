import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Save, X, RefreshCw, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdjBalance, createAdjustment } from "@/services/stockAdjService";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function StockAdjPage() {
  const [cutoffDate, setCutoffDate]   = useState(todayStr());
  const [description, setDescription] = useState("");
  const [rows, setRows]               = useState([]);
  const [isLoaded, setIsLoaded]       = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [isSaving, setIsSaving]       = useState(false);

  const handleLoadBalance = async () => {
    setIsLoading(true);
    try {
      const data = await getAdjBalance(cutoffDate);
      setRows(
        data.rows.map((r) => ({
          ...r,
          onhandactual:  "",
          reasonfordiff: "",
        }))
      );
      setIsLoaded(true);
    } catch {
      toast.error("Failed to load stock balance");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setCutoffDate(e.target.value);
    setRows([]);
    setIsLoaded(false);
  };

  const updateRow = (idx, field, value) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );

  const handleSave = async () => {
    if (!cutoffDate) { toast.error("Please select a cut-off date"); return; }
    setIsSaving(true);
    try {
      const lines = rows.map((r) => ({
        itemid:        r.productid,
        onhandstk:     r.balance_qty ?? null,
        onhandactual:  r.onhandactual === "" ? null : parseFloat(r.onhandactual),
        reasonfordiff: r.reasonfordiff || null,
      }));
      await createAdjustment({
        stkadjasatdate:    cutoffDate,
        stkadjdescription: description,
        lines,
      });
      toast.success("Stock adjustment saved successfully");
      handleAbort();
    } catch {
      toast.error("Failed to save adjustment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAbort = () => {
    setCutoffDate(todayStr());
    setDescription("");
    setRows([]);
    setIsLoaded(false);
  };

  const filledCount = rows.filter((r) => r.onhandactual !== "").length;

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <ClipboardList className="w-7 h-7 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Adjustment</h1>
          <p className="text-sm text-gray-500">Enter physical stock count and record adjustments</p>
        </div>
      </div>

      {/* Header form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Adjustment Header</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="cutoffDate">Cut-off Date</Label>
            <Input
              id="cutoffDate"
              type="date"
              value={cutoffDate}
              onChange={handleDateChange}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Remarks / Description</Label>
            <Input
              id="description"
              placeholder="e.g. Monthly stock-take – May 2026"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={handleLoadBalance}
            disabled={isLoading || !cutoffDate}
            variant="outline"
            className="gap-2"
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />}
            {isLoaded ? "Recalculate" : "Load Balance"}
          </Button>
          {isLoaded && (
            <span className="text-sm text-gray-500">
              {rows.length} products loaded
              {filledCount > 0 && (
                <span className="ml-2 text-teal-600 font-medium">· {filledCount} counts entered</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Detail table */}
      {isLoaded && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Stock Balance as at {cutoffDate}
              </span>
              <span className="text-xs text-gray-400">
                System Qty = GRN receipts − DO transfers − POS sales
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">#</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">Item Code</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Sub-category</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 w-32">System Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-teal-700 w-40">
                      Physical Count
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 min-w-[200px]">
                      Reason for Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, idx) => {
                    const hasEntry   = row.onhandactual !== "";
                    const systemQty  = row.balance_qty;
                    const enteredQty = hasEntry ? parseFloat(row.onhandactual) : null;
                    const diff       = hasEntry && systemQty !== null ? enteredQty - systemQty : null;

                    return (
                      <tr
                        key={row.productid}
                        className={`hover:bg-gray-50 ${hasEntry ? "bg-teal-50/30" : ""}`}
                      >
                        <td className="px-4 py-2 text-gray-400 text-xs">{idx + 1}</td>

                        {/* Item code */}
                        <td className="px-4 py-2 font-mono text-xs text-gray-600">{row.itemcode || "—"}</td>

                        {/* Product name */}
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-800">{row.product_name}</div>
                          {row.product_desc && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">{row.product_desc}</div>
                          )}
                        </td>

                        {/* Sub-category */}
                        <td className="px-4 py-2 text-gray-500 text-xs">{row.subcat || "—"}</td>

                        {/* System qty */}
                        <td className="px-4 py-2 text-right font-mono">
                          {systemQty === null ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <span
                              className={
                                systemQty > 0
                                  ? "text-teal-600 font-medium"
                                  : systemQty < 0
                                  ? "text-red-500 font-medium"
                                  : "text-gray-500"
                              }
                            >
                              {Number(systemQty).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </td>

                        {/* Physical count input */}
                        <td className="px-4 py-2">
                          <div className="flex flex-col items-end gap-0.5">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="enter count"
                              value={row.onhandactual}
                              onChange={(e) => updateRow(idx, "onhandactual", e.target.value)}
                              className="text-right w-full h-8 text-sm"
                            />
                            {diff !== null && (
                              <span
                                className={`text-xs font-mono ${
                                  diff > 0
                                    ? "text-teal-600"
                                    : diff < 0
                                    ? "text-red-500"
                                    : "text-gray-400"
                                }`}
                              >
                                {diff > 0 ? "+" : ""}{Number(diff).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} diff
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            placeholder="optional reason"
                            value={row.reasonfordiff}
                            onChange={(e) => updateRow(idx, "reasonfordiff", e.target.value)}
                            className="w-full h-8 text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filledCount === 0
                ? "No physical counts entered yet."
                : `${filledCount} of ${rows.length} items have physical counts entered.`}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleAbort}
                disabled={isSaving}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Abort
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSaving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                Save Adjustment
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
