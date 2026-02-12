import { useState, useEffect } from "react";
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, UserX } from "lucide-react";
import Modal from "@/shared/Modal";
import SearchBar from "@/shared/SearchBar";
import { usersService } from "@/services/usersService";
import toast from "react-hot-toast";

const ROLES = ["Therapist", "Admin", "Customer"];
const emptyForm = { username: "", email: "", password: "", role: "Therapist" };

export default function UsersPage() {
  const [userList, setUserList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [formModal, setFormModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);

  // State
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    try {
      const data = await usersService.getAll();
      setUserList(data);
      setFiltered(data);
    } catch {
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentRows = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (e) => {
    const val = e.target.value.toLowerCase();
    setFiltered(
      userList.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(val) ||
          (u.email || "").toLowerCase().includes(val) ||
          (u.role || "").toLowerCase().includes(val)
      )
    );
    setCurrentPage(1);
  };

  const openAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormError("");
    setShowPassword(false);
    setFormModal(true);
  };

  const openEdit = (item, e) => {
    if (e) e.stopPropagation();
    setFormData({ username: item.username || "", email: item.email || "", password: "", role: item.role || "Therapist" });
    setEditingId(item.useracid);
    setFormError("");
    setShowPassword(false);
    setFormModal(true);
  };

  const openView = (item) => {
    setSelectedItem(item);
    setViewModal(true);
  };

  const openDeactivate = (item, e) => {
    e.stopPropagation();
    setSelectedItem(item);
    setDeactivateModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setFormError("");
    try {
      if (editingId) {
        await usersService.update(editingId, formData);
        toast.success("User updated");
      } else {
        await usersService.create(formData);
        toast.success("User created");
      }
      setFormModal(false);
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to save";
      setFormError(msg);
    }
  };

  const handleDeactivate = async () => {
    try {
      await usersService.deactivate(selectedItem.useracid);
      toast.success(`User '${selectedItem.username}' deactivated`);
      setDeactivateModal(false);
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to deactivate";
      toast.error(msg);
      setDeactivateModal(false);
    }
  };

  // bit(1) from MySQL can arrive as a Buffer object {type:'Buffer',data:[0|1]} or a number
  const isActive = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === "object" && val?.data) return val.data[0] === 1;
    return Number(val) === 1;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Users</h1>
        <div className="flex items-center gap-3">
          <SearchBar handleSearch={handleSearch} />
          <Button onClick={openAdd} className="bg-prime-color hover:bg-prime-color-hover">
            + Add User
          </Button>
        </div>
      </div>

      <Table>
        <TableCaption>List of System Users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                No users found
              </TableCell>
            </TableRow>
          )}
          {currentRows.map((item, idx) => (
            <TableRow
              key={item.useracid}
              className="hover:bg-prime-color cursor-pointer hover:text-white transition-colors"
              onDoubleClick={() => openView(item)}
            >
              <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
              <TableCell className="font-medium">{item.username}</TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>{item.role}</TableCell>
              <TableCell
                className={isActive(item.active) ? "text-green-600" : "text-red-500"}
              >
                {isActive(item.active) ? "Active" : "Inactive"}
              </TableCell>
              <TableCell className="flex gap-2">
                <Pencil
                  className="w-4 cursor-pointer hover:text-blue-400 transition duration-200"
                  onClick={(e) => openEdit(item, e)}
                />
                {isActive(item.active) && (
                  <UserX
                    className="w-4 cursor-pointer hover:text-red-500 transition duration-200"
                    onClick={(e) => openDeactivate(item, e)}
                  />
                )}
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
        </div>
      )}

      {/* Add / Edit Modal */}
      {formModal && (
        <Modal title={editingId ? "Edit User" : "Add User"} setIsOpen={setFormModal} small={true}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                maxLength={100}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                maxLength={100}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingId ? "New Password (leave blank to keep current)" : "Password *"}
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleFormChange}
                  maxLength={100}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 pr-16"
                  placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-purple-500 hover:text-purple-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <Button
              onClick={handleSave}
              className="bg-prime-color hover:bg-prime-color-hover w-full mt-1"
            >
              {editingId ? "Save Changes" : "Add User"}
            </Button>
          </div>
        </Modal>
      )}

      {/* View Detail Modal (double-click) */}
      {viewModal && selectedItem && (
        <Modal title="User Details" setIsOpen={setViewModal} small={true}>
          <div className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="text-gray-500">ID</span>
              <span className="font-semibold">{selectedItem.useracid}</span>
              <span className="text-gray-500">Username</span>
              <span className="font-semibold">{selectedItem.username}</span>
              <span className="text-gray-500">Email</span>
              <span className="font-semibold break-all">{selectedItem.email}</span>
              <span className="text-gray-500">Role</span>
              <span className="font-semibold">{selectedItem.role}</span>
              <span className="text-gray-500">Status</span>
              <span className={isActive(selectedItem.active) ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                {isActive(selectedItem.active) ? "Active" : "Inactive"}
              </span>
            </div>
            <Button
              onClick={() => { setViewModal(false); openEdit(selectedItem, null); }}
              className="bg-prime-color hover:bg-prime-color-hover w-full mt-2"
            >
              Edit
            </Button>
          </div>
        </Modal>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateModal && selectedItem && (
        <Modal title="Deactivate User" setIsOpen={setDeactivateModal} small={true}>
          <p className="text-sm text-gray-700">
            Deactivate user <strong>{selectedItem.username}</strong> ({selectedItem.email})?
            The account will be disabled but not deleted.
          </p>
          <br />
          <Button variant="destructive" onClick={handleDeactivate} className="w-full">
            Deactivate
          </Button>
        </Modal>
      )}
    </>
  );
}
