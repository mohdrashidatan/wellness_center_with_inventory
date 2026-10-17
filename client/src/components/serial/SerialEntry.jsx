import { useState, useEffect, useCallback } from "react";
import { Plus, X, ScanLine } from "lucide-react";
import { serialService } from "@/services/serialService";

/**
 * Serial capture for one document line.
 *
 * mode="in"  (GRN)      — serials are OPTIONAL; type or scan whatever is on the box.
 * mode="out" (POS / DO)  — serials leave stock. Units already registered are offered
 *                          as a datalist; a serial that does not exist yet is accepted,
 *                          which is the "serial applied on sale" case.
 *
 * Holds no opinion about saving: it reports the current list upward via onChange,
 * and the parent sends it with the line.
 */
export default function SerialEntry({
  productId,
  qty = 0,
  value = [],
  onChange,
  mode = "out",
  captureAt,
  disabled = false,
}) {
  const [available, setAvailable] = useState([]);
  const [draft, setDraft] = useState("");

  const expected = Number(qty) || 0;
  const entered = value.length;

  // Only "Receipt" products have units sitting in stock to choose from.
  const loadAvailable = useCallback(async () => {
    if (!productId || mode !== "out" || captureAt === "Sale") return setAvailable([]);
    try {
      setAvailable(await serialService.getAvailable(productId));
    } catch {
      setAvailable([]);
    }
  }, [productId, mode, captureAt]);

  useEffect(() => { loadAvailable(); }, [loadAvailable]);

  const add = (raw) => {
    // Accept a pasted or scanned block: one serial per line, or comma separated.
    const parts = String(raw)
      .split(/[\n,;\t]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    const seen = new Set(value.map((v) => v.toUpperCase()));
    const next = [...value];
    for (const p of parts) {
      if (seen.has(p.toUpperCase())) continue; // no duplicates within one line
      seen.add(p.toUpperCase());
      next.push(p);
    }
    onChange(next);
    setDraft("");
  };

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    // Enter / Tab commits; barcode scanners send Enter automatically.
    if (e.key === "Enter" || (e.key === "Tab" && draft.trim())) {
      e.preventDefault();
      add(draft);
    }
  };

  const countCls =
    expected === 0 ? "text-gray-400"
    : entered === expected ? "text-green-600"
    : entered > expected ? "text-red-600"
    : "text-amber-600";

  const listId = `serial-avail-${productId || "none"}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <ScanLine size={13} className="text-gray-400 shrink-0" />
        <input
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
          placeholder={mode === "in" ? "Serial no (optional) — Enter to add" : "Scan or type serial — Enter to add"}
          value={draft}
          list={available.length > 0 ? listId : undefined}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (/[\n,;\t]/.test(text)) {
              e.preventDefault();
              add(text);
            }
          }}
        />
        {available.length > 0 && (
          <datalist id={listId}>
            {available.map((s) => (
              <option key={s.serial_id} value={s.serial_no}>{s.status}</option>
            ))}
          </datalist>
        )}
        <button
          type="button"
          disabled={disabled || !draft.trim()}
          onClick={() => add(draft)}
          className="p-1 rounded border border-gray-300 text-gray-500 hover:text-green-600 hover:border-green-500 disabled:opacity-40 transition"
          title="Add serial">
          <Plus size={13} />
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((s, idx) => (
            <span key={`${s}-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-mono text-gray-700">
              {s}
              {!disabled && (
                <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-red-500" title="Remove">
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <p className={`text-[11px] ${countCls}`}>
        {entered} of {expected} serial{expected === 1 ? "" : "s"}
        {mode === "in" && " (optional)"}
        {entered > expected && expected > 0 && " — more serials than qty"}
        {captureAt === "Sale" && mode === "out" && " — applied at sale"}
      </p>
    </div>
  );
}
