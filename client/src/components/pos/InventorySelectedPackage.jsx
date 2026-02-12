import { Button } from "@/components/ui/button";
import { Package, PackageCheck } from "lucide-react";
import { useState, useEffect } from "react";

export default function PosSelectedPackage({ packagedesc, price, amount, setSelectedData, selectedData, packageid, index, packageName, item }) {
  const [percentDiscount, setPercentDiscount] = useState(false);
  const [discountNumber, setDiscountNumber] = useState(0);
  const [totalItemPrice, setTotalItemPrice] = useState(price);
  const [amountNumber, setAmountNumber] = useState(amount);
  const cusPackageFlag = item.packageCusFlag;

  const handlePlus = async (packageid) => {
    setSelectedData((prev) => prev.map((item) => (item.packageid === packageid && item.packageCusFlag === cusPackageFlag ? { ...item, amount: item.amount + 1 } : item)));
  };

  const handleMin = async (packageid) => {
    setSelectedData((prev) => prev.map((item) => (item.packageid === packageid && item.packageCusFlag === cusPackageFlag ? { ...item, amount: item.amount - 1 } : item)).filter((item) => item.amount > 0));
  };

  let totalPrice;
  let discpercent;
  useEffect(() => {
    if (amountNumber != selectedData[index].amount) {
      if (percentDiscount) {
        totalPrice = Number(price).toFixed(2);
        const dicountCut = totalPrice * (discountNumber / 100);
        totalPrice = ((totalPrice - dicountCut) * selectedData[index].amount).toFixed(2);
        discpercent = 1;
      } else {
        totalPrice = Number(price).toFixed(2);
        totalPrice = (totalPrice * selectedData[index].amount - discountNumber).toFixed(2);
        discpercent = 0;
      }

      setSelectedData((prev) => {
        const newArray = [...prev];
        newArray[index] = { ...newArray[index], subPrice: totalPrice };
        return newArray;
      });

      setTotalItemPrice(totalPrice);
      setAmountNumber(selectedData[index].amount);
    }
  }, [selectedData[index].amount]);
  const handleDiscount = (discount) => {
    if (discount) {
      setDiscountNumber(discount);
      totalPrice = Number(price).toFixed(2);
      totalPrice = (totalPrice * selectedData[index].amount - discount).toFixed(2);
      discpercent = 0;
      if (percentDiscount) {
        totalPrice = Number(price * selectedData[index].amount).toFixed(2);
        const dicountCut = totalPrice * (discount / 100);
        totalPrice = (totalPrice - dicountCut).toFixed(2);
        discpercent = 1;
      }
      setSelectedData((prev) => {
        const newArray = [...prev];
        newArray[index] = { ...newArray[index], subPrice: totalPrice, discount: discount, discpercent: discpercent };
        return newArray;
      });

      setTotalItemPrice(totalPrice);
    } else {
      totalPrice = Number(price * selectedData[index].amount).toFixed(2);
      setSelectedData((prev) => {
        const newArray = [...prev];
        newArray[index] = { ...newArray[index], subPrice: totalPrice };
        return newArray;
      });
      setTotalItemPrice(totalPrice);
    }
  };

  const handlePercent = (p) => {
    setPercentDiscount(!percentDiscount);
    if (p) {
      totalPrice = Number(price * selectedData[index].amount).toFixed(2);
      const dicountCut = totalPrice * (discountNumber / 100);
      totalPrice = (totalPrice - dicountCut).toFixed(2);
      discpercent = 1;
    } else {
      totalPrice = Number(price).toFixed(2);
      totalPrice = (totalPrice * selectedData[index].amount - discountNumber).toFixed(2);
      discpercent = 0;
    }

    setSelectedData((prev) => {
      const newArray = [...prev];
      newArray[index] = { ...newArray[index], subPrice: totalPrice, discpercent: discpercent };
      return newArray;
    });
    setTotalItemPrice(totalPrice);
  };

  return (
    <div className='justify-between bg-slate-100  rounded-md grid lg:grid-cols-7 gap-2'>
      <div className='flex gap-3 col-span-3 bg-purple-950/10 items-center p-2'>
        <div className='items-center'>
          <button className='bg-white shadow-lg hover:bg-gray-100 text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold' onClick={() => handlePlus(packageid)}>
            +
          </button>
          <p className='text-center'>{amount}</p>
          <button className='bg-purple-400 hover:bg-gray-100 text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold' onClick={() => handleMin(packageid)}>
            -
          </button>
        </div>

        {item.packageCusFlag ? <PackageCheck /> : <Package />}

        <div>
          <p className='text-m'>{packageName} </p>
          {item.packageCusFlag ? <p className='text-sm bg-blue-500 rounded-lg text-white text-center'>CusPackage</p> : <p className='text-sm'>${price}</p>}
        </div>
      </div>
      <div className='flex items-center justify-end p-2 '>
        <p>${(price * amount).toFixed(2)}</p>
      </div>
      <div className='flex items-center bg-purple-950/10 col-span-2 justify-center'>
        {item.packageCusFlag ? (
          <div className='text-center'>
            <p>Customer Package</p>
          </div>
        ) : (
          <div className='flex jutify-center items-center'>
            <p onClick={() => handlePercent(false)} className={`${!percentDiscount ? "bg-purple-500 text-white" : "bg-white text-gray-600"} cursor-pointer rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg`}>
              -$
            </p>
            <input type='number' className='w-9 mx-1 outline-none rounded-lg' onChange={(e) => handleDiscount(e.target.value)} />
            <p onClick={() => handlePercent(!percentDiscount)} className={`${percentDiscount ? "bg-purple-500 text-white" : "bg-white text-gray-600"} cursor-pointer rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg`}>
              %
            </p>
          </div>
        )}
      </div>
      <div className='flex items-center justify-center '>
        <p>${(totalItemPrice * 1).toFixed(2)}</p>
      </div>
    </div>
  );
}
