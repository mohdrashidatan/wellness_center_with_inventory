import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PrintReceipt({ selectedData, personData, discountShow }) {
  const totalPrice = selectedData.reduce((total, item) => total + item.subPrice * 1, 0).toFixed(2);
  return (
    <>
      <div id='printreceipt' className='h-full'>
        <div className=' flex justify-between items-center bg-purple-500/50 p-2'>
          <div className='flex items-center'>
            <img src='/pwglogo.svg' alt='' className='w-20' />
            <p>Prife Wellness Group</p>
          </div>
          <div>
            <p>Payment Date : 9/8/2025</p>
            <p>Receipt #323232</p>
          </div>
        </div>

        <div className='px-5'>
          <div className='mt-12 flex gap-40 space-x-4 items-center  p-2'>
            <div className=''>
              <p>From</p>
              <p>Prife Wellness Group</p>
              <p>Address Of Prife Wellness Group</p>
              <p>(223)321311231231</p>
            </div>
            <div>
              <p>Sold To</p>
              <p>Arief Muhammad</p>
              <p>Address Of Arief Muhammad</p>
              <p>Customer@Gmail.com</p>
            </div>
          </div>

          <div className='mt-14'>
            <table className='w-full border border-gray-300 text-sm mb-6 shadow-sm rounded-lg'>
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
                      {item.name ? item.name : item.packageCusFlag ? `${item.packagedesc} (Package Customer) ` : `${item.packagedesc} (Package) `}
                    </td>
                    <td className='border border-gray-300 px-3 py-2 text-center'>{item.amount}</td>
                    <td className='border border-gray-300 px-3 py-2 text-center'>${item.price}</td>
                    {discountShow && <td className='border border-gray-300 px-3 py-2 text-center'>${(item.price * item.amount).toFixed(2)}</td>}
                    {discountShow && <td className='border border-gray-300 px-3 py-2 text-center'>{item.discpercent ? `${item.discount}%` : `-$${(item.discount * 1).toFixed(2)}`}</td>}

                    <td className='border border-gray-300 px-3 py-2 text-center'>${(item.amount * item.subPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='flex justify-between items-center mt-20 mb-30'>
            <div className=''>
              <p className='font-semibold'>Payment Menthod : </p>
              <p> Credit Card</p>
            </div>
            <div className=' w-80 text-right'>
              <p className='border-t-2  w-full'>Total : ${totalPrice}</p>
            </div>
          </div>
        </div>
        <div className='absolute bottom-0 left-0 bg-purple-500/50 text-center p-3 pb-10 w-full'>
          <p className='text-xl font-semibold'>Thank You For Your Purchase</p>
          <p>For question or any concern please contact</p>
          <p>PWG@gmail.com, Bob(21)32132123</p>
        </div>
      </div>

      <style>{`
  @media print {
    body * {
      visibility: hidden;
    }

    #printreceipt, #printreceipt * {
      visibility: visible;
    }

    #printreceipt {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      background: white;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    .min-h-screen {
      min-height: auto !important;
    }

    .no-print {
      display: none;
    }
  }

  @page {
    size: A3 landscape;
    margin: 0;
  }
`}</style>
    </>
  );
}
