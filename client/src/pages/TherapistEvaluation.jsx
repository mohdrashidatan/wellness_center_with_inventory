import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2, ClipboardPlus, Package, Pencil } from "lucide-react";
import Modal from "@/Shared/Modal";
import { Button } from "@/components/ui/button";
import SearcBar from "@/Shared/SearchBar";
import EvaluationForm from "@/components/form/evaluationForm/EvaluationForm";
import { useNavigate } from "react-router-dom";
import CustomerConsentForm from "@/components/form/consentForm/CustomerConsentForm";
import Pagination from "@/Shared/Pagination";

//service
import { customerService } from "@/services/customerService";
import { consentService } from "@/services/consentService";
import { evaluationService } from "@/services/evaluationService";
//utils
import { calculateAge } from "@/utils/calculateAges";
import { paginate } from "@/utils/paginate";

export default function TherapistEvaluation() {
  const navigate = useNavigate();

  const [modalPlus, setModalPlus] = useState(false);
  const [modalView, setModalView] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [modalEditConsent, setModalEditConsent] = useState(false);
  const [customerData, setCustomerData] = useState({});
  const [consentData, setConsentData] = useState({});
  const [viewData, setViewData] = useState({});
  const [deleteData, setDeleteData] = useState();
  const [selectedCustomer, setSelectedCustomer] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [evaluationSessionList, setEvaluationSessionList] = useState([]);
  const [reloadFlag, setReloadFlag] = useState(false);
  const [age, setAge] = useState();
  const { id } = useParams();

  useEffect(() => {
    const fetchData = async (id) => {
      const DataExistCustomer = await customerService.getCustomerData(id);
      setCustomerData(DataExistCustomer);
      const DataExistConsent = await consentService.getConsentByid(id);
      setConsentData(DataExistConsent);

      const yearsold = calculateAge(DataExistCustomer[0]?.dateOfBirth);
      setAge(yearsold);
      const evaluationSessionData = await evaluationService.getEvaluationData(id);

      setEvaluationSessionList(evaluationSessionData.data.data);
    };

    fetchData(id);
  }, [reloadFlag]);

  const HandlepagesChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const { currentItems, totalPages } = paginate(evaluationSessionList, currentPage, 10);

  const handleView = (data) => {
    setModalView(true);
    setViewData(data);
  };

  const handleDelete = (id) => {
    setModalDelete(true);
    setDeleteData(id);
  };

  const handleConsent = (id) => {
    setModalEditConsent(true);
    setSelectedCustomer(id);
  };

  const confirmDelete = async (id) => {
    await evaluationService.deleteEvaluationData(id);
    setModalDelete(false);
    setReloadFlag((prev) => !prev);
  };

  return (
    <div>
      <p className='text-blue-600 hover:underline my-2 cursor-pointer' onClick={() => navigate("/therapist")}>
        &larr; Back
      </p>
      <div className='grid lg:grid-cols-2 gap-5'>
        <SearcBar />
        <div className='border border-gray-300 shadow-md rounded-2xl p-2'>
          <div className='flex flex-col sm:flex-row justify-between gap-2 sm:items-center'>
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
              <p>Name: {customerData[0]?.name || ""}</p>
              <p>Age: {age || ""}</p>
              <p>Contact: {customerData[0]?.contact_no || ""}</p>
            </div>
            <Pencil className='cursor-pointer hover:text-blue-600 transition duration-200 text-gray-500 w-5' onClick={() => handleConsent(customerData[0]?.customerid)} />
          </div>
        </div>
      </div>
      <div className='border border-gray-300 shadow-md rounded-2xl mt-5 '>
        <div className='justify-between w-full flex'>
          <h2 className='m-5'>Evaluation</h2>{" "}
          <Button className='bg-prime-color hover:bg-prime-color-hover m-5' onClick={() => setModalPlus(true)}>
            +{" "}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className='text-center'>
              <TableHead>Date</TableHead>
              <TableHead>Theraphy</TableHead>
              <TableHead></TableHead>
              <TableHead>Duration</TableHead>
              <TableHead></TableHead>
              <TableHead>Session Notes</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((data, index) => (
              <TableRow className='rounded-xl hover:bg-prime-color cursor-pointer' key={index}>
                <TableCell>{data.date ? new Date(data.date).toLocaleString().split(" ")[0] : ""}</TableCell>
                <TableCell colSpan={2}>{data.therapy_type}</TableCell>
                <TableCell colSpan={2}>{data.duration} minute</TableCell>
                <TableCell>{data.therapist_note}</TableCell>
                <TableCell>{data.entereddate ? new Date(data.entereddate).toLocaleString() : ""}</TableCell>
                <TableCell> {data.editeddate ? new Date(data.editeddate).toLocaleString() : "-"}</TableCell>
                <TableCell className='flex gap-2 h-full items-center'>
                  <Eye className='cursor-pointer hover:text-blue-600 transition duration-200 text-gray-500 w-5 ' onClick={() => handleView(data)} />
                  <Trash2 className='cursor-pointer hover:text-blue-600 transition duration-200 text-gray-500 w-5  ' onClick={() => handleDelete(data.evaluation_id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {modalPlus && (
        <Modal setIsOpen={setModalPlus} big={true}>
          {" "}
          <div className='max-h-[600px] overflow-y-auto'>
            <EvaluationForm customerData={customerData} consentData={consentData} setModal={setModalPlus} setReloadFlag={setReloadFlag} />
          </div>
        </Modal>
      )}{" "}
      {modalView && (
        <Modal setIsOpen={setModalView} big={true}>
          {" "}
          <div className='max-h-[600px] overflow-y-auto'>
            <EvaluationForm customerData={customerData} consentData={consentData} setModal={setModalView} data={viewData} setReloadFlag={setReloadFlag} />
          </div>
        </Modal>
      )}
      <Pagination totalPages={totalPages} HandlepagesChange={HandlepagesChange} currentPage={currentPage} />
      {modalDelete && (
        <Modal title={"Confirm Delete"} setIsOpen={setModalDelete} small={true}>
          <Button variant='destructive' onClick={() => confirmDelete(deleteData)}>
            Delete {deleteData}
          </Button>
        </Modal>
      )}
      {modalEditConsent && (
        <Modal setIsOpen={setModalEditConsent} big={true}>
          <div className='max-h-[600px] overflow-y-auto'>
            <CustomerConsentForm role={"therapist"} idCustomer={selectedCustomer} />
          </div>
        </Modal>
      )}
    </div>
  );
}
