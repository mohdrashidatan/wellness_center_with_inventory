export default function SearcBar({ handleSearch }) {
  return (
    <div className='flex flex-col sm:flex-row w-30 gap-2'>
      <div className='flex w-full max-w-xl'>
        <input type='text' placeholder='Search' className='flex-1 border border-gray-400 border-r-0 rounded-l-2xl px-3 py-2 focus:outline-none' onChange={handleSearch} />
        <select className='border border-gray-400 border-l-0 rounded-r-2xl px-3 py-2 focus:outline-none bg-white'>
          <option value=''>All</option>
          <option value='latest'>Latest</option>
          <option value='popular'>Popular</option>
        </select>
      </div>
      <button className='bg-prime-color text-white px-4 py-2 rounded-2xl w-full sm:w-auto'>Search</button>{" "}
    </div>
  );
}
