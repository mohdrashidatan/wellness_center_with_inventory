import { useEffect, useState } from "react";
import { posService } from "@/services/posService";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";

import { pdf } from "@react-pdf/renderer";
import { LoaderCircle } from "lucide-react";
import { receiptService } from "@/services/receiptService";

import { PrintReceipt, EmailReceipt } from "@/components/receiptPdf";
export default function TrasactionCheck({ idPosHd, customerData }) {
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [dataPosline, setDataPosLine] = useState([]);
  const { user, loading } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      const result = await posService.getCustomerPosLine(idPosHd);
      setDataPosLine(result.data);
      console.log("ini loh", result.data);
    };

    fetch();
  }, []);

  const handlePrint = () => {
    window.print();
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function handleSendEmail() {
    setReceiptLoading(true);
    try {
      // makes dokument PDF
      const totalPrice = dataPosline.reduce((total, item) => total + item.subPrice * 1, 0).toFixed(2);
      const blob = await pdf(<ReceiptDocument selectedData={dataPosline} personData={customerData} discountShow={true} totalPrice={totalPrice} />).toBlob();

      // sent via FormData
      const formData = new FormData();
      formData.append("file", blob, "receipt.pdf");
      formData.append("email", formPaymentData.email);

      await receiptService.sentEmail(formData);

      //testing for----------------------------
      // saveAs(blob, "receipt.pdf");

      alert("Email Sent!");
    } catch (error) {
      console.error("Failed Sent email:", error);
      alert("Failed sent email");
    }
    setReceiptLoading(false);
  }

  const handleClick = (e) => {
    const { name, value } = e.target;
    if (formPaymentData.receiptOption == value) {
      setFormPaymentData((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const totalPrice = dataPosline.reduce((total, item) => total + item.total_price * 1, 0).toFixed(2);
  const [formPaymentData, setFormPaymentData] = useState({
    customerId: customerData?.customerid || null,
    therapistId: user?.therapistId,
    paymentMethod: "",
    receiptOption: "",
    totalPrice: totalPrice,
    email: customerData?.email,
  });

  return (
    <div>
      <h1 className='my-3'>Transaction Detail</h1>
      <table className='w-full border border-gray-300 text-sm mb-6 shadow-sm rounded-lg overflow-hidden'>
        <thead>
          <tr className='bg-gray-100 text-left'>
            <th className='border border-gray-300 px-3 py-2 font-medium w-[60%]' colSpan={3}>
              Description
            </th>
            <th className='border border-gray-300 px-3 py-2 font-medium w-[10%] text-center'>Quantity</th>
            <th className='border border-gray-300 px-3 py-2 font-medium w-[15%] text-center'>Unit Price</th>
            <th className='border border-gray-300 px-3 py-2 font-medium w-[15%] text-center'>SubTotal</th>
            <th className='border border-gray-300 px-3 py-2 font-medium w-[15%] text-center'>Discount</th>
            <th className='border border-gray-300 px-3 py-2 font-medium w-[15%] text-center'>Total</th>
          </tr>
        </thead>

        <tbody>
          {dataPosline.map((item, index) => (
            <tr className='hover:bg-gray-50' key={index}>
              <td className='border border-gray-300 px-3 py-2' colSpan={3}>
                {item.package ? item.packagedesc : item.name}
              </td>
              <td className='border border-gray-300 px-3 py-2 text-center'>{item.qty}</td>
              <td className='border border-gray-300 px-3 py-2 text-center'>${item.unitprice}</td>
              <td className='border border-gray-300 px-3 py-2 text-center'>${item.price}</td>
              <td className='border border-gray-300 px-3 py-2 text-center'>{item.discpercent ? `${item.discount}%` : `-$${item.discount}`}</td>
              <td className='border border-gray-300 px-3 py-2 text-center'>${item.total_price}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className='bg-gray-100'>
            <td className='border border-gray-300 px-3 py-2 text-right font-medium' colSpan={7}>
              Total
            </td>
            <td className='border border-gray-300 px-3 py-2 text-center font-medium'>${totalPrice}</td>
          </tr>
        </tfoot>
      </table>
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
          <PrintReceipt selectedData={dataPosline} personData={customerData} discountShow={true} />
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
      <style>{`
        .print-only {
          display: none;
        }
        @media print {
          .print-only {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
