import { useState, useEffect, useCallback } from "react";
import { productsService } from "@/services/productsService";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, Layers, Search } from "lucide-react";

const inputCls =
  "border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";
const btnSm = "px-2 py-1 rounded text-xs font-medium transition";

// ─── Inline editable value chip ───────────────────────────────────────────────
function ValueRow({ value, productId, onRefresh }) {
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(value.value_name);
  const [busy, setBusy]         = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Value name is required");
    setBusy(true);
    try {
      await productsService.updateVariantValue(productId, value.value_id, { value_name: name.trim(), sort_order: value.sort_order });
      toast.success("Value updated");
      setEditing(false);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update value");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove value "${value.value_name}"?`)) return;
    setBusy(true);
    try {
      await productsService.deleteVariantValue(productId, value.value_id);
      toast.success("Value removed");
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove value");
    } finally {
      setBusy(false);
    }
  };

  if (!value.is_active)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-400 text-xs line-through">
        {value.value_name}
      </span>
    );

  if (editing)
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          className={`${inputCls} w-28`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(value.value_name); setEditing(false); } }}
        />
        <button onClick={save} disabled={busy} className={`${btnSm} text-green-700 hover:bg-green-50`}><Check size={13} /></button>
        <button onClick={() => { setName(value.value_name); setEditing(false); }} className={`${btnSm} text-gray-500 hover:bg-gray-100`}><X size={13} /></button>
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs group">
      {value.value_name}
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-opacity"><Pencil size={10} /></button>
      <button onClick={remove} disabled={busy} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"><Trash2 size={10} /></button>
    </span>
  );
}

// ─── Add value inline form ─────────────────────────────────────────────────────
function AddValueForm({ productId, optionId, onRefresh, onCancel }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Value name is required");
    setBusy(true);
    try {
      await productsService.addVariantValue(productId, optionId, { value_name: name.trim() });
      toast.success("Value added");
      setName("");
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add value");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        className={`${inputCls} w-28`}
        placeholder="New value…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel(); }}
      />
      <button onClick={save} disabled={busy} className={`${btnSm} bg-blue-600 text-white hover:bg-blue-700`}>Add</button>
      <button onClick={onCancel} className={`${btnSm} border border-gray-300 text-gray-600 hover:bg-gray-100`}><X size={13} /></button>
    </span>
  );
}

// ─── Option row ────────────────────────────────────────────────────────────────
function OptionRow({ option, productId, onRefresh }) {
  const [expanded, setExpanded]   = useState(true);
  const [editName, setEditName]   = useState(false);
  const [name, setName]           = useState(option.option_name);
  const [addingValue, setAdding]  = useState(false);
  const [busy, setBusy]           = useState(false);

  const saveOption = async () => {
    if (!name.trim()) return toast.error("Option name is required");
    setBusy(true);
    try {
      await productsService.updateVariantOption(productId, option.option_id, { option_name: name.trim(), sort_order: option.sort_order });
      toast.success("Option updated");
      setEditName(false);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update option");
    } finally {
      setBusy(false);
    }
  };

  const removeOption = async () => {
    const activeValues = option.values.filter((v) => v.is_active).length;
    const msg = activeValues > 0
      ? `Remove option "${option.option_name}" and its ${activeValues} value(s)?`
      : `Remove option "${option.option_name}"?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await productsService.deleteVariantOption(productId, option.option_id);
      toast.success("Option removed");
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove option");
    } finally {
      setBusy(false);
    }
  };

  const activeValues = option.values.filter((v) => v.is_active);

  return (
    <div className={`border rounded-lg mb-3 ${option.is_active ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
      {/* Option header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-t-lg">
        <button onClick={() => setExpanded((e) => !e)} className="text-gray-400 hover:text-gray-600 transition-colors">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        {editName ? (
          <>
            <input
              autoFocus
              className={`${inputCls} w-44`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveOption(); if (e.key === "Escape") { setName(option.option_name); setEditName(false); } }}
            />
            <button onClick={saveOption} disabled={busy} className={`${btnSm} text-green-700 hover:bg-green-50`}><Check size={14} /></button>
            <button onClick={() => { setName(option.option_name); setEditName(false); }} className={`${btnSm} text-gray-500 hover:bg-gray-100`}><X size={14} /></button>
          </>
        ) : (
          <span className="font-semibold text-sm text-gray-800 flex-1">{option.option_name}</span>
        )}

        <span className="text-xs text-gray-400">{activeValues.length} value{activeValues.length !== 1 ? "s" : ""}</span>

        {!editName && option.is_active && (
          <>
            <button onClick={() => setEditName(true)} className={`${btnSm} text-gray-500 hover:bg-gray-100`} title="Rename option"><Pencil size={14} /></button>
            <button onClick={removeOption} disabled={busy} className={`${btnSm} text-red-400 hover:bg-red-50`} title="Remove option"><Trash2 size={14} /></button>
          </>
        )}
        {!option.is_active && <span className="text-xs text-gray-400 italic">inactive</span>}
      </div>

      {/* Values */}
      {expanded && (
        <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
          {option.values.map((v) => (
            <ValueRow key={v.value_id} value={v} productId={productId} onRefresh={onRefresh} />
          ))}
          {option.values.length === 0 && !addingValue && (
            <span className="text-xs text-gray-400 italic">No values yet.</span>
          )}
          {addingValue ? (
            <AddValueForm
              productId={productId}
              optionId={option.option_id}
              onRefresh={onRefresh}
              onCancel={() => setAdding(false)}
            />
          ) : (
            option.is_active && (
              <button
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-gray-300 text-gray-400 text-xs hover:border-blue-400 hover:text-blue-500 transition-colors">
                <Plus size={11} /> Add value
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Variants panel ────────────────────────────────────────────────────────────
function VariantsPanel({ product }) {
  const [options, setOptions]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [addingOpt, setAddingOpt]   = useState(false);
  const [newOptName, setNewOptName] = useState("");
  const [busy, setBusy]             = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsService.getProductVariants(product.productid);
      setOptions(data);
    } catch {
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, [product.productid]);

  useEffect(() => { load(); }, [load]);

  const addOption = async () => {
    if (!newOptName.trim()) return toast.error("Option name is required");
    setBusy(true);
    try {
      await productsService.createVariantOption(product.productid, { option_name: newOptName.trim() });
      toast.success("Option added");
      setNewOptName("");
      setAddingOpt(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add option");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{product.name}</h2>
          <p className="text-xs text-gray-400">Variant Options</p>
        </div>
        {!addingOpt && (
          <button
            onClick={() => setAddingOpt(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 transition">
            <Plus size={14} /> Add Option
          </button>
        )}
      </div>

      {/* New option form */}
      {addingOpt && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <input
            autoFocus
            className={`${inputCls} w-52`}
            placeholder="e.g. Size, Color, Material…"
            value={newOptName}
            onChange={(e) => setNewOptName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addOption(); if (e.key === "Escape") { setNewOptName(""); setAddingOpt(false); } }}
          />
          <button onClick={addOption} disabled={busy} className={`${btnSm} bg-green-600 text-white hover:bg-green-700`}>Save</button>
          <button onClick={() => { setNewOptName(""); setAddingOpt(false); }} className={`${btnSm} border border-gray-300 text-gray-600 hover:bg-gray-100`}><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : options.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <Layers size={40} className="mb-3" />
          <p className="text-sm">No variant options defined yet.</p>
          <p className="text-xs mt-1">Click "Add Option" to get started.</p>
        </div>
      ) : (
        options.map((opt) => (
          <OptionRow key={opt.option_id} option={opt} productId={product.productid} onRefresh={load} />
        ))
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProductVariantsPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    setLoading(true);
    productsService
      .getProductList({ search: "", page: 1, limit: 1000 })
      .then((data) => {
        const withVariants = (data.rows || []).filter((p) => p.is_variant_enabled && p.active);
        setAllProducts(withVariants);
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
      {/* ── Left: product list ── */}
      <div className="w-72 shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-base font-bold text-gray-800 mb-3">Product Variants</h1>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-400 p-4">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">
              {allProducts.length === 0
                ? "No variant-enabled products found.\nEnable 'Variant Enabled' flag on a product first."
                : "No products match your search."}
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.productid}
                onClick={() => setSelected(p)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-colors ${
                  selected?.productid === p.productid ? "bg-white border-l-4 border-l-green-500 font-semibold" : ""
                }`}>
                <p className="text-sm text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.productcat}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: variants panel ── */}
      {selected ? (
        <VariantsPanel key={selected.productid} product={selected} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
          <Layers size={56} className="mb-4" />
          <p className="text-lg font-medium">Select a product</p>
          <p className="text-sm mt-1">Choose a variant-enabled product from the list to manage its options and values.</p>
        </div>
      )}
    </div>
  );
}
