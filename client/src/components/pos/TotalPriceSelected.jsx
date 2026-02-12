export default function TotalPriceSelected({ selectedData, setSelectedData }) {
  const subTotalPrice = selectedData.reduce((total, item) => total + item.subPrice * 1, 0).toFixed(2);

  return (
    <div className='m-4'>
      <hr />
      <div className='flex justify-between font-semibold '>
        <p>Total</p>
        <p>${subTotalPrice}</p>
      </div>
    </div>
  );
}
