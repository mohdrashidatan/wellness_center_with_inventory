import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { consentService } from "@/services/consentService";
import { useState, useEffect, useRef } from "react";
import Modal from "../Shared/Modal";
import { Button } from "@/components/ui/button";

import CustomerConsentForm from "@/components/form/consentForm/CustomerConsentForm";

import { Eye, Trash2, ClipboardPlus, Package, Computer, History } from "lucide-react";
import Pagination from "@/Shared/Pagination";
import { useNavigate } from "react-router-dom";
import { paginate } from "@/utils/paginate";
import SearcBar from "@/Shared/SearchBar";

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [consentList, setConsentList] = useState([]);
  const [currentDatas, setCurrentDatas] = useState([]);
  const [selectedDelete, setSelectedDelete] = useState();
  const [selectedDeleteName, setSelectedDeleteName] = useState();
  const [deleteModal, setDeleteModal] = useState(false);
  const [openModalForm, setOpenModalForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [evaluationModal, setEvaluationModal] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0);
  const [selectedEvaluation, setSelectedEvaluation] = useState();
  const [modalActionChoose, setModalActionChoose] = useState(false);
  const [selectedChoose, setSelectedChoose] = useState();
  const [currentDataShow, setCurrentDataShow] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState();

  const consentRef = useRef();
  const itemsPerPage = 5;
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await consentService.getConsent();
        setConsentList(data);
        const pageTotal = Math.ceil(consentList.length / itemsPerPage);
        setTotalPages(pageTotal);
        let currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        setCurrentDataShow(currentData);
      } catch (err) {
        // setError("Fail To gain data");
      } finally {
        // setLoading(false);
      }
    };

    fetch();
  }, [openModalForm, showModal]);

  const handleDelete = async (id, name) => {
    setSelectedDelete(id);
    setSelectedDeleteName(name);
    setDeleteModal(true);
  };
  const handleView = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleEvaluation = (id) => {
    setSelectedEvaluation(id);
    setEvaluationModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = consentService.deleteById(selectedDelete);
      setConsentList((prev) => prev.filter((item) => item.customerid !== selectedDelete));
      setDeleteModal(false);
    } catch (err) {
      console.log("error deleting", err);
    }
  };

  const handleChoose = async (id) => {
    setSelectedChoose(id);
    setModalActionChoose(true);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    const filtered = consentList.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()) || item.email.toLowerCase().includes(value.toLowerCase()));
    setCurrentDataShow(filtered);
  };

  return (
    <>
      <div className='flex justify-between items-center'>
        <SearcBar handleSearch={handleSearch} />
        <Button onClick={() => setOpenModalForm(true)} className='bg-prime-color hover:bg-prime-color-hover'>
          +{" "}
        </Button>

        {openModalForm && (
          <Modal setIsOpen={setOpenModalForm} big={true}>
            <div className='max-h-[600px] overflow-y-auto'>
              <CustomerConsentForm role={"therapist"} />
            </div>
          </Modal>
        )}
      </div>

      <Table>
        <TableCaption>A List Of Customer</TableCaption>
        <TableHeader>
          <TableRow className='text-center'>
            <TableHead className=''>Name</TableHead>
            <TableHead className=''>Gontact</TableHead>
            <TableHead className=''>Gender</TableHead>
            <TableHead className=''>Email</TableHead>
            <TableHead className=''>Selected Device</TableHead>
            <TableHead className=''>Emergancy Contact</TableHead>
            <TableHead className=''>Emergancy Contact Name</TableHead>
            <TableHead className=''>Status</TableHead>
            <TableHead className=''></TableHead>
            <TableHead className=''></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentDataShow.map((item, index) => (
            <TableRow key={index} className='rounded-xl hover:bg-prime-color cursor-pointer '>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.contact_no}</TableCell>
              <TableCell>{item.gender == "Male" ? "M" : "F"}</TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>{item.device_used}</TableCell>
              <TableCell>{item.emergency_contact_name}</TableCell>
              <TableCell>{item.emergency_contact_no}</TableCell>
              <TableCell className={item.active ? "text-green-600" : "text-red-600"}>{item.active ? "Active" : "Inactive"}</TableCell>
              <TableCell className='flex gap-2'>
                <Eye onClick={() => handleView(item)} className='cursor-pointer hover:text-blue-400 transition duration-200  w-5' />
                <Trash2 onClick={() => handleDelete(item.customerid, item.name)} className='cursor-pointer hover:text-blue-400 transition duration-200  w-5 ' />
              </TableCell>
              <TableCell className='items-center justify-center gap-2'>
                <ClipboardPlus onClick={() => handleChoose(item.customerid)} className='cursor-pointer hover:text-blue-400 transition duration-200  w-5' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className='flex gap-2 m-4 items-center'>
        {/* Prev */}
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className='bg-white shadow-lg p-1 border border-1 border-purple-500'>
          Prev
        </button>

        {/* page number */}
        {(() => {
          const pages = [];
          let start = Math.max(currentPage - 1, 1);
          let end = Math.min(start + 2, totalPages);

          if (end - start < 2) {
            start = Math.max(end - 2, 1);
          }

          for (let i = start; i <= end; i++) {
            pages.push(
              <button key={i} className={currentPage === i ? "font-bold bg-purple-500 p-1 shadow-lg rounded-sm text-white" : ""} onClick={() => setCurrentPage(i)}>
                {i}
              </button>
            );
          }
          return pages;
        })()}

        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className='bg-white shadow-lg p-1 border border-1 border-purple-500'>
          Next
        </button>
      </div>
      {showModal && selectedItem && (
        <Modal setIsOpen={setShowModal} big={true}>
          <div className='max-h-[600px] overflow-y-auto'>
            <CustomerConsentForm ref={consentRef} role={"therapist"} idCustomer={selectedItem.customerid} setTriggerKey={setTriggerKey} />
          </div>
        </Modal>
      )}

      {modalActionChoose && (
        <Modal setIsOpen={setModalActionChoose} small={true}>
          <div className='grid grid-rows-3  gap-2'>
            <div className='bg-prime-color h-full rounded-2xl flex justify-center text-white p-4 gap-2 hover:scale-105 transition-transform duration-300 shadow-md cursor-pointer' onClick={() => navigate(`/therapist/evaluation/${selectedChoose}`)}>
              <ClipboardPlus className='w-7 h-7' />
              <p className='text-base font-semibold'>Evaluation</p>
            </div>
            <div className='bg-prime-color h-full rounded-2xl flex justify-center text-white p-4 gap-2 hover:scale-105 transition-transform duration-300 shadow-md cursor-pointer' onClick={() => navigate(`/therapist/pos/${selectedChoose}`)}>
              <Computer className='w-7 h-7' />
              <p className='text-base font-semibold'>Point Of Sales</p>
            </div>
            <div className='bg-prime-color h-full rounded-2xl flex justify-center text-white p-4 gap-2 hover:scale-105 transition-transform duration-300 shadow-md cursor-pointer' onClick={() => navigate(`/therapist/transaction/${selectedChoose}`)}>
              <History className='w-7 h-7' />
              <p className='text-base font-semibold'>History Of Transaction</p>
            </div>
          </div>
        </Modal>
      )}

      {deleteModal && (
        <Modal title={"Confirm Delete"} setIsOpen={setDeleteModal} small={true}>
          <p class='text-sm text-gray-700 dark:text-gray-300'>
            Delete <strong>{selectedDeleteName}</strong>? This will also remove all related data (packages, evaluations, etc.).
          </p>
          <br />
          <Button variant='destructive' onClick={confirmDelete}>
            Delete
          </Button>
        </Modal>
      )}

      {evaluationModal && (
        <Modal title={"Customer Detail"} setIsOpen={setEvaluationModal} big={true}>
          <div className='max-h-[600px] overflow-y-auto'>
            <h1>evaluation</h1>
            <EvaluationForm id={selectedEvaluation} role={"therapist"} />
          </div>
        </Modal>
      )}
    </>
  );
}
