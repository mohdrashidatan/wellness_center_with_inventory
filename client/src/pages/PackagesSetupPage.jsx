import { useState, useEffect, useCallback } from "react";
import { packageService } from "@/services/packageService";
import { productsService } from "@/services/productsService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, Users, Package } from "lucide-react";

// ─── Shared styles ─────────────────────────────────────────────────────────────
const inputCls = "w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400";
const labelCls = "block text-xs text-gray-500 mb-1";
const btnPrimary = "px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition";
const btnSecondary = "px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-100 transition";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtPrice = (v) => v == null ? "—" : `$${Number(v).toFixed(2)}`;

// ─── Inline modal overlay ─────────────────────────────────────────────────────
function ModalOverlay({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Package header form (used in create and edit) ────────────────────────────
function PackageHeaderFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={labelCls}>Description *</label>
        <input className={inputCls} value={form.packagedesc} onChange={(e) => onChange("packagedesc", e.target.value)} placeholder="e.g. Trilogy Package" />
      </div>
      <div>
        <label className={labelCls}>Price ($)</label>
        <input type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={(e) => onChange("price", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>No. of Sessions</label>
        <input type="number" min="1" className={inputCls} value={form.noofsession} onChange={(e) => onChange("noofsession", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Expiry Days</label>
        <input type="number" min="1" className={inputCls} value={form.expiry_days} onChange={(e) => onChange("expiry_days", e.target.value)} placeholder="e.g. 365" />
      </div>
    </div>
  );
}

// ─── Detail line row (inside Edit modal) ─────────────────────────────────────
function DetailRow({ detail, packageId, onRefresh }) {
  const [editPrice, setEditPrice] = useState(false);
  const [price, setPrice] = useState(detail.consumeprice);
  const [busy, setBusy] = useState(false);

  const savePrice = async () => {
    setBusy(true);
    try {
      await packageService.updatePackageDetail(detail.packagedetailsid, { consumeprice: price });
      toast.success("Price updated");
      setEditPrice(false);
      onRefresh();
    } catch { toast.error("Failed to update price"); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Remove "${detail.product_name}" from this package?`)) return;
    setBusy(true);
    try {
      await packageService.deletePackageDetail(detail.packagedetailsid);
      toast.success("Item removed");
      onRefresh();
    } catch { toast.error("Failed to remove item"); }
    finally { setBusy(false); }
  };

  return (
    <tr className={`border-b ${!detail.active ? "opacity-50" : ""}`}>
      <td className="py-2 px-3 text-sm">
        {detail.product_name}
        {!detail.active && <span className="ml-2 text-xs text-gray-400 italic">(inactive)</span>}
      </td>
      <td className="py-2 px-3 text-xs text-gray-400">{detail.productcat}</td>
      <td className="py-2 px-3 text-sm text-right">
        {editPrice ? (
          <span className="inline-flex items-center gap-1">
            <input type="number" min="0" step="0.01" autoFocus
              className="w-24 border border-gray-300 rounded px-2 py-0.5 text-sm text-right"
              value={price} onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") savePrice(); if (e.key === "Escape") { setPrice(detail.consumeprice); setEditPrice(false); } }}
            />
            <button onClick={savePrice} disabled={busy} className="text-green-600 hover:text-green-800"><Check size={13} /></button>
            <button onClick={() => { setPrice(detail.consumeprice); setEditPrice(false); }} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            {fmtPrice(detail.consumeprice)}
            {detail.active && <button onClick={() => setEditPrice(true)} className="text-gray-400 hover:text-blue-500"><Pencil size={12} /></button>}
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-center">
        {detail.active && (
          <button onClick={remove} disabled={busy} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
        )}
      </td>
    </tr>
  );
}

// ─── Add detail line inline form ──────────────────────────────────────────────
function AddDetailForm({ packageId, products, onRefresh, onCancel }) {
  const [productid, setProductid] = useState("");
  const [consumeprice, setConsumeprice] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!productid) return toast.error("Select a product");
    setBusy(true);
    try {
      await packageService.addPackageDetail(packageId, { productid: Number(productid), consumeprice: consumeprice || 0 });
      toast.success("Item added");
      onRefresh();
      onCancel();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to add item"); }
    finally { setBusy(false); }
  };

  return (
    <tr className="border-b bg-green-50">
      <td className="py-2 px-3">
        <select className="border border-gray-300 rounded px-2 py-1 text-sm w-full" value={productid} onChange={(e) => setProductid(e.target.value)}>
          <option value="">— Select product —</option>
          {products.map((p) => (
            <option key={p.productid} value={p.productid}>
              {`PRD-${String(p.productid).padStart(4, "0")}  ${p.name}  [${p.productcat || "—"}]`}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 px-3 text-xs text-gray-400">
        {productid && products.find((p) => p.productid === Number(productid))?.productcat}
      </td>
      <td className="py-2 px-3">
        <input type="number" min="0" step="0.01" placeholder="Consume price"
          className="border border-gray-300 rounded px-2 py-1 text-sm w-24 text-right"
          value={consumeprice} onChange={(e) => setConsumeprice(e.target.value)} />
      </td>
      <td className="py-2 px-3 text-center">
        <span className="inline-flex gap-1">
          <button onClick={save} disabled={busy} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </span>
      </td>
    </tr>
  );
}

// ─── Edit Package Modal ───────────────────────────────────────────────────────
function EditPackageModal({ pkg, products, onClose, onRefreshed }) {
  const [form, setForm] = useState({
    packagedesc: pkg.packagedesc || "",
    price: pkg.price ?? "",
    noofsession: pkg.noofsession ?? "",
    expiry_days: pkg.expiry_days ?? "",
  });
  const [details, setDetails] = useState(pkg.details || []);
  const [addingDetail, setAddingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const onChange = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const refreshDetails = async () => {
    const list = await packageService.getPackageList();
    const updated = list.find((p) => p.packageid === pkg.packageid);
    if (updated) setDetails(updated.details);
    onRefreshed();
  };

  const save = async () => {
    if (!form.packagedesc.trim()) return toast.error("Description is required");
    setSaving(true);
    try {
      await packageService.updatePackage(pkg.packageid, form);
      toast.success("Package saved");
      onRefreshed();
      onClose();
    } catch { toast.error("Failed to save package"); }
    finally { setSaving(false); }
  };

  return (
    <ModalOverlay title={`Edit Package — ${pkg.packagedesc}`} onClose={onClose}>
      <div className="space-y-5">
        <PackageHeaderFields form={form} onChange={onChange} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Items Included</p>
            {!addingDetail && (
              <button onClick={() => setAddingDetail(true)}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium">
                <Plus size={13} /> Add Item
              </button>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="py-2 px-3 text-left">Product</th>
                  <th className="py-2 px-3 text-left">Type</th>
                  <th className="py-2 px-3 text-right">Consume Price</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {details.map((d) => (
                  <DetailRow key={d.packagedetailsid} detail={d} packageId={pkg.packageid} onRefresh={refreshDetails} />
                ))}
                {addingDetail && (
                  <AddDetailForm packageId={pkg.packageid} products={products} onRefresh={refreshDetails} onCancel={() => setAddingDetail(false)} />
                )}
                {details.length === 0 && !addingDetail && (
                  <tr><td colSpan={4} className="text-center py-4 text-xs text-gray-400">No items yet. Click "Add Item" to start.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onClose} className={btnSecondary}>Cancel</button>
          <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Create Package Modal ─────────────────────────────────────────────────────
function CreatePackageModal({ products, onClose, onCreated }) {
  const [form, setForm] = useState({ packagedesc: "", price: "", noofsession: "", expiry_days: "" });
  const [draftDetails, setDraftDetails] = useState([]);
  const [addRow, setAddRow] = useState(false);
  const [draftProduct, setDraftProduct] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const addDraftRow = () => {
    if (!draftProduct) return toast.error("Select a product");
    const prod = products.find((p) => p.productid === Number(draftProduct));
    setDraftDetails((prev) => [...prev, { productid: Number(draftProduct), product_name: prod?.name, productcat: prod?.productcat, consumeprice: draftPrice || 0 }]);
    setDraftProduct(""); setDraftPrice(""); setAddRow(false);
  };

  const removeDraftRow = (idx) => setDraftDetails((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    if (!form.packagedesc.trim()) return toast.error("Description is required");
    setSaving(true);
    try {
      await packageService.createPackage({ ...form, details: draftDetails });
      toast.success("Package created");
      onCreated();
      onClose();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to create package"); }
    finally { setSaving(false); }
  };

  return (
    <ModalOverlay title="New Package" onClose={onClose}>
      <div className="space-y-5">
        <PackageHeaderFields form={form} onChange={onChange} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Items Included</p>
            {!addRow && (
              <button onClick={() => setAddRow(true)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium">
                <Plus size={13} /> Add Item
              </button>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="py-2 px-3 text-left">Product</th>
                  <th className="py-2 px-3 text-left">Type</th>
                  <th className="py-2 px-3 text-right">Consume Price</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {draftDetails.map((d, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-3 text-sm">{d.product_name}</td>
                    <td className="py-2 px-3 text-xs text-gray-400">{d.productcat}</td>
                    <td className="py-2 px-3 text-right text-sm">{fmtPrice(d.consumeprice)}</td>
                    <td className="py-2 px-3 text-center">
                      <button onClick={() => removeDraftRow(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                    </td>
                  </tr>
                ))}
                {addRow && (
                  <tr className="border-b bg-green-50">
                    <td className="py-2 px-3">
                      <select className="border border-gray-300 rounded px-2 py-1 text-sm w-full" value={draftProduct} onChange={(e) => setDraftProduct(e.target.value)}>
                        <option value="">— Select product —</option>
                        {products.map((p) => (
                          <option key={p.productid} value={p.productid}>
                            {`PRD-${String(p.productid).padStart(4, "0")}  ${p.name}  [${p.productcat || "—"}]`}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-400">
                      {draftProduct && products.find((p) => p.productid === Number(draftProduct))?.productcat}
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min="0" step="0.01" placeholder="0.00"
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-24 text-right"
                        value={draftPrice} onChange={(e) => setDraftPrice(e.target.value)} />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex gap-1">
                        <button onClick={addDraftRow} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
                        <button onClick={() => { setAddRow(false); setDraftProduct(""); setDraftPrice(""); }} className="text-gray-400"><X size={14} /></button>
                      </span>
                    </td>
                  </tr>
                )}
                {draftDetails.length === 0 && !addRow && (
                  <tr><td colSpan={4} className="text-center py-4 text-xs text-gray-400">No items added yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onClose} className={btnSecondary}>Cancel</button>
          <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Create Package"}</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Packages tab ─────────────────────────────────────────────────────────────
function PackagesTab({ packages, products, loading, onRefresh }) {
  const [modal, setModal] = useState(null); // null | 'create' | pkg-object
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{packages.length} package{packages.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setModal("create")} className={btnPrimary + " flex items-center gap-1.5"}>
          <Plus size={14} /> New Package
        </button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-2 px-3 text-left w-8"></th>
              <th className="py-2 px-3 text-left">Description</th>
              <th className="py-2 px-3 text-right">Price</th>
              <th className="py-2 px-3 text-center">Sessions</th>
              <th className="py-2 px-3 text-center">Expiry (days)</th>
              <th className="py-2 px-3 text-center">Items</th>
              <th className="py-2 px-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
            ) : packages.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No packages found.</td></tr>
            ) : packages.map((pkg) => (
              <>
                <tr key={pkg.packageid} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <button onClick={() => toggle(pkg.packageid)} className="text-gray-400 hover:text-gray-700">
                      {expanded[pkg.packageid] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </td>
                  <td className="py-2 px-3 font-medium">{pkg.packagedesc}</td>
                  <td className="py-2 px-3 text-right">{fmtPrice(pkg.price)}</td>
                  <td className="py-2 px-3 text-center">{pkg.noofsession ?? "—"}</td>
                  <td className="py-2 px-3 text-center">{pkg.expiry_days ?? "—"}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-green-600 font-medium">{pkg.details.filter((d) => d.active).length}</span>
                      {pkg.details.filter((d) => !d.active).length > 0 && (
                        <span className="text-gray-400 text-xs">+{pkg.details.filter((d) => !d.active).length} inactive</span>
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button onClick={() => setModal(pkg)} className="text-gray-400 hover:text-blue-600 transition" title="Edit">
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
                {expanded[pkg.packageid] && (
                  <tr key={`${pkg.packageid}-details`} className="bg-gray-50 border-b">
                    <td></td>
                    <td colSpan={6} className="py-2 px-3">
                      {pkg.details.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No items.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {pkg.details.map((d) => (
                            <span key={d.packagedetailsid}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${d.active ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-100 border-gray-200 text-gray-400 line-through"}`}>
                              {d.product_name} · {fmtPrice(d.consumeprice)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "create" && (
        <CreatePackageModal products={products} onClose={() => setModal(null)} onCreated={onRefresh} />
      )}
      {modal && modal !== "create" && (
        <EditPackageModal pkg={modal} products={products} onClose={() => setModal(null)} onRefreshed={onRefresh} />
      )}
    </div>
  );
}

// ─── Customer Usage tab ───────────────────────────────────────────────────────
function CustomerUsageTab({ packages }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPkg, setFilterPkg] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await packageService.getCustomerPackageUsage({ packageId: filterPkg, search });
      setRows(data);
    } catch { toast.error("Failed to load customer usage"); }
    finally { setLoading(false); }
  }, [filterPkg, search]);

  useEffect(() => { load(); }, [load]);

  const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) < new Date();

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-56"
          value={filterPkg} onChange={(e) => setFilterPkg(e.target.value)}>
          <option value="">All Packages</option>
          {packages.map((p) => (
            <option key={p.packageid} value={p.packageid}>{p.packagedesc}</option>
          ))}
        </select>
        <input className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-56"
          placeholder="Search customer or package…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="self-center text-xs text-gray-400">{rows.length} record{rows.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Customer</TableHead>
              <TableHead>Package</TableHead>
              <TableHead className="text-center">Purchase Date</TableHead>
              <TableHead className="text-center">Expiry Date</TableHead>
              <TableHead className="text-center">Original</TableHead>
              <TableHead className="text-center">Used</TableHead>
              <TableHead className="text-center">Remaining</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">No records found.</TableCell></TableRow>
            ) : rows.map((r) => {
              const expired = isExpired(r.expiry_date);
              const depleted = r.remainsessions <= 0;
              const statusLabel = expired ? "Expired" : depleted ? "Depleted" : "Active";
              const statusCls = expired || depleted ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700";
              const usedPct = r.origsessions > 0 ? Math.round((r.used_sessions / r.origsessions) * 100) : 0;

              return (
                <TableRow key={r.custpackageid}>
                  <TableCell>
                    <p className="font-medium text-sm">{r.customer_name}</p>
                    <p className="text-xs text-gray-400">{r.customer_email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{r.packagedesc}</p>
                    <p className="text-xs text-gray-400">{fmtPrice(r.package_price)}</p>
                  </TableCell>
                  <TableCell className="text-center text-sm">{fmtDate(r.purchase_date)}</TableCell>
                  <TableCell className="text-center text-sm">{fmtDate(r.expiry_date)}</TableCell>
                  <TableCell className="text-center text-sm">{r.origsessions ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm text-orange-600 font-medium">{r.used_sessions ?? 0}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold text-sm">{r.remainsessions ?? 0}</span>
                      {r.origsessions > 0 && (
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${depleted ? "bg-red-400" : "bg-green-500"}`}
                            style={{ width: `${Math.max(0, 100 - usedPct)}%` }} />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>{statusLabel}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PackagesSetupPage() {
  const [tab, setTab] = useState("packages");
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await packageService.getPackageList();
      setPackages(data);
    } catch { toast.error("Failed to load packages"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);

  useEffect(() => {
    productsService.getProducts()
      .then((data) => setProducts(data.filter((p) => p.active)))
      .catch(() => {});
  }, []);

  const tabs = [
    { id: "packages", label: "Packages", icon: <Package size={15} /> },
    { id: "usage", label: "Customer Usage", icon: <Users size={15} /> },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Packages</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t.id
                ? "border-purple-700 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "packages" && (
        <PackagesTab packages={packages} products={products} loading={loading} onRefresh={loadPackages} />
      )}
      {tab === "usage" && (
        <CustomerUsageTab packages={packages} />
      )}
    </div>
  );
}
