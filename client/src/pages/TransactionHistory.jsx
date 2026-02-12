import SearcBar from "../Shared/SearchBar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
//service
import { customerService } from "@/services/customerService";
import { posService } from "@/services/posService";

import Modal from "../Shared/Modal";
import TrasactionCheck from "../components/transactionHistory/TransactionCheck";

export default function TransactionHistory() {
  const [customerData, setCustomerData] = useState([]);
  const [cusPosHdData, setCusPosHdData] = useState([]);
  const [modalDetail, setModalDetail] = useState(false);
  const [selectedId, setSelectedId] = useState();

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchData = async (id) => {
      const DataExistCustomer = await customerService.getCustomerData(id);
      setCustomerData(DataExistCustomer);

      const posData = await posService.getCustomerPosHd(id);
      setCusPosHdData(posData.data);
    };

    fetchData(id);
  }, []);

  const handleClick = (id) => {
    setSelectedId(id);
    setModalDetail((prev) => !prev);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(cusPosHdData.length / itemsPerPage);

  // slice data sesuai halaman
  const currentData = cusPosHdData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  return (
    <>
      {" "}
      <p className='text-blue-600 hover:underline my-2 cursor-pointer' onClick={() => navigate("/therapist")}>
        &larr; Back
      </p>
      <div className='gap-5'>
        <div className='h-full flex items-center'>
          {" "}
          <p>Transaction History</p>
        </div>

        <div className='border border-gray-300 shadow-md rounded-2xl p-2 w-1/2'>
          <div className='flex flex-col sm:flex-row justify-between gap-2 sm:items-center'>
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
              <p>Name: {customerData[0]?.name || ""}</p>
              <p>Contact: {customerData[0]?.contact_no || ""}</p>
            </div>
          </div>
        </div>
      </div>
      <div className='border border-gray-300 shadow-md rounded-2xl mt-5 '>
        <Table>
          <TableHeader>
            <TableRow className='text-center'>
              <TableHead className='text-center'>Number</TableHead>
              <TableHead className='text-center'>Date</TableHead>
              <TableHead className='text-center'>Session Notes</TableHead>
              <TableHead className='text-center'>Amount</TableHead>
              <TableHead className='text-center'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((item, index) => (
              <TableRow className='rounded-xl hover:bg-prime-color cursor-pointer' key={index}>
                <TableCell className='text-center'>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                <TableCell className='text-center'>{new Date(item.transdate).toLocaleString()}</TableCell>
                <TableCell className='text-center'>{item.payment_method}</TableCell>
                <TableCell className='text-center'>${item.total_amount}</TableCell>
                <TableCell className='flex gap-2 h-full items-center  justify-center'>
                  <Eye className='cursor-pointer hover:text-blue-600 transition duration-200 text-gray-500 w-5' onClick={() => handleClick(item.posid)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className='flex gap-2 m-4 items-center'>
          {/* Prev */}
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className='bg-white shadow-lg p-1 border border-1 border-purple-900 rounded-lg'>
            Prev
          </button>

          {/* page number*/}
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

          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className='bg-white shadow-lg p-1 border border-1 border-purple-900 rounded-lg'>
            Next
          </button>
        </div>
      </div>
      {modalDetail && (
        <Modal setIsOpen={setModalDetail}>
          <TrasactionCheck idPosHd={selectedId} customerData={customerData} />
        </Modal>
      )}
    </>
  );
}
