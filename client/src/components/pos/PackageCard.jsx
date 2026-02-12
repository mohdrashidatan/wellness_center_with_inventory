import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useState } from "react";

export default function PackageCard({ item, index, packageCusFlag, setSelectedData }) {
  const [showInfo, setShowInfo] = useState(false);
  const handleSelectPackage = (packageid, packagedesc, packageprice, noofsession, packageName, packageCusFlag, custPackageId) => {
    setSelectedData((prev) => {
      const foundItem = prev.find((item) => item.packageid === packageid && item.packageCusFlag === packageCusFlag);

      if (foundItem) {
        return prev.map((item) => (item.packageid === packageid && item.packageCusFlag === packageCusFlag ? { ...item, amount: item.amount + 1 } : item));
      } else {
        return [...prev, { packageid: packageid, packagedesc: packagedesc, price: packageprice, amount: 1, subPrice: packageprice, discount: 0, noofsession: noofsession, packageName: packageName, packageCusFlag: packageCusFlag, cusPackageId: custPackageId, remainSessions: item.remainSessions }];
      }
    });
  };

  return (
    <Card
      className={`relative w-full shadow-md flex flex-col bg-white border-2 hover:border-2 overflow-hidden
      ${packageCusFlag ? "hover:border-blue-900 border-blue-400" : "hover:border-purple-900 border-purple-400"}`}
      key={index}>
      {/* Overlay animation */}
      <div
        className={`absolute inset-0 bg-white transition-transform duration-500 ease-in-out
    ${showInfo ? "translate-y-0" : "translate-y-full"}`}>
        <div className='items-center justify-center h-full p-3'>
          <div className='flex justify-between'>
            <p className='text-lg font-semibold'>Detail Package {index + 1}</p>

            <div className='cursor-pointer' onClick={() => setShowInfo((prev) => !prev)}>
              <Info className='w-5 text-gray-500' />
            </div>
          </div>
          {item.productInfo.map((item, index) => (
            <div key={index}>
              <p className='text-black font-semibold text-lg text-center'>{item.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Isi card utama */}
      <div className='w-full p-3 rounded-t-xl flex-grow'>
        <div className='flex justify-between'>
          <p className='text-lg font-semibold'>Package {index + 1}</p>

          <div className='cursor-pointer' onClick={() => setShowInfo((prev) => !prev)}>
            <Info className='w-5 text-gray-500' />
          </div>
        </div>

        <p>{item.packagedesc}</p>
      </div>
      {packageCusFlag ? <p className='mt-auto w-full text-right pr-3 font-semibold '>Remaining : {item.remainSessions} x</p> : <p className='mt-auto w-full text-right pr-3 font-semibold text-purple-950'>${item.price}</p>}

      <div className={`w-full flex justify-center p-2 mt-auto ${packageCusFlag ? "bg-blue-300" : "bg-purple-300"} rounded-b-xl`}>
        <Button className={`shadow-none ${packageCusFlag ? "bg-blue-800" : "bg-purple-800"}`} onClick={() => handleSelectPackage(item.packageid, item.packagedesc, item.price, item.noofsession, `Package ${index + 1}`, packageCusFlag, item.custpackageid)}>
          Select
        </Button>
      </div>
    </Card>
  );
}
