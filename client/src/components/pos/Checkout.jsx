import { CreditCard, ScrollText, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { posService } from "@/services/posService";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { packageService } from "@/services/packageService";
import { receiptService } from "@/services/receiptService";

import { pdf } from "@react-pdf/renderer";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import { saveAs } from "file-saver";

//pages
import { PrintReceipt, EmailReceipt } from "@/components/receiptPdf";

export default function Checkout({ selectedData, personData, formWalkinData, setSelectedData }) {
  const navigate = useNavigate();
  const [receiptLoading, setReceiptLoading] = useState(false);
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(false);
  const [discountShow, setDiscountShow] = useState(false);
  const [email, setEmail] = useState();

  const location = useLocation();

  const totalPrice = selectedData.reduce((total, item) => total + item.subPrice * 1, 0).toFixed(2);
  const tax = totalPrice * 0.1;

  const handlePrint = () => {
    window.print();
  };

  async function handleSendEmail() {
    try {
      // makes dokument PDF
      setReceiptLoading((prev) => !prev);
      const totalPrice = selectedData.reduce((total, item) => total + item.subPrice * 1, 0).toFixed(2);
      const blob = await pdf(<EmailReceipt selectedData={selectedData} personData={personData} discountShow={discountShow} totalPrice={totalPrice} />).toBlob();

      // sent via FormData
      const formData = new FormData();
      formData.append("file", blob, "receipt.pdf");
      formData.append("email", formPaymentData.email);

      const result = await receiptService.sentEmail(formData);

      if (result.sent) {
        alert("Email Sent!");
      } else {
        alert("Sending fail!");
      }
      //testing for----------------------------
      // saveAs(blob, "receipt.pdf");
    } catch (error) {
      console.error("Failed Sentong email:", error);
      alert("Failed sent email");
    }
    setReceiptLoading((prev) => !prev);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClick = (e) => {
    const { name, value } = e.target;
    if (formPaymentData.receiptOption == value) {
      setFormPaymentData((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSave = async (e) => {
    try {
      const posHdData = { formPaymentData, formWalkinData, discountShow };
      const result = await posService.poshdInsert(posHdData);
      const idResult = result.data.data;

      //insert Package service if it is a registered customer

      if (personData) {
        await packageService.insertCusPackage(selectedData, personData.customerid);
      } else {
        console.log("no persondata", personData);
      }

      const packageUseExist = selectedData.find((prev) => prev.packageCusFlag === true);

      if (packageUseExist) {
        await packageService.minCusPackage(selectedData);
      }

      const posLineData = { idResult, selectedData };

      await posService.poslineInsert(posLineData);
      toast.success("Success Saved");
      setSaved(true);
    } catch (error) {
      console.log(error);
      toast.error("Something is missing");
    }
  };

  const [formPaymentData, setFormPaymentData] = useState({
    customerId: personData?.customerid || null,
    therapistId: user?.therapistId,
    paymentMethod: "",
    receiptOption: "",
    totalPrice: totalPrice,
    email: personData?.email,
  });

  return (
    <>
      <div className='my-3'>
        <p className='text-xl font-semibold'>Transaction Overview</p>
        <p>Customer : {personData?.name || "Walkin"}</p>
      </div>

      <div>
        <div className='w-full flex items-center mb-7'>
          <p className='flex gap-2'>
            <ScrollText />
            Order Sumarry
          </p>
          <hr className='flex-1 border-t-4 border-gray-400 ml-2' />
        </div>
        <label className='inline-flex items-center bg-gray-300 p-1 my-1 rounded-sm w-40'>
          <input type='radio' name='discountShow' value='1' onChange={() => setDiscountShow(!discountShow)} onClick={() => setDiscountShow(!discountShow)} checked={discountShow} className='form-radio text-blue-600' />
          <span className='ml-2'>Print Discount</span>
        </label>
        <table className='w-full border border-gray-300 text-sm mb-6 shadow-sm rounded-lg overflow-hidden'>
          <thead>
            <tr className='bg-gray-100 text-left'>
              <th className='border border-gray-300 px-3 py-2 font-medium w-[60%]' colSpan={3}>
                Description
              </th>
              <th className='border border-gray-300 px-3 py-2 font-medium w-[10%] text-center'>Quantity</th>
              <th className='border border-gray-300 px-3 py-2 font-medium w-[15%] text-center'>Unit Price</th>
              {discountShow && <th className='border border-gray-300 px-3 py-2 font-medium w-[15%] text-center'>Subtotal</th>}
              {discountShow && <th className='border border-gray-300 px-3 py-2 font-medium w-[15%] text-center'>Discount</th>}

              <th className='border border-gray-300 px-3 py-2 font-medium w-[15%] text-center'>Total</th>
            </tr>
          </thead>

          <tbody>
            {selectedData.map((item, index) => (
              <tr className='hover:bg-gray-50' key={index}>
                <td className='border border-gray-300 px-3 py-2' colSpan={3}>
                  {item.name ? item.name : item.packageCusFlag ? `${item.packagedesc} ( ${item.remainSessions - item.amount} Visit Remaining) ` : `${item.packagedesc} (New Package) `}
                </td>
                <td className='border border-gray-300 px-3 py-2 text-center'>{item.amount}</td>
                <td className='border border-gray-300 px-3 py-2 text-center'>{discountShow ? `$${item.price}` : `$${item.subPrice}`}</td>
                {discountShow && <td className='border border-gray-300 px-3 py-2 text-center'>${(item.price * item.amount).toFixed(2)}</td>}
                {discountShow && <td className='border border-gray-300 px-3 py-2 text-center'>{item.discpercent ? `${item.discount}%` : `-$${(item.discount * 1).toFixed(2)}`}</td>}
                <td className='border border-gray-300 px-3 py-2 text-center'>${(item.subPrice * 1).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='bg-gray-100'>
              <td className='border border-gray-300 px-3 py-2 text-right font-medium' colSpan={discountShow ? 7 : 5}>
                Total
              </td>
              <td className='border border-gray-300 px-3 py-2 text-center font-medium'>${totalPrice}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <div className='w-full flex items-center mb-7 mt-10'>
          <p className='flex gap-2'>
            {" "}
            <CreditCard /> Payment Detail
          </p>
          <hr className='flex-1 border-t-4 border-gray-400 ml-2' />
        </div>
        <div className='flex justify-between items-center my-3 p-3 bg-gray-200 rounded-lg'>
          <p className='text-xl'>Total Due</p>
          <p className='text-2xl font-bold'>${Number(totalPrice).toFixed(2)}</p>
        </div>
        <div className=''>
          <p className='mb-3'>Select Payment Menthod</p>
          <div className='flex gap-9'>
            <label className='inline-flex items-center bg-gray-300 p-3 rounded-sm w-40'>
              <input type='radio' name='paymentMethod' value='card' onChange={!saved && handleChange} checked={formPaymentData.paymentMethod == "card"} className='form-radio text-blue-600' />
              <span className='ml-2'>Card</span>
            </label>

            <label className='inline-flex items-center bg-gray-300 p-3 rounded-sm w-40'>
              <input type='radio' name='paymentMethod' value='cash' onChange={!saved && handleChange} checked={formPaymentData.paymentMethod == "cash"} className='form-radio text-blue-600' />
              <span className='ml-2'>Cash</span>
            </label>

            <label className='inline-flex items-center bg-gray-300 p-3 rounded-sm w-40'>
              <input type='radio' name='paymentMethod' value='paynow' onChange={!saved && handleChange} checked={formPaymentData.paymentMethod == "paynow"} className='form-radio text-blue-600' />
              <span className='ml-2'>Paynow</span>
            </label>
          </div>
        </div>

        <div className='w-full flex justify-end'>{!saved ? <Button onClick={handleSave}>Save</Button> : <p className='text-green-700'>Saved</p>}</div>

        {saved && (
          <>
            {" "}
            <hr className='flex-1 border-t-3 border-gray-400 my-5' />
            <div className='flex justify-between items-center'>
              <div className=''>
                <p className='mb-3 '>Receipt Option</p>
                <div className='flex gap-9'>
                  {!(formPaymentData.receiptOption == "printReceipt") && (
                    <label className='inline-flex items-center'>
                      <input type='radio' name='receiptOption' value='emailReceipt' onChange={handleChange} checked={formPaymentData.receiptOption == "emailReceipt"} className='form-radio text-blue-600' onClick={handleClick} />
                      <span className='ml-2 whitespace-nowrap'>Email Receipt</span>
                      {formPaymentData.receiptOption == "emailReceipt" && <Input className='mx-5' placeholder='Email' value={formPaymentData.email} name='email' onChange={handleChange} />}
                    </label>
                  )}
                  {!(formPaymentData.receiptOption == "emailReceipt") && (
                    <label className='inline-flex items-center'>
                      <input type='radio' name='receiptOption' value='printReceipt' onChange={handleChange} checked={formPaymentData.receiptOption == "printReceipt"} className='form-radio text-blue-600' onClick={handleClick} />
                      <span className='ml-2  whitespace-nowrap'>Print Receipt</span>
                    </label>
                  )}
                </div>
              </div>
              <div className='print-only' id='print-area'>
                <PrintReceipt selectedData={selectedData} personData={personData} discountShow={discountShow} />
              </div>
              {formPaymentData.receiptOption && (
                <>
                  {formPaymentData.receiptOption == "printReceipt" ? (
                    <Button onClick={handlePrint}>Print</Button>
                  ) : (
                    <Button onClick={handleSendEmail}>
                      {" "}
                      {receiptLoading && <LoaderCircle className='animate-spin' />}
                      Sent Email
                    </Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`
       .print-only {
  display: block;         
  position: absolute;    
  left: -9999px;
  top: 0;
  opacity: 0;
}
       @media print {
  .print-only {
    display: block;      
    position: static;    
    left: 0;
    top: 0;
    opacity: 1;           
  }
}
      `}</style>
    </>
  );
}
