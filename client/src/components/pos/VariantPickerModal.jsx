import { useState, useEffect } from "react";
import { productsService } from "@/services/productsService";
import { X, ShoppingCart, Loader2 } from "lucide-react";

/**
 * VariantPickerModal — shown when a variant-enabled product is clicked in the POS.
 *
 * Standard POS / sales-invoice pattern:
 *  - Option groups (e.g. Color, Size) displayed as button selectors
 *  - Price updates live once all options are chosen and a matching SKU is found
 *  - "Add to Cart" enabled only when every option has a selection
 *
 * Props:
 *   product      — { productid, name, unitprice, productcat }
 *   onAdd(item)  — called with the cart-item object when user confirms
 *   onClose()    — called when modal is dismissed
 */
export default function VariantPickerModal({ product, onAdd, onClose }) {
  const [options, setOptions]             = useState([]);   // variant options with values
  const [skus, setSkus]                   = useState([]);   // all SKUs with value_ids
  const [selected, setSelected]           = useState({});   // { optionId: valueId }
  const [loading, setLoading]             = useState(true);
  const [qty, setQty]                     = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [optData, skuData] = await Promise.all([
          productsService.getProductVariants(product.productid),
          productsService.getProductSkus(product.productid),
        ]);
        if (!cancelled) {
          setOptions(optData.filter((o) => o.is_active));
          setSkus(skuData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [product.productid]);

  // All active option ids
  const requiredOptionIds = options.map((o) => o.option_id);
  const isComplete = requiredOptionIds.length > 0 && requiredOptionIds.every((id) => selected[id]);

  // Find the matching SKU — sort value_ids of selected values and compare to each SKU
  const matchedSku = isComplete
    ? (() => {
        const selectedValueIds = Object.values(selected).map(Number).sort();
        return skus.find((sku) => {
          const sv = [...sku.value_ids].sort();
          return sv.length === selectedValueIds.length && sv.every((v, i) => v === selectedValueIds[i]);
        });
      })()
    : null;

  const effectivePrice =
    matchedSku?.unitprice ?? matchedSku?.baseprice ?? product.unitprice ?? 0;

  const handleSelect = (optionId, valueId) => {
    setSelected((prev) => ({ ...prev, [optionId]: valueId }));
  };

  const buildVariantLabel = () =>
    options
      .map((opt) => {
        const val = opt.values.find((v) => v.value_id === selected[opt.option_id]);
        return val ? `${opt.option_name}: ${val.value_name}` : null;
      })
      .filter(Boolean)
      .join(", ");

  const handleAdd = () => {
    const variantLabel = buildVariantLabel();
    const price = Number(effectivePrice).toFixed(2);
    const id = matchedSku ? `sku_${matchedSku.sku_id}` : `prod_${product.productid}_${Object.values(selected).sort().join("_")}`;

    onAdd({
      id,
      name: product.name,
      variantLabel,
      price: Number(price),
      type: product.productcat,
      amount: qty,
      subPrice: (Number(price) * qty).toFixed(2),
      discount: 0,
      discpercent: 0,
      skuId: matchedSku?.sku_id ?? null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-800 text-base leading-tight">{product.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{product.productcat}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 size={22} className="animate-spin mr-2" />
              <span className="text-sm">Loading variants…</span>
            </div>
          ) : options.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No variant options defined for this product.</p>
          ) : (
            options.map((opt) => (
              <div key={opt.option_id}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {opt.option_name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {opt.values.filter((v) => v.is_active).map((val) => {
                    const isSelected = selected[opt.option_id] === val.value_id;
                    return (
                      <button
                        key={val.value_id}
                        onClick={() => handleSelect(opt.option_id, val.value_id)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-purple-700 text-white border-purple-700 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:text-purple-700"
                        }`}>
                        {val.value_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — price + qty + add */}
        {!loading && options.length > 0 && (
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
            {/* Price row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {isComplete
                  ? matchedSku
                    ? <span className="text-green-600 font-medium">SKU matched</span>
                    : <span className="text-amber-600 font-medium">No SKU — using base price</span>
                  : "Select all options to see price"}
              </span>
              <span className="text-xl font-bold text-gray-800">
                {isComplete ? `$${Number(effectivePrice).toFixed(2)}` : "—"}
              </span>
            </div>

            {/* Qty + Add */}
            <div className="flex items-center gap-3">
              {/* Quantity control */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition font-semibold text-sm">
                  −
                </button>
                <span className="px-3 py-2 text-sm font-semibold min-w-[2rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition font-semibold text-sm">
                  +
                </button>
              </div>

              {/* Add to cart */}
              <button
                disabled={!isComplete}
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-700 text-white font-semibold text-sm hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <ShoppingCart size={16} />
                Add to Cart
                {isComplete && <span className="opacity-80">· ${(Number(effectivePrice) * qty).toFixed(2)}</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
