import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function InventorySelectedItem({ id, name, price, subPrice, amount, selectedData, setSelectedData, index }) {
  const [discountNumber, setDiscountNumber] = useState(0);
  const [percentDiscount, setPercentDiscount] = useState(false);
  const [totalItemPrice, setTotalItemPrice] = useState(subPrice);
  const [amountNumber, setAmountNumber] = useState(amount);

  let totalPrice;
  let discpercent;

  //Check if thera any update in selected data because of click on card
  useEffect(() => {
    if (amountNumber !== selectedData[index].amount) {
      let totalPrice;
      let discpercent;

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

  const handlePlus = async (id) => {
    setSelectedData((prev) => prev.map((item) => (item.id === id ? { ...item, amount: item.amount + 1 } : item)));
  };

  const handleMin = async (id) => {
    setSelectedData((prev) => prev.map((item) => (item.id === id ? { ...item, amount: item.amount - 1 } : item)).filter((item) => item.amount > 0));
  };

  const handleDiscount = (discount) => {
    if (discount) {
      setDiscountNumber(discount);
      totalPrice = Number(price).toFixed(2);
      totalPrice = (totalPrice * selectedData[index].amount - discount).toFixed(2);
      discpercent = 0;
      if (percentDiscount) {
        totalPrice = Number(price).toFixed(2);
        const dicountCut = totalPrice * (discount / 100);

        totalPrice = ((totalPrice - dicountCut) * selectedData[index].amount).toFixed(2);

        discpercent = 1;
      }
      setSelectedData((prev) => {
        const newArray = [...prev];
        newArray[index] = { ...newArray[index], subPrice: totalPrice, discount: discount, discpercent: discpercent };
        return newArray;
      });

      setTotalItemPrice(totalPrice);
    } else {
      totalPrice = Number(price).toFixed(2);
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
      newArray[index] = { ...newArray[index], subPrice: totalPrice, discount: discountNumber, discpercent: discpercent };
      return newArray;
    });
    setTotalItemPrice(totalPrice);
  };

  return (
    <div className=' justify-between bg-slate-100  rounded-md grid lg:grid-cols-7 gap-2'>
      <div className='flex gap-3 col-span-3 items-center p-1 bg-purple-950/10'>
        <div className='items-center'>
          <button className='bg-white shadow-lg hover:bg-gray-100 text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold' onClick={() => handlePlus(id)}>
            +
          </button>
          <p className='text-center'>{amount}</p>
          <button className='bg-purple-400 hover:bg-gray-100 text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold' onClick={() => handleMin(id)}>
            -
          </button>
        </div>
        <img src='/wonder.png' alt='' className='w-12 h-12 object-cover rounded-lg' />
        <div>
          <p className='text-m'>{name}</p>
          <p className='text-sm'>${price}</p>
        </div>
      </div>

      {/* <div className='flex items-center p-0 justify-center bg-purple-950/10'>
        <Button className='bg-trasparant shadow-none hover:bg-gray-100 text-black p-1' onClick={() => handlePlus(id)}>
          +
        </Button>
        <p className='w-2 text-center'>{amount}</p>
        <Button className='bg-transparant shadow-none hover:bg-gray-100 text-black p-1' onClick={() => handleMin(id)}>
          -
        </Button>
      </div> */}
      <div className='flex items-center justify-end p-2 '>
        <p>${(price * amount).toFixed(2)}</p>
      </div>
      <div className='flex  bg-purple-950/10 w-full justify-center col-span-2 '>
        <div className='flex jutify-center items-center'>
          <p onClick={() => handlePercent(false)} className={`${!percentDiscount ? "bg-purple-500 text-white" : "bg-white text-gray-600"} cursor-pointer rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg`}>
            -$
          </p>
          <input type='number' className='w-9 mx-1 outline-none rounded-lg' onChange={(e) => handleDiscount(e.target.value)} />
          <p onClick={() => handlePercent(!percentDiscount)} className={`${percentDiscount ? "bg-purple-500 text-white" : "bg-white text-gray-600"} cursor-pointer rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg`}>
            %
          </p>
        </div>
      </div>

      <div className='flex items-center justify-end p-2 '>
        <p>${(totalItemPrice * 1).toFixed(2)}</p>
      </div>
    </div>
  );
}
