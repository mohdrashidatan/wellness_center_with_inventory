import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ItemCard({ name, price, type, selectedData, setSelectedData, productid }) {
  const cardClick = async (id, name, price, type) => {
    setSelectedData((prev) => {
      const foundItem = prev.find((item) => item.id === id);

      if (foundItem) {
        return prev.map((item) => (item.id === id ? { ...item, amount: item.amount + 1 } : item));
      } else {
        return [...prev, { id, name, price, type, amount: 1, subPrice: price, discount: 0, discpercent: 0 }];
      }
    });
  };
  return (
    <Card className='p-2 flex-row hover:scale-105 transition-transform duration-300' onClick={() => cardClick(productid, name, price, type)}>
      <img src='/wonder.png' alt='' className='w-full h-24 object-cover rounded-lg' />
      <p className='my-2'>{name}</p>
      <div className='flex justify-between'>
        <p className='text-xs text-gray-500'>{price}</p>
        <p className='text-xs text-gray-500'>{type}</p>
      </div>
    </Card>
  );
}
