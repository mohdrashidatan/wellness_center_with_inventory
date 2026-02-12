export default function InterestSelection({ interestsList, interests, toggleInterest }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
      {interestsList?.map((item) => (
        <label key={item.id} className='inline-flex items-center'>
          <input type='checkbox' className='mr-2' checked={interests[item.id] || false} onChange={() => toggleInterest(item.id)} />
          {item.productName}
        </label>
      ))}
      {interests["Other / 其他"] && <input type='text' placeholder='Please specify' className='mt-1 border rounded px-2 py-1 col-span-full' />}
    </div>
  );
}
