import { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, X } from "lucide-react";
import Modal from "@/shared/Modal";
import SearchBar from "@/shared/SearchBar";
import { customerService } from "@/services/customerService";
import { doService } from "@/services/doService";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 15;

const emptyForm = {
  name: "", email: "", contact_no: "", dateOfBirth: "",
  address: "", postalcode: "", country: "",
  emergency_contact_name: "", emergency_contact_no: "",
  username: "", deliverymethod: "",
  referred_by: "", referred_other: "",
};

const inputCls =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400";

function Field({ label, children, wide = false }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function CustomerListPage() {
  const [list, setList]           = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm]   = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  // activeFilter: null | { type: 'top-customers', ids: number[] }
  //                      | { type: 'product', productId: number, ids: number[] }

  const [topCustomers, setTopCustomers] = useState([]);
  const [topProducts, setTopProducts]   = useState([]);

  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData]   = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, tCusts, tProds] = await Promise.all([
        customerService.getAll(),
        doService.getTopCustomers(),
        doService.getTopProducts(),
      ]);
      const sorted = [...data].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setList(sorted);
      setTopCustomers(tCusts);
      setTopProducts(tProds);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Recompute filtered whenever list, searchTerm, or activeFilter changes
  useEffect(() => {
    let result = list;
    if (activeFilter) {
      result = result.filter((c) => activeFilter.ids.includes(c.customerid));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name       || "").toLowerCase().includes(term) ||
          (c.contact_no || "").toLowerCase().includes(term) ||
          (c.email      || "").toLowerCase().includes(term) ||
          (c.username   || "").toLowerCase().includes(term)
      );
    }
    setFiltered(result);
    setCurrentPage(1);
  }, [list, searchTerm, activeFilter]);

  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentRows = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleTopCustomersClick = () => {
    if (activeFilter?.type === "top-customers") {
      setActiveFilter(null);
    } else {
      setActiveFilter({
        type: "top-customers",
        ids: topCustomers.map((c) => c.customerid),
      });
    }
  };

  const handleTopProductClick = (product) => {
    if (activeFilter?.type === "product" && activeFilter.productId === product.productid) {
      setActiveFilter(null);
    } else {
      setActiveFilter({
        type: "product",
        productId: product.productid,
        ids: product.customerIds,
      });
    }
  };

  const safeDateStr = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const openEdit = (item) => {
    setFormData({
      name:                    item.name                    || "",
      email:                   item.email                   || "",
      contact_no:              item.contact_no              || "",
      dateOfBirth:             safeDateStr(item.dateofbirth || item.dateOfBirth),
      address:                 item.address                 || "",
      postalcode:              item.postalcode              || "",
      country:                 item.country                 || "",
      emergency_contact_name:  item.emergency_contact_name  || "",
      emergency_contact_no:    item.emergency_contact_no    || "",
      username:                item.username                || "",
      deliverymethod:          item.deliverymethod          || "",
      referred_by:             item.referred_by             || "",
      referred_other:          item.referred_other          || "",
    });
    setEditingId(item.customerid);
    setFormError("");
    setEditModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...formData, dateOfBirth: formData.dateOfBirth || null };
      await customerService.updateRegistration(editingId, payload, []);
      toast.success("Customer updated");
      setEditModal(false);
      fetchData();
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
      </div>
    );

  return (
    <>
      {/* Summary Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Panel 1 — Top Customers */}
        <div
          onClick={handleTopCustomersClick}
          className={`border rounded-lg p-4 cursor-pointer select-none transition-all ${
            activeFilter?.type === "top-customers"
              ? "border-orange-400 bg-orange-50 shadow-sm"
              : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-700">
              Top 3 Customers by Delivery Orders
            </h3>
            {activeFilter?.type === "top-customers" && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-medium">
                Filtered
              </span>
            )}
          </div>
          <div className="space-y-2">
            {topCustomers.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">No data</p>
            )}
            {topCustomers.map((c, i) => (
              <div key={c.customerid} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  {c.username && (
                    <span className="text-xs text-gray-400 hidden sm:inline">@{c.username}</span>
                  )}
                </div>
                <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 shrink-0 ml-2">
                  {c.do_count} DO{c.do_count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
          {topCustomers.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              {activeFilter?.type === "top-customers" ? "Click to clear filter" : "Click to filter list"}
            </p>
          )}
        </div>

        {/* Panel 2 — Top Products */}
        <div className={`border rounded-lg p-4 bg-white transition-all ${
          activeFilter?.type === "product" ? "border-purple-300 shadow-sm" : "border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-700">
              Top 3 Products by Quantity Delivered
            </h3>
            {activeFilter?.type === "product" && (
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-medium">
                Filtered
              </span>
            )}
          </div>
          <div className="space-y-1">
            {topProducts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">No data</p>
            )}
            {topProducts.map((p, i) => {
              const isActive =
                activeFilter?.type === "product" && activeFilter.productId === p.productid;
              return (
                <div
                  key={p.productid}
                  onClick={() => handleTopProductClick(p)}
                  className={`flex items-center justify-between cursor-pointer select-none rounded-md px-2 py-1.5 transition-colors ${
                    isActive
                      ? "bg-purple-100 text-purple-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 ${
                        isActive ? "bg-purple-200 text-purple-700" : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium truncate">{p.product_name}</span>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 shrink-0 ml-2">
                    {p.total_qty} units
                  </span>
                </div>
              );
            })}
          </div>
          {topProducts.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              Click a product to filter customers
            </p>
          )}
        </div>
      </div>

      {/* List Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Customers</h1>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
              Clear filter
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          <SearchBar handleSearch={handleSearch} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Contact No.</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Delivery Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-400 py-10">
                No customers found
              </TableCell>
            </TableRow>
          )}
          {currentRows.map((item, idx) => (
            <TableRow
              key={item.customerid}
              className="hover:bg-orange-50 cursor-pointer"
              onClick={() => openEdit(item)}
            >
              <TableCell className="text-gray-400 text-xs">
                {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-gray-500 text-sm">{item.username || "—"}</TableCell>
              <TableCell>{item.contact_no || "—"}</TableCell>
              <TableCell>{item.email || "—"}</TableCell>
              <TableCell>{item.deliverymethod || "—"}</TableCell>
              <TableCell className={item.active ? "text-green-600 text-sm" : "text-red-500 text-sm"}>
                {item.active ? "Active" : "Inactive"}
              </TableCell>
              <TableCell>
                <Pencil className="w-4 text-gray-400 hover:text-blue-500" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 items-center">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="bg-white shadow-lg p-1 border border-purple-500 disabled:opacity-40"
          >
            Prev
          </button>
          {(() => {
            const pages = [];
            let start = Math.max(currentPage - 1, 1);
            let end   = Math.min(start + 2, totalPages);
            if (end - start < 2) start = Math.max(end - 2, 1);
            for (let i = start; i <= end; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={
                    currentPage === i
                      ? "font-bold bg-purple-500 p-1 shadow-lg rounded-sm text-white"
                      : "p-1"
                  }
                >
                  {i}
                </button>
              );
            }
            return pages;
          })()}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-white shadow-lg p-1 border border-purple-500 disabled:opacity-40"
          >
            Next
          </button>
          <span className="ml-2 text-xs text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title="Edit Customer" setIsOpen={setEditModal}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
            <Field label="Name *">
              <input name="name" value={formData.name} onChange={handleChange}
                maxLength={100} className={inputCls} placeholder="Full name" />
            </Field>
            <Field label="Username">
              <input name="username" value={formData.username} onChange={handleChange}
                maxLength={15} className={inputCls} placeholder="Username" />
            </Field>
            <Field label="Contact No.">
              <input name="contact_no" value={formData.contact_no} onChange={handleChange}
                maxLength={50} className={inputCls} placeholder="Contact number" />
            </Field>
            <Field label="Email">
              <input name="email" type="email" value={formData.email} onChange={handleChange}
                maxLength={100} className={inputCls} placeholder="Email address" />
            </Field>
            <Field label="Date of Birth">
              <input name="dateOfBirth" type="date" value={formData.dateOfBirth}
                onChange={handleChange} className={inputCls} />
            </Field>
            <Field label="Delivery Method">
              <input name="deliverymethod" value={formData.deliverymethod} onChange={handleChange}
                maxLength={20} className={inputCls} placeholder="Delivery method" />
            </Field>
            <Field label="Address" wide>
              <input name="address" value={formData.address} onChange={handleChange}
                maxLength={255} className={inputCls} placeholder="Address" />
            </Field>
            <Field label="Postal Code">
              <input name="postalcode" value={formData.postalcode} onChange={handleChange}
                maxLength={20} className={inputCls} placeholder="Postal code" />
            </Field>
            <Field label="Country">
              <input name="country" value={formData.country} onChange={handleChange}
                maxLength={100} className={inputCls} placeholder="Country" />
            </Field>
            <Field label="Emergency Contact Name">
              <input name="emergency_contact_name" value={formData.emergency_contact_name}
                onChange={handleChange} maxLength={100} className={inputCls}
                placeholder="Emergency contact name" />
            </Field>
            <Field label="Emergency Contact No.">
              <input name="emergency_contact_no" value={formData.emergency_contact_no}
                onChange={handleChange} maxLength={50} className={inputCls}
                placeholder="Emergency contact number" />
            </Field>
            <Field label="Referred By">
              <input name="referred_by" value={formData.referred_by} onChange={handleChange}
                maxLength={100} className={inputCls} placeholder="Referred by" />
            </Field>
            <Field label="Referred Other">
              <input name="referred_other" value={formData.referred_other} onChange={handleChange}
                maxLength={100} className={inputCls} placeholder="Other referral detail" />
            </Field>
          </div>
          {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-prime-color hover:bg-prime-color-hover"
            >
              {saving && <Loader2 className="animate-spin w-4 h-4 mr-1" />}
              Save Changes
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
