export default function InventorySelectedHeader() {
  return (
    <div className=' justify-between bg-slate-100  rounded-md grid lg:grid-cols-7 gap-2 '>
      <p className='col-span-3 text-center w-full bg-purple-950/10'>Item</p>
      <p className='text-center w-full col-span'>Subprice</p>
      <p className='text-center w-full col-span-2 bg-purple-950/10'>Discount</p>
      <p className='text-center w-full col-span'>Price</p>
    </div>
  );
}
