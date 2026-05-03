import { useState } from "react";
import { Card } from "@/components/ui/card";
import VariantPickerModal from "@/components/pos/VariantPickerModal";

export default function ItemCard({ name, price, type, selectedData, setSelectedData, productid, isVariantEnabled }) {
  const [showPicker, setShowPicker] = useState(false);

  const addDirectly = () => {
    setSelectedData((prev) => {
      const found = prev.find((item) => item.id === productid);
      if (found) {
        return prev.map((item) =>
          item.id === productid
            ? { ...item, amount: item.amount + 1, subPrice: (item.price * (item.amount + 1)).toFixed(2) }
            : item
        );
      }
      return [...prev, { id: productid, name, price, type, amount: 1, subPrice: price, discount: 0, discpercent: 0 }];
    });
  };

  const handleVariantAdd = (item) => {
    setSelectedData((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) {
        const newAmt = found.amount + item.amount;
        return prev.map((i) =>
          i.id === item.id ? { ...i, amount: newAmt, subPrice: (i.price * newAmt).toFixed(2) } : i
        );
      }
      return [...prev, item];
    });
  };

  return (
    <>
      <Card
        className="p-2 flex-row hover:scale-105 transition-transform duration-300 cursor-pointer"
        onClick={() => (isVariantEnabled ? setShowPicker(true) : addDirectly())}>
        <img src="/wonder.png" alt="" className="w-full h-24 object-cover rounded-lg" />
        <p className="my-2 text-sm leading-tight">{name}</p>
        <div className="flex justify-between items-center gap-1 flex-wrap">
          <p className="text-xs text-gray-500">${price ?? "—"}</p>
          <div className="flex items-center gap-1">
            {isVariantEnabled && (
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium leading-none">
                Variants
              </span>
            )}
            <p className="text-xs text-gray-400">{type}</p>
          </div>
        </div>
      </Card>

      {showPicker && (
        <VariantPickerModal
          product={{ productid, name, unitprice: price, productcat: type }}
          onAdd={handleVariantAdd}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
