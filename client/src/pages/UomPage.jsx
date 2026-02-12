import { useState, useEffect } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import Modal from "@/shared/Modal";
import SearchBar from "@/shared/SearchBar";
import { uomService } from "@/services/uomService";
import toast from "react-hot-toast";

const UOM_TYPES = ["quantity", "weight", "volume", "length", "other"];

const emptyForm = { code: "", name: "", uom_type: "quantity", is_active: 1 };

export default function UomPage() {
  const [uomList, setUomList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [formModal, setFormModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      const data = await uomService.getAll();
      setUomList(data);
      setFiltered(data);
    } catch (err) {
      toast.error("Failed to load UOM list");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentRows = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => {
    const val = e.target.value.toLowerCase();
    setFiltered(uomList.filter((u) => u.code.toLowerCase().includes(val) || u.name.toLowerCase().includes(val)));
    setCurrentPage(1);
  };

  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormError("");
    setFormModal(true);
  };

  const openEdit = (item, e) => {
    e.stopPropagation();
    setFormData({ code: item.code, name: item.name, uom_type: item.uom_type, is_active: item.is_active });
    setEditingId(item.uom_id);
    setFormError("");
    setFormModal(true);
  };

  const openView = (item) => {
    setSelectedItem(item);
    setViewModal(true);
  };

  const openDelete = (item, e) => {
    e.stopPropagation();
    setSelectedItem(item);
    setDeleteModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (checked ? 1 : 0) : value }));
  };

  const handleSave = async () => {
    setFormError("");
    try {
      if (editingId) {
        await uomService.update(editingId, formData);
        toast.success("UOM updated");
      } else {
        await uomService.create(formData);
        toast.success("UOM created");
      }
      setFormModal(false);
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to save";
      setFormError(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await uomService.remove(selectedItem.uom_id);
      toast.success("UOM deleted");
      setDeleteModal(false);
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to delete";
      toast.error(msg);
      setDeleteModal(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Unit of Measure (UOM)</h1>
        <div className="flex items-center gap-3">
          <SearchBar handleSearch={handleSearch} />
          <Button onClick={openAdd} className="bg-prime-color hover:bg-prime-color-hover">
            + Add UOM
          </Button>
        </div>
      </div>

      <Table>
        <TableCaption>List of Unit of Measure</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                No UOM records found
              </TableCell>
            </TableRow>
          )}
          {currentRows.map((item, idx) => (
            <TableRow
              key={item.uom_id}
              className="hover:bg-prime-color cursor-pointer hover:text-white transition-colors"
              onDoubleClick={() => openView(item)}
            >
              <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
              <TableCell className="font-medium">{item.code}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell className="capitalize">{item.uom_type}</TableCell>
              <TableCell className={item.is_active ? "text-green-600" : "text-red-500"}>
                {item.is_active ? "Active" : "Inactive"}
              </TableCell>
              <TableCell className="flex gap-2">
                <Pencil
                  className="w-4 cursor-pointer hover:text-blue-400 transition duration-200"
                  onClick={(e) => openEdit(item, e)}
                />
                <Trash2
                  className="w-4 cursor-pointer hover:text-red-500 transition duration-200"
                  onClick={(e) => openDelete(item, e)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 m-4 items-center">
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
            let end = Math.min(start + 2, totalPages);
            if (end - start < 2) start = Math.max(end - 2, 1);
            for (let i = start; i <= end; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={currentPage === i ? "font-bold bg-purple-500 p-1 shadow-lg rounded-sm text-white" : "p-1"}
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
        </div>
      )}

      {/* Add / Edit Modal */}
      {formModal && (
        <Modal title={editingId ? "Edit UOM" : "Add UOM"} setIsOpen={setFormModal} small={true}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                maxLength={10}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="e.g. PCS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                maxLength={50}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="e.g. Pieces"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="uom_type"
                value={formData.uom_type}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {UOM_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {editingId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={!!formData.is_active}
                  onChange={handleFormChange}
                  className="w-4 h-4 accent-purple-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            )}
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <Button onClick={handleSave} className="bg-prime-color hover:bg-prime-color-hover w-full mt-1">
              {editingId ? "Save Changes" : "Add UOM"}
            </Button>
          </div>
        </Modal>
      )}

      {/* View Detail Modal (double-click) */}
      {viewModal && selectedItem && (
        <Modal title="UOM Details" setIsOpen={setViewModal} small={true}>
          <div className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="text-gray-500">Code</span>
              <span className="font-semibold">{selectedItem.code}</span>
              <span className="text-gray-500">Name</span>
              <span className="font-semibold">{selectedItem.name}</span>
              <span className="text-gray-500">Type</span>
              <span className="capitalize">{selectedItem.uom_type}</span>
              <span className="text-gray-500">Status</span>
              <span className={selectedItem.is_active ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                {selectedItem.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <Button
              onClick={() => { setViewModal(false); openEdit(selectedItem, { stopPropagation: () => {} }); }}
              className="bg-prime-color hover:bg-prime-color-hover w-full mt-2"
            >
              Edit
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && selectedItem && (
        <Modal title="Confirm Delete" setIsOpen={setDeleteModal} small={true}>
          <p className="text-sm text-gray-700">
            Delete UOM <strong>{selectedItem.code} – {selectedItem.name}</strong>?
            This cannot be undone.
          </p>
          <br />
          <Button variant="destructive" onClick={handleDelete} className="w-full">
            Delete
          </Button>
        </Modal>
      )}
    </>
  );
}
